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
-- (charts/tables/markdown), and small readers over the Display Foreign.
foreign import renderStructure :: Foreign -> Document (Effect Unit) -> Effect Unit
foreign import syncLeavesImpl :: Foreign -> Foreign -> Foreign -> Effect Unit
foreign import readKind :: Foreign -> String
foreign import readTitle :: Foreign -> String
foreign import readItems :: Foreign -> Array Foreign

-- (host, raw Display Json, bridge) -> render the structure (diffed in place) then
-- fill the leaf widgets. Charts keep their zoom (ChartManager react+uirevision)
-- and the stable structure means scroll/focus survive — no patches needed.
renderOutputInto :: EffectFn3 Foreign Foreign Foreign Unit
renderOutputInto = mkEffectFn3 \host raw bridge -> do
  renderStructure host { title: "", body: [ viewDisplay false "r" raw ] }
  syncLeavesImpl host raw bridge

-- The Display tree -> ps-spa Html. Text/chart/table are stable keyed placeholders
-- (filled by syncLeavesImpl, keyed by the same path); layouts are pure structure.
viewDisplay :: Boolean -> String -> Foreign -> H.Html (Effect Unit)
viewDisplay inRow key raw =
  case readKind raw of
    "text" ->
      H.node "div"
        [ H.className "prose-invert text-sm text-slate-200 leading-relaxed notebook-text-output"
        , H.dataAttr "text-key" key
        ]
        []
    "chart" ->
      H.node "div"
        [ H.className (if inRow then "min-h-[300px] w-full notebook-chart--row" else "min-h-[320px] w-full")
        , H.dataAttr "chart-key" key
        , H.dataAttr "plotly-chart" "1"
        ]
        []
    "table" ->
      H.node "div" [ H.dataAttr "table-key" key ] []
    "stack" -> layout "flex flex-col gap-6 notebook-stack" "displayStack" false key raw
    "col" -> layout "flex flex-col gap-6 notebook-display-col" "displayCol" false key raw
    "row" -> layout "flex flex-row flex-wrap gap-5 notebook-display-row" "displayRow" true key raw
    _ -> H.node "div" [] []

layout :: String -> String -> Boolean -> String -> Foreign -> H.Html (Effect Unit)
layout cls ds isRow key raw =
  H.node "div"
    [ H.className cls, H.dataAttr ds "1" ]
    (heading <> mapWithIndex child (readItems raw))
  where
  heading =
    if readTitle raw == "" then []
    else
      [ H.node "div"
          [ H.className "text-sm font-semibold text-slate-100 notebook-display-heading" ]
          [ H.text (readTitle raw) ]
      ]
  child i node =
    let
      h = viewDisplay isRow (key <> "/" <> show i) node
    in
      if isRow then H.node "div" [ H.className "notebook-display-row__item min-w-[min(100%,380px)] flex-1" ] [ h ]
      else h
