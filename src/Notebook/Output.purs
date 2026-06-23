module Notebook.Output
  ( renderOutputInto
  ) where

import Prelude

import Data.Array (mapWithIndex)
import Effect (Effect)
import Effect.Uncurried (EffectFn3, mkEffectFn3)
import Foreign (Foreign)
import PsSpa.Html as H
import PsSpa.View (Document)

-- FFI: the diffing element-render (ps-spa reconcile, no wipe), the leaf filler
-- (charts/tables/sheets/markdown), and small generic readers over the Foreign.
foreign import renderStructure :: Foreign -> Document (Effect Unit) -> Effect Unit
foreign import syncLeavesImpl :: Foreign -> Foreign -> Foreign -> Effect Unit
foreign import readKind :: Foreign -> String
foreign import readStr :: Foreign -> String -> String
foreign import readArr :: Foreign -> String -> Array Foreign
foreign import readField :: Foreign -> String -> Foreign
foreign import readIntField :: Foreign -> String -> Int -> Int

-- (host, raw Display Json, bridge) -> render the structure (diffed in place) then
-- fill the leaf widgets. Charts keep their zoom (ChartManager) and the stable
-- structure means scroll/focus survive — no patches needed.
renderOutputInto :: EffectFn3 Foreign Foreign Foreign Unit
renderOutputInto = mkEffectFn3 \host raw bridge -> do
  renderStructure host { title: "", body: [ viewDisplay "" false "r" raw ] }
  syncLeavesImpl host raw bridge

-- Append a user-supplied (dBox) class onto a node's base classes.
mergeCls :: String -> String -> String
mergeCls base extra =
  if extra == "" then base
  else if base == "" then extra
  else base <> " " <> extra

-- The Display tree -> ps-spa Html. Leaves (text/chart/table/sheet) are stable
-- keyed placeholders the FFI fills (keyed by the same path); layouts are pure
-- structure. `extra` carries dBox styling merged down onto the wrapped node.
viewDisplay :: String -> Boolean -> String -> Foreign -> H.Html (Effect Unit)
viewDisplay extra inRow key node =
  case readKind node of
    "box" -> viewDisplay (mergeCls extra (readStr node "class")) inRow key (readField node "child")
    "text" ->
      H.node "div"
        [ H.className (mergeCls "prose-invert text-sm text-slate-200 leading-relaxed notebook-text-output" extra)
        , H.dataAttr "text-key" key
        ]
        []
    "chart" ->
      H.node "div"
        [ H.className (mergeCls (if inRow then "min-h-[300px] w-full notebook-chart--row" else "min-h-[320px] w-full") extra)
        , H.dataAttr "chart-key" key
        , H.dataAttr "plotly-chart" "1"
        ]
        []
    "table" -> H.node "div" [ H.className (mergeCls "" extra), H.dataAttr "table-key" key ] []
    "sheet" -> H.node "div" [ H.className (mergeCls "" extra), H.dataAttr "sheet-key" key ] []
    "stack" -> layoutNode extra "flex flex-col gap-6 notebook-stack" "displayStack" false key node
    "col" -> layoutNode extra "flex flex-col gap-6 notebook-display-col" "displayCol" false key node
    "row" -> layoutNode extra "flex flex-row flex-wrap gap-5 notebook-display-row" "displayRow" true key node
    "grid" -> gridNode extra key node
    "section" -> sectionNode extra key node
    _ -> H.node "div" [] []

headingEls :: Foreign -> Array (H.Html (Effect Unit))
headingEls node =
  if readStr node "title" == "" then []
  else
    [ H.node "div"
        [ H.className "text-sm font-semibold text-slate-100 notebook-display-heading" ]
        [ H.text (readStr node "title") ]
    ]

layoutNode :: String -> String -> String -> Boolean -> String -> Foreign -> H.Html (Effect Unit)
layoutNode extra cls ds isRow key node =
  H.node "div"
    [ H.className (mergeCls cls extra), H.dataAttr ds "1" ]
    (headingEls node <> mapWithIndex (childAt isRow key) (readArr node "items"))

childAt :: Boolean -> String -> Int -> Foreign -> H.Html (Effect Unit)
childAt isRow key i node =
  let
    h = viewDisplay "" isRow (key <> "/" <> show i) node
  in
    if isRow then H.node "div" [ H.className "notebook-display-row__item min-w-[min(100%,380px)] flex-1" ] [ h ]
    else h

gridNode :: String -> String -> Foreign -> H.Html (Effect Unit)
gridNode extra key node =
  H.node "div"
    [ H.className (mergeCls ("grid gap-5 " <> gridColsCls (readIntField node "cols" 2)) extra)
    , H.dataAttr "displayGrid" "1"
    ]
    (mapWithIndex (\i n -> viewDisplay "" false (key <> "/" <> show i) n) (readArr node "items"))

gridColsCls :: Int -> String
gridColsCls n = case n of
  1 -> "grid-cols-1"
  3 -> "grid-cols-1 md:grid-cols-3"
  4 -> "grid-cols-2 md:grid-cols-4"
  _ -> "grid-cols-1 md:grid-cols-2"

sectionNode :: String -> String -> Foreign -> H.Html (Effect Unit)
sectionNode extra key node =
  H.node "div"
    [ H.className (mergeCls "rounded-lg border border-slate-800 bg-slate-950/40 overflow-hidden" extra)
    , H.dataAttr "displaySection" "1"
    ]
    [ H.node "div"
        [ H.className "border-b border-slate-800/80 bg-slate-900/60 px-3 py-2 text-sm font-semibold text-slate-200" ]
        [ H.text (readStr node "title") ]
    , H.node "div"
        [ H.className "p-3 flex flex-col gap-6" ]
        (mapWithIndex (\i n -> viewDisplay "" false (key <> "/" <> show i) n) (readArr node "items"))
    ]
