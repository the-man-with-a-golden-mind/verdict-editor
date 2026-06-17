-- | Render a Verdict module's AST (as produced by the compiler's `astJS`) into
-- | nested, Blockly/Scratch-style HTML blocks — a read-only structural sketch of
-- | the code for the editor's "Visual" tab.
-- |
-- | The AST arrives as a `Foreign` tagged-object tree (`{ tag: "EIf", ... }`).
-- | We walk it directly, dispatching on `tag`, building HTML as we go. Layout is
-- | pure CSS flex (Tailwind classes), so the browser handles measure-and-place.
module CodeBlocks (renderInto) where

import Prelude

import Control.Monad.Except (runExcept)
import Data.Array as Array
import Data.Either (hush)
import Data.Foldable (any, traverse_)
import Data.Maybe (Maybe(..), fromMaybe, isNothing, maybe)
import Data.String (Pattern(..), contains) as Str
import Data.String.Common (joinWith)
import Data.Traversable (traverse)
import Effect (Effect)
import Foreign (Foreign, readArray, readBoolean, readInt, readString)
import Foreign.Index (readProp)
import BlockDom (El, appendChild, createEl, mount, setAttr, setClassName, setText)

--------------------------------------------------------------------------------
-- Entry point
--------------------------------------------------------------------------------

-- | Decode the AST object and mount the rendered blocks into `selector`.
renderInto :: String -> Foreign -> Effect Unit
renderInto selector ast = do
  root <- renderModule ast
  mount selector root

--------------------------------------------------------------------------------
-- Foreign decoding helpers
--------------------------------------------------------------------------------

prop :: String -> Foreign -> Maybe Foreign
prop k f = hush (runExcept (readProp k f))

strProp :: String -> Foreign -> Maybe String
strProp k f = hush (runExcept (readProp k f >>= readString))

intProp :: String -> Foreign -> Maybe Int
intProp k f = hush (runExcept (readProp k f >>= readInt))

boolProp :: String -> Foreign -> Maybe Boolean
boolProp k f = hush (runExcept (readProp k f >>= readBoolean))

arrProp :: String -> Foreign -> Array Foreign
arrProp k f = fromMaybe [] (hush (runExcept (readProp k f >>= readArray)))

forceStr :: Foreign -> String
forceStr f = fromMaybe "" (hush (runExcept (readString f)))

tagOf :: Foreign -> String
tagOf f = fromMaybe "?" (strProp "tag" f)

--------------------------------------------------------------------------------
-- DOM building helpers
--------------------------------------------------------------------------------

node :: String -> String -> Array El -> Effect El
node tag cls kids = do
  e <- createEl tag
  setClassName cls e
  traverse_ (\k -> appendChild k e) kids
  pure e

leaf :: String -> String -> String -> Effect El
leaf tag cls s = do
  e <- createEl tag
  setClassName cls e
  setText s e
  pure e

-- | Insert comma separators between rendered children.
commaSep :: Array El -> Effect (Array El)
commaSep els = case Array.uncons els of
  Nothing -> pure []
  Just { head, tail } -> do
    rest <- traverse withComma tail
    pure (Array.cons head (Array.concat rest))
  where
  withComma e = do
    c <- leaf "span" "text-slate-500 mr-0.5" ","
    pure [ c, e ]

--------------------------------------------------------------------------------
-- Style constants
--------------------------------------------------------------------------------

rootCls :: String
rootCls = "flex flex-col gap-4 p-4 text-[13px] font-mono leading-relaxed text-slate-200"

cardCls :: String
cardCls = "rounded-lg border border-slate-700 bg-slate-900/60 overflow-hidden"

cardHeadCls :: String
cardHeadCls = "flex items-baseline gap-2 border-b border-slate-700 bg-slate-800/60 px-3 py-2"

blockCls :: String
blockCls = "rounded-md border border-slate-700/70 bg-slate-800/40 p-2"

badgeCls :: String
badgeCls = "rounded bg-slate-700/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300"

--------------------------------------------------------------------------------
-- Module / declarations
--------------------------------------------------------------------------------

renderModule :: Foreign -> Effect El
renderModule m = do
  let
    types = arrProp "types" m
    decls = arrProp "decls" m
  if Array.null types && Array.null decls then do
    hint <- leaf "div" "p-4 text-slate-500 italic" "No definitions to show yet."
    node "div" rootCls [ hint ]
  else do
    typeEls <- traverse renderTypeDecl types
    declEls <- traverse renderDecl decls
    node "div" rootCls (typeEls <> declEls)

renderTypeDecl :: Foreign -> Effect El
renderTypeDecl t = do
  let
    name = fromMaybe "?" (strProp "name" t)
    params = map forceStr (arrProp "params" t)
    header = "type " <> name <> (if Array.null params then "" else " " <> joinWith " " params)
  headEl <- leaf "div" (cardHeadCls <> " font-bold text-amber-300") header
  ctorEls <- traverse renderCtor (arrProp "ctors" t)
  body <- node "div" "flex flex-wrap gap-2 p-3" ctorEls
  node "div" cardCls [ headEl, body ]

renderCtor :: Foreign -> Effect El
renderCtor c = do
  let
    name = fromMaybe "?" (strProp "name" c)
    fields = map tyToText (arrProp "fields" c)
    label = name <> (if Array.null fields then "" else " " <> joinWith " " fields)
  leaf "span" "rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-amber-200" label

renderDecl :: Foreign -> Effect El
renderDecl d = do
  let
    name = fromMaybe "?" (strProp "name" d)
    params = map forceStr (arrProp "params" d)
  nameEl <- leaf "span" "font-bold text-indigo-300" name
  headKids <-
    if Array.null params then pure [ nameEl ]
    else do
      pEl <- leaf "span" "text-slate-400 italic" (joinWith " " params)
      pure [ nameEl, pEl ]
  sigKids <- case prop "sig" d of
    Just s | not (isNothing (strProp "tag" s)) -> do
      sigEl <- leaf "span" "ml-auto text-[11px] text-slate-500" (": " <> tyToText s)
      pure [ sigEl ]
    _ -> pure []
  -- `<details>` gives free collapse/expand; `data-def` is the arrow target and
  -- the key the host uses to preserve collapsed state across re-renders.
  summaryEl <- node "summary" (cardHeadCls <> " list-none cursor-pointer select-none") (headKids <> sigKids)
  bodyEl <- maybe (leaf "div" "p-3 text-slate-500" "—") renderExpr (prop "body" d)
  bodyWrap <- node "div" "p-3" [ bodyEl ]
  card <- node "details" cardCls [ summaryEl, bodyWrap ]
  setAttr "open" "" card
  setAttr "data-def" name card
  pure card

--------------------------------------------------------------------------------
-- Expressions
--------------------------------------------------------------------------------

-- | Unwrap `EAt` position wrappers, attaching the source line for click-to-source.
renderExpr :: Foreign -> Effect El
renderExpr f0 = do
  e <- renderExprInner (unwrapAt f0)
  case atLine f0 of
    Just l -> do
      setAttr "data-src-line" (show l) e
      pure e
    Nothing -> pure e

unwrapAt :: Foreign -> Foreign
unwrapAt f = case tagOf f of
  "EAt" -> maybe f unwrapAt (prop "expr" f)
  _ -> f

atLine :: Foreign -> Maybe Int
atLine f = case prop "pos" f of
  Just pos -> intProp "line" pos
  Nothing -> Nothing

renderExprInner :: Foreign -> Effect El
renderExprInner f = case tagOf f of
  "ELit" -> leaf "span" "rounded px-1 text-amber-300" (maybe "?" litText (prop "lit" f))
  "EVar" -> leaf "span" "text-slate-200" (fromMaybe "?" (strProp "name" f))
  "EBin" -> renderBinary f
  "ECmp" -> renderBinary f
  "EIf" -> renderIf f
  "ELet" -> renderLet f
  "ECall" -> renderCall true "text-sky-300 border-sky-500/40 bg-sky-500/10" f
  "EBuiltin" -> renderCall false (builtinColor (fromMaybe "" (strProp "name" f))) f
  "EList" -> renderList f
  "ERecord" -> renderRecord f
  "EField" -> renderField f
  "EMatch" -> renderMatch f
  "ESwitch" -> renderSwitch f
  other -> leaf "span" "text-rose-400" other

renderBinary :: Foreign -> Effect El
renderBinary f = do
  l <- renderChild "left" f
  r <- renderChild "right" f
  opEl <- leaf "span" "px-1 text-slate-400" (fromMaybe "?" (strProp "op" f))
  node "div" "inline-flex items-center gap-1" [ l, opEl, r ]

renderIf :: Foreign -> Effect El
renderIf f = do
  ifBadge <- leaf "span" (badgeCls <> " bg-violet-600/40 text-violet-200") "IF"
  cond <- renderChild "cond" f
  condRow <- node "div" "mb-1 flex flex-wrap items-center gap-2" [ ifBadge, cond ]
  thenE <- renderChild "then" f
  thenLane <- lane "THEN" "border-emerald-500/60 text-emerald-300" thenE
  elseE <- renderChild "else" f
  elseLane <- lane "ELSE" "border-rose-500/60 text-rose-300" elseE
  node "div" blockCls [ condRow, thenLane, elseLane ]

-- | A labelled, colour-barred branch lane.
lane :: String -> String -> El -> Effect El
lane label barCls child = do
  lbl <- leaf "div" ("text-[10px] font-bold uppercase tracking-wide " <> barCls) label
  body <- node "div" "mt-1" [ child ]
  node "div" ("my-1 border-l-2 pl-2 " <> barCls) [ lbl, body ]

renderLet :: Foreign -> Effect El
renderLet f = do
  let collected = collectLets f
  bindEls <- traverse renderBind collected.binds
  resLbl <- leaf "div" "text-[10px] font-bold uppercase tracking-wide text-slate-500" "result"
  bodyEl <- renderExpr collected.body
  resWrap <- node "div" "mt-1" [ bodyEl ]
  node "div" blockCls (bindEls <> [ resLbl, resWrap ])

renderBind :: { name :: String, value :: Foreign } -> Effect El
renderBind b = do
  nameEl <- leaf "span" "shrink-0 text-cyan-300" ("let " <> b.name <> " =")
  valEl <- renderExpr b.value
  node "div" "mb-1 flex flex-wrap items-start gap-2" [ nameEl, valEl ]

collectLets :: Foreign -> { binds :: Array { name :: String, value :: Foreign }, body :: Foreign }
collectLets = go []
  where
  go acc f = case tagOf f of
    "ELet" ->
      let
        nm = fromMaybe "?" (strProp "name" f)
        val = fromMaybe f (prop "value" f)
        bod = unwrapAt (fromMaybe f (prop "body" f))
      in
        go (Array.snoc acc { name: nm, value: val }) bod
    _ -> { binds: acc, body: f }

-- | `isCall` marks a user-function call (`data-call`) so the host can draw a
-- | dependency arrow to that definition's card; builtins have no target card.
renderCall :: Boolean -> String -> Foreign -> Effect El
renderCall isCall colorCls f = do
  let
    name = fromMaybe "?" (strProp "name" f)
    args = arrProp "args" f
  nameEl <- leaf "span" ("rounded border px-1.5 py-0.5 text-xs font-semibold " <> colorCls) name
  when isCall (setAttr "data-call" name nameEl)
  if Array.null args then pure nameEl
  else do
    argEls <- traverse renderExpr args
    sep <- commaSep argEls
    lp <- leaf "span" "text-slate-500" "("
    rp <- leaf "span" "text-slate-500" ")"
    node "div" "inline-flex flex-wrap items-center gap-1" ([ nameEl, lp ] <> sep <> [ rp ])

renderList :: Foreign -> Effect El
renderList f = do
  itemEls <- traverse renderExpr (arrProp "items" f)
  sep <- commaSep itemEls
  lb <- leaf "span" "text-slate-500" "["
  rb <- leaf "span" "text-slate-500" "]"
  node "div" "inline-flex flex-wrap items-center gap-1 rounded border border-slate-700/70 px-1" ([ lb ] <> sep <> [ rb ])

renderRecord :: Foreign -> Effect El
renderRecord f = do
  rowEls <- traverse renderRecordField (arrProp "fields" f)
  node "div" "flex flex-col gap-0.5 rounded border border-slate-700/70 px-2 py-1" rowEls

renderRecordField :: Foreign -> Effect El
renderRecordField rf = do
  let name = fromMaybe "?" (strProp "name" rf)
  k <- leaf "span" "shrink-0 text-cyan-300" (name <> " =")
  v <- renderChild "value" rf
  node "div" "flex flex-wrap items-center gap-1" [ k, v ]

renderField :: Foreign -> Effect El
renderField f = do
  e <- renderChild "expr" f
  dot <- leaf "span" "text-slate-400" ("." <> fromMaybe "?" (strProp "field" f))
  node "div" "inline-flex items-center" [ e, dot ]

renderMatch :: Foreign -> Effect El
renderMatch f = do
  mBadge <- leaf "span" (badgeCls <> " bg-violet-600/40 text-violet-200") "MATCH"
  scrut <- renderChild "scrutinee" f
  headRow <- node "div" "mb-1 flex flex-wrap items-center gap-2" [ mBadge, scrut ]
  armEls <- traverse renderMatchArm (arrProp "arms" f)
  node "div" blockCls (Array.cons headRow armEls)

renderMatchArm :: Foreign -> Effect El
renderMatchArm a = do
  let patt = maybe "_" patternText (prop "pattern" a)
  pEl <- leaf "div" "text-[11px] font-bold text-emerald-300" (patt <> " →")
  body <- renderChild "body" a
  bodyWrap <- node "div" "mt-1" [ body ]
  node "div" "my-1 border-l-2 border-emerald-500/40 pl-2" [ pEl, bodyWrap ]

renderSwitch :: Foreign -> Effect El
renderSwitch f = do
  sBadge <- leaf "span" (badgeCls <> " bg-violet-600/40 text-violet-200") "SWITCH"
  scrut <- renderChild "scrutinee" f
  headRow <- node "div" "mb-1 flex flex-wrap items-center gap-2" [ sBadge, scrut ]
  armEls <- traverse renderSwitchArm (arrProp "arms" f)
  node "div" blockCls (Array.cons headRow armEls)

renderSwitchArm :: Foreign -> Effect El
renderSwitchArm a = do
  let
    label = case prop "match" a of
      Just m | not (isNothing (strProp "tag" m)) -> litText m
      _ -> "default"
  pEl <- leaf "div" "text-[11px] font-bold text-emerald-300" (label <> " →")
  body <- renderChild "body" a
  bodyWrap <- node "div" "mt-1" [ body ]
  node "div" "my-1 border-l-2 border-emerald-500/40 pl-2" [ pEl, bodyWrap ]

-- | Render the expression at key `k`, or a placeholder if absent.
renderChild :: String -> Foreign -> Effect El
renderChild k f = maybe (leaf "span" "text-slate-600" "?") renderExpr (prop k f)

--------------------------------------------------------------------------------
-- Leaf text renderers
--------------------------------------------------------------------------------

litText :: Foreign -> String
litText l = case tagOf l of
  "LInt" -> fromMaybe "?" (strProp "value" l)
  "LFixed" -> fromMaybe "?" (strProp "value" l)
  "LRational" -> fromMaybe "?" (strProp "numerator" l) <> "/" <> fromMaybe "?" (strProp "denominator" l)
  "LBool" -> maybe "?" show (boolProp "value" l)
  "LStr" -> "\"" <> fromMaybe "" (strProp "value" l) <> "\""
  "LUnit" -> "unit"
  _ -> "?"

patternText :: Foreign -> String
patternText p = case tagOf p of
  "PWild" -> "_"
  "PCtor" ->
    let
      ctor = fromMaybe "?" (strProp "ctor" p)
      vars = map forceStr (arrProp "vars" p)
    in
      if Array.null vars then ctor else ctor <> " " <> joinWith " " vars
  _ -> "?"

tyToText :: Foreign -> String
tyToText t = case tagOf t of
  "TInt" -> "Int"
  "TFixed" -> "Fixed"
  "TRational" -> "Rational"
  "TBool" -> "Bool"
  "TString" -> "String"
  "TUnit" -> "Unit"
  "TPid" -> "Pid"
  "TUnknown" -> "?"
  "TVar" -> fromMaybe "a" (strProp "name" t)
  "TList" -> "[" <> maybe "?" tyToText (prop "elem" t) <> "]"
  "TArrow" -> maybe "?" tyToText (prop "from" t) <> " → " <> maybe "?" tyToText (prop "to" t)
  "TData" ->
    let
      name = fromMaybe "?" (strProp "name" t)
      args = map tyToText (arrProp "args" t)
    in
      if Array.null args then name else name <> " " <> joinWith " " args
  "TRecord" -> "{ " <> joinWith ", " (map tyFieldText (arrProp "fields" t)) <> " }"
  _ -> "?"

tyFieldText :: Foreign -> String
tyFieldText f = fromMaybe "?" (strProp "name" f) <> " : " <> maybe "?" tyToText (prop "type" f)

-- | Colour a builtin/effect chip by its capability namespace.
builtinColor :: String -> String
builtinColor name
  | hasSub [ "db", "Db", "persist", "insert", "query" ] name = "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
  | hasSub [ "http", "Http", "fetch", "get", "post" ] name = "text-blue-300 border-blue-500/40 bg-blue-500/10"
  | hasSub [ "cache", "Cache" ] name = "text-amber-300 border-amber-500/40 bg-amber-500/10"
  | hasSub [ "notify", "telegram", "send", "log", "sys" ] name = "text-purple-300 border-purple-500/40 bg-purple-500/10"
  | otherwise = "text-slate-300 border-slate-500/40 bg-slate-500/10"

hasSub :: Array String -> String -> Boolean
hasSub subs name = any (\sub -> Str.contains (Str.Pattern sub) name) subs
