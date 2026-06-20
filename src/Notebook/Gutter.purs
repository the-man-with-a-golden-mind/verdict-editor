module Notebook.Gutter
  ( GutterProps
  , MenuItem
  , viewGutter
  , mountGutterExport
  ) where

import Prelude hiding (div)

import Effect (Effect)
import Effect.Uncurried (EffectFn2, mkEffectFn2)
import Foreign (Foreign)
import PsSpa.Html as H
import PsSpa.View (Document)

-- | One entry in the cell's "⋯" overflow menu. `danger` flags destructive
-- | actions (e.g. Delete) so they render in red. `sepBefore` draws a divider
-- | above the item. `onClick` is a JS thunk (`Effect Unit` across FFI).
type MenuItem =
  { label :: String
  , danger :: Boolean
  , sepBefore :: Boolean
  , onClick :: Effect Unit
  }

-- | Everything the cell gutter needs to render itself from the Model. All
-- | handlers are plain JS callbacks (`Effect Unit` across the FFI boundary),
-- | so NotebookMount.js can pass `() => {...}` thunks directly.
type GutterProps =
  { number :: String
  , isRunnable :: Boolean
  , isRunning :: Boolean
  , isCodeCell :: Boolean
  , folded :: Boolean
  , codeFolded :: Boolean
  , outputFolded :: Boolean
  , onRun :: Effect Unit
  , onStop :: Effect Unit
  , onToggleFold :: Effect Unit
  , onToggleCodeFold :: Effect Unit
  , onToggleOutputFold :: Effect Unit
  , menu :: Array MenuItem
  }

activeClass :: String
activeClass = "border-indigo-400/60 bg-indigo-500/10 text-indigo-200"

gutterBtnBase :: String
gutterBtnBase =
  "notebook-gutter-btn flex h-7 w-7 shrink-0 items-center justify-center rounded border border-slate-700/80 bg-slate-900/80 text-[11px] font-bold text-slate-400 transition-colors hover:border-slate-500 hover:text-white "

gutterBtn
  :: String
  -> String
  -> String
  -> Effect Unit
  -> H.Html (Effect Unit)
gutterBtn title label extra onClick =
  H.button
    [ H.className (gutterBtnBase <> extra)
    , H.attr "type" "button"
    , H.titleAttr title
    , H.OnClick onClick
    ]
    [ H.text label ]

runBtn :: GutterProps -> H.Html (Effect Unit)
runBtn props =
  let
    base =
      "notebook-gutter-btn notebook-gutter-run flex h-8 w-8 shrink-0 items-center justify-center rounded border text-[14px] leading-none shadow-sm transition-colors "
  in
    if props.isRunning then
      H.button
        [ H.className (base <> "border-rose-500/60 bg-rose-500/25 text-rose-200 hover:border-rose-400 hover:bg-rose-500/40")
        , H.attr "type" "button"
        , H.dataAttr "run-cell" "1"
        , H.dataAttr "cell-state" "running"
        , H.titleAttr "Stop cell"
        , H.OnClick props.onStop
        ]
        [ H.text "■" ]
    else
      H.button
        [ H.className (base <> "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/35 hover:text-emerald-100")
        , H.attr "type" "button"
        , H.dataAttr "run-cell" "1"
        , H.titleAttr "Run cell (⌘↵)"
        , H.OnClick props.onRun
        ]
        [ H.text "▶" ]

menuItemView :: MenuItem -> Array (H.Html (Effect Unit))
menuItemView item =
  let
    extra = if item.danger then "text-rose-300 hover:bg-rose-500/10" else ""
    btn =
      H.button
        [ H.className ("rounded px-2 py-1 text-left text-xs text-slate-300 hover:bg-slate-800 " <> extra)
        , H.attr "type" "button"
        , H.OnClick item.onClick
        ]
        [ H.text item.label ]
  in
    if item.sepBefore then
      [ H.div [ H.className "my-1 border-t border-slate-800" ] []
      , btn
      ]
    else [ btn ]

menuView :: Array MenuItem -> H.Html (Effect Unit)
menuView items =
  H.node "details"
    [ H.className "notebook-cell-menu relative" ]
    [ H.node "summary"
        [ H.dataAttr "cell-menu" "1"
        , H.titleAttr "Cell actions"
        , H.className "notebook-gutter-btn flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded border border-slate-700/80 bg-slate-900/80 text-[13px] font-bold text-slate-400 hover:border-slate-500 hover:text-white"
        ]
        [ H.text "⋯" ]
    , H.div
        [ H.dataAttr "cell-actions" "1"
        , H.className "notebook-cell-actions absolute left-9 top-0 z-30 flex w-44 flex-col rounded border border-slate-700 bg-slate-900 p-1 text-left shadow-xl"
        ]
        (items >>= menuItemView)
    ]

viewGutter :: GutterProps -> Document (Effect Unit)
viewGutter props =
  { title: ""
  , body:
      [ H.node "span"
          [ H.className "whitespace-nowrap text-[10px] font-mono text-slate-500" ]
          [ H.text props.number ]
      ]
        <> (if props.isRunnable then [ runBtn props ] else [])
        <>
          [ gutterBtn
              (if props.folded then "Expand cell" else "Fold all (code + output)")
              (if props.folded then "▸" else "▾")
              (if props.folded then activeClass else "")
              props.onToggleFold
          ]
        <> foldCodeOutput props
        <> [ menuView props.menu ]
  }

foldCodeOutput :: GutterProps -> Array (H.Html (Effect Unit))
foldCodeOutput props =
  if props.isCodeCell && not props.folded then
    [ gutterBtn
        (if props.codeFolded then "Show code" else "Fold code")
        "{}"
        (if props.codeFolded then activeClass else "")
        props.onToggleCodeFold
    , gutterBtn
        (if props.outputFolded then "Show output" else "Fold output")
        (if props.outputFolded then "▢" else "▣")
        (if props.outputFolded then activeClass else "")
        props.onToggleOutputFold
    ]
  else []

foreign import renderGutterPs :: Foreign -> Document (Effect Unit) -> Effect Unit

mountGutterExport :: EffectFn2 Foreign GutterProps Unit
mountGutterExport = mkEffectFn2 \host props ->
  renderGutterPs host (viewGutter props)
