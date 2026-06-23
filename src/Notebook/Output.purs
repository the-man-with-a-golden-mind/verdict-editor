module Notebook.Output
  ( renderOutputInto
  ) where

import Prelude

import Data.Array (mapWithIndex, (!!))
import Data.Maybe (Maybe(..))
import Effect (Effect)
import Effect.Uncurried (EffectFn3, mkEffectFn3)
import Foreign (Foreign)
import PsSpa.Html as H
import PsSpa.View (Document)

-- FFI: the diffing element-render, the leaf filler, per-host state (so events
-- re-render), small Foreign readers, and the CSV export.
foreign import renderStructure :: Foreign -> Document (Effect Unit) -> Effect Unit
foreign import syncLeavesImpl :: Foreign -> Foreign -> Foreign -> Effect Unit
foreign import storeState :: Foreign -> Foreign -> Foreign -> Effect Unit
foreign import readRaw :: Foreign -> Foreign
foreign import readBridge :: Foreign -> Foreign
foreign import getUiInt :: Foreign -> String -> Int -> Int
foreign import setUiInt :: Foreign -> String -> Int -> Effect Unit
foreign import getUiBool :: Foreign -> String -> Boolean -> Boolean
foreign import setUiBool :: Foreign -> String -> Boolean -> Effect Unit
foreign import exportSheetCsv :: Foreign -> Effect Unit
foreign import readKind :: Foreign -> String
foreign import readStr :: Foreign -> String -> String
foreign import readArr :: Foreign -> String -> Array Foreign
foreign import readField :: Foreign -> String -> Foreign
foreign import readIntField :: Foreign -> String -> Int -> Int

-- (host, raw Display Json, bridge): store the inputs on the host (so tab/fullscreen
-- events can re-render), then render. UI state persists across live emits.
renderOutputInto :: EffectFn3 Foreign Foreign Foreign Unit
renderOutputInto = mkEffectFn3 \host raw bridge -> do
  storeState host raw bridge
  renderNow host

-- Re-render from the stored raw + ui state (the mini-TEA loop): structure diffed
-- in place, then leaves filled. Called on first render and on every UI event.
renderNow :: Foreign -> Effect Unit
renderNow host = do
  let raw = readRaw host
  renderStructure host { title: "", body: [ viewDisplay host "" false "r" raw ] }
  syncLeavesImpl host raw (readBridge host)

-- Append a user-supplied (dBox) class onto a node's base classes.
mergeCls :: String -> String -> String
mergeCls base extra =
  if extra == "" then base
  else if base == "" then extra
  else base <> " " <> extra

-- The Display tree -> ps-spa Html. Leaves (text/chart/table/sheet) are stable
-- keyed placeholders the FFI fills; layouts are pure structure; box merges
-- styling; full/tabs are interactive (state on the host, re-render on click).
viewDisplay :: Foreign -> String -> Boolean -> String -> Foreign -> H.Html (Effect Unit)
viewDisplay host extra inRow key node =
  case readKind node of
    "box" -> viewDisplay host (mergeCls extra (readStr node "cls")) inRow key (readField node "child")
    "full" -> fullView host extra inRow key node
    "tabs" -> tabsView host extra key node
    "text" ->
      H.node "div"
        [ H.className (mergeCls "prose-invert notebook-text-output" extra), H.dataAttr "text-key" key ]
        []
    "chart" ->
      H.node "div"
        [ H.className (mergeCls (if inRow then "min-h-[300px] w-full notebook-chart--row" else "min-h-[320px] w-full") extra)
        , H.dataAttr "chart-key" key
        , H.dataAttr "plotly-chart" "1"
        ]
        []
    "table" -> H.node "div" [ H.className (mergeCls "" extra), H.dataAttr "table-key" key ] []
    "sheet" -> sheetView host extra key node
    "stack" -> layoutNode host extra "flex flex-col gap-6 notebook-stack" "displayStack" false key node
    "col" -> layoutNode host extra "flex flex-col gap-6 notebook-display-col" "displayCol" false key node
    "row" -> layoutNode host extra "flex flex-row flex-wrap gap-5 notebook-display-row" "displayRow" true key node
    "grid" -> gridNode host extra key node
    "section" -> sectionNode host extra key node
    _ -> H.node "div" [] []

headingEls :: Foreign -> Array (H.Html (Effect Unit))
headingEls node =
  if readStr node "title" == "" then []
  else
    [ H.node "div"
        [ H.className "text-sm font-semibold text-slate-100 notebook-display-heading" ]
        [ H.text (readStr node "title") ]
    ]

layoutNode :: Foreign -> String -> String -> String -> Boolean -> String -> Foreign -> H.Html (Effect Unit)
layoutNode host extra cls ds isRow key node =
  H.node "div"
    [ H.className (mergeCls cls extra), H.dataAttr ds "1" ]
    (headingEls node <> mapWithIndex (childAt host isRow key) (readArr node "items"))

childAt :: Foreign -> Boolean -> String -> Int -> Foreign -> H.Html (Effect Unit)
childAt host isRow key i node =
  let
    h = viewDisplay host "" isRow (key <> "/" <> show i) node
  in
    if isRow then H.node "div" [ H.className "notebook-display-row__item min-w-[min(100%,380px)] flex-1" ] [ h ]
    else h

gridNode :: Foreign -> String -> String -> Foreign -> H.Html (Effect Unit)
gridNode host extra key node =
  H.node "div"
    [ H.className (mergeCls ("grid gap-5 " <> gridColsCls (readIntField node "cols" 2)) extra)
    , H.dataAttr "displayGrid" "1"
    ]
    (mapWithIndex (\i n -> viewDisplay host "" false (key <> "/" <> show i) n) (readArr node "items"))

gridColsCls :: Int -> String
gridColsCls n = case n of
  1 -> "grid-cols-1"
  3 -> "grid-cols-1 md:grid-cols-3"
  4 -> "grid-cols-2 md:grid-cols-4"
  _ -> "grid-cols-1 md:grid-cols-2"

sectionNode :: Foreign -> String -> String -> Foreign -> H.Html (Effect Unit)
sectionNode host extra key node =
  H.node "div"
    [ H.className (mergeCls "rounded-lg border border-slate-800 bg-slate-950/40 overflow-hidden" extra)
    , H.dataAttr "displaySection" "1"
    ]
    [ H.node "div"
        [ H.className "border-b border-slate-800/80 bg-slate-900/60 px-3 py-2 text-sm font-semibold text-slate-200" ]
        [ H.text (readStr node "title") ]
    , H.node "div"
        [ H.className "p-3 flex flex-col gap-6" ]
        (mapWithIndex (\i n -> viewDisplay host "" false (key <> "/" <> show i) n) (readArr node "items"))
    ]

-- Fullscreen wrapper: a toggle; when on, the node fills a fixed overlay (charts
-- re-fit via their ResizeObserver). State keyed by path on the host.
fullView :: Foreign -> String -> Boolean -> String -> Foreign -> H.Html (Effect Unit)
fullView host extra inRow key node =
  let
    isFs = getUiBool host (key <> ":fs") false
    childH = viewDisplay host "" inRow (key <> "/0") (readField node "child")
    toggle =
      H.button
        [ H.className "rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300 hover:text-white"
        , H.attr "type" "button"
        , H.OnClick (toggleFs host key isFs)
        ]
        [ H.text (if isFs then "Exit" else "Fullscreen") ]
    wrapCls = if isFs then "fixed inset-0 z-50 overflow-auto bg-slate-950 p-6" else "relative"
  in
    H.node "div" [ H.className (mergeCls wrapCls extra) ]
      [ H.node "div" [ H.className "mb-1 flex justify-end" ] [ toggle ], childH ]

toggleFs :: Foreign -> String -> Boolean -> Effect Unit
toggleFs host key isFs = do
  setUiBool host (key <> ":fs") (not isFs)
  renderNow host

-- Tabs: a tab bar + the active tab's content (presentational client state).
tabsView :: Foreign -> String -> String -> Foreign -> H.Html (Effect Unit)
tabsView host extra key node =
  let
    tabs = readArr node "tabs"
    active = getUiInt host (key <> ":tab") 0
    btn i tab =
      H.button
        [ H.className
            ( if i == active then "px-3 py-1 text-xs font-semibold text-indigo-300 border-b-2 border-indigo-400"
              else "px-3 py-1 text-xs text-slate-400 hover:text-white"
            )
        , H.attr "type" "button"
        , H.OnClick (selectTab host key i)
        ]
        [ H.text (readStr tab "label") ]
    content = case tabs !! active of
      Just tab -> viewDisplay host "" false (key <> "/" <> show active) (readField tab "content")
      Nothing -> H.node "div" [] []
  in
    H.node "div" [ H.className (mergeCls "flex flex-col gap-2" extra) ]
      [ H.node "div" [ H.className "flex gap-1 border-b border-slate-800" ] (mapWithIndex btn tabs)
      , content
      ]

selectTab :: Foreign -> String -> Int -> Effect Unit
selectTab host key i = do
  setUiInt host (key <> ":tab") i
  renderNow host

-- Sheet: an export toolbar over the spreadsheet leaf (filled by the FFI).
sheetView :: Foreign -> String -> String -> Foreign -> H.Html (Effect Unit)
sheetView host extra key node =
  H.node "div" [ H.className (mergeCls "flex flex-col gap-1" extra) ]
    [ H.node "div" [ H.className "flex justify-end" ]
        [ H.button
            [ H.className "rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300 hover:text-white"
            , H.attr "type" "button"
            , H.OnClick (exportSheetCsv node)
            ]
            [ H.text "Export CSV" ]
        ]
    , H.node "div" [ H.dataAttr "sheet-key" key ] []
    ]
