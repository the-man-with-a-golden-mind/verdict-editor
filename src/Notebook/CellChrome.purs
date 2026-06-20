module Notebook.CellChrome
  ( HeadProps
  , Diag
  , FoldedProps
  , viewCellHead
  , viewDiagnostics
  , viewCodeFoldedBar
  , viewFoldedPreview
  , mountCellHeadExport
  , mountDiagnosticsExport
  , mountCodeFoldedBarExport
  , mountFoldedPreviewExport
  ) where

import Prelude hiding (div)

import Effect (Effect)
import Effect.Uncurried (EffectFn2, mkEffectFn2)
import Foreign (Foreign)
import PsSpa.Html as H
import PsSpa.View (Document)

-- | Cell header: a clickable title (focuses the cell) and a kind label badge.
type HeadProps =
  { preview :: String
  , label :: String
  , onFocus :: Effect Unit
  }

-- | One diagnostic line: 1-based source line + message.
type Diag =
  { line :: Int
  , message :: String
  }

-- | Folded-cell preview: the single preview line, clickable to expand.
type FoldedProps =
  { preview :: String
  , onExpand :: Effect Unit
  }

viewCellHead :: HeadProps -> Document (Effect Unit)
viewCellHead props =
  { title: ""
  , body:
      [ H.div
          [ H.className "flex min-h-[2rem] items-center justify-between border-b border-slate-800/70 px-3 py-1" ]
          [ H.button
              [ H.className "min-w-0 truncate text-left font-mono text-[11px] text-slate-400 hover:text-slate-200"
              , H.attr "type" "button"
              , H.OnClick props.onFocus
              ]
              [ H.text props.preview ]
          , H.node "span"
              [ H.className "ml-3 shrink-0 rounded border border-slate-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500" ]
              [ H.text props.label ]
          ]
      ]
  }

viewDiagnostics :: Array Diag -> Document (Effect Unit)
viewDiagnostics diags =
  { title: ""
  , body: map diagLine diags
  }

diagLine :: Diag -> H.Html (Effect Unit)
diagLine d =
  H.div
    [ H.className "text-xs text-rose-400 font-mono"
    , H.dataAttr "cell-diag" "1"
    ]
    [ H.text ("Line " <> show d.line <> ": " <> d.message) ]

viewCodeFoldedBar :: Effect Unit -> Document (Effect Unit)
viewCodeFoldedBar onShow =
  { title: ""
  , body:
      [ H.div
          [ H.className "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[11px] italic text-slate-500 hover:text-slate-300"
          , H.OnClick onShow
          ]
          [ H.text "⟨ code hidden — click to show ⟩" ]
      ]
  }

viewFoldedPreview :: FoldedProps -> Document (Effect Unit)
viewFoldedPreview props =
  { title: ""
  , body:
      [ H.div
          [ H.className "notebook-cell-folded-head flex min-h-[2rem] min-w-0 items-center px-2 py-1" ]
          [ H.div
              [ H.className "min-w-0 flex-1 truncate font-mono text-xs text-slate-400 cursor-pointer hover:text-slate-200"
              , H.titleAttr "Click to expand cell"
              , H.OnClick props.onExpand
              ]
              [ H.text props.preview ]
          ]
      ]
  }

foreign import renderChromePs :: Foreign -> Document (Effect Unit) -> Effect Unit

mountCellHeadExport :: EffectFn2 Foreign HeadProps Unit
mountCellHeadExport = mkEffectFn2 \host props ->
  renderChromePs host (viewCellHead props)

mountDiagnosticsExport :: EffectFn2 Foreign (Array Diag) Unit
mountDiagnosticsExport = mkEffectFn2 \host diags ->
  renderChromePs host (viewDiagnostics diags)

mountCodeFoldedBarExport :: EffectFn2 Foreign (Effect Unit) Unit
mountCodeFoldedBarExport = mkEffectFn2 \host onShow ->
  renderChromePs host (viewCodeFoldedBar onShow)

mountFoldedPreviewExport :: EffectFn2 Foreign FoldedProps Unit
mountFoldedPreviewExport = mkEffectFn2 \host props ->
  renderChromePs host (viewFoldedPreview props)
