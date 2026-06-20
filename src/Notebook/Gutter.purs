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
  -- | Per-cell status: "running" | "error" | "ok" | "idle". Drives the 3-color
  -- | dot (orange/red/green/gray). Computed once in JS (cellStatus) so the
  -- | gutter and the Cells nav agree.
  , status :: String
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

-- | Map the per-cell status string to a Tailwind text color for the dot.
-- | orange = running/looping, red = error, green = ok, gray = idle.
statusDotClass :: String -> String
statusDotClass status =
  case status of
    "running" -> "text-amber-400"
    "error" -> "text-rose-400"
    "ok" -> "text-emerald-400"
    _ -> "text-slate-700"

statusDot :: GutterProps -> H.Html (Effect Unit)
statusDot props =
  H.node "span"
    [ H.className ("notebook-cell-status shrink-0 text-[12px] leading-none " <> statusDotClass props.status)
    , H.dataAttr "cell-status" props.status
    , H.titleAttr ("Status: " <> props.status)
    ]
    [ H.text "●" ]

-- | Both Run and Stop are always visible (not a single toggle). Stop is dimmed
-- | when the cell is neither running nor looping; Run dims while running so a
-- | loop cell shows its active state without hiding the affordance.
runBtns :: GutterProps -> Array (H.Html (Effect Unit))
runBtns props =
  let
    base =
      "notebook-gutter-btn flex h-8 w-8 shrink-0 items-center justify-center rounded border text-[14px] leading-none shadow-sm transition-colors "
    runActive = "border-emerald-500/50 bg-emerald-500/20 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-500/35 hover:text-emerald-100"
    runDim = "border-slate-700/70 bg-slate-900/70 text-emerald-300/50 hover:border-emerald-400 hover:text-emerald-200"
    stopActive = "border-rose-500/60 bg-rose-500/25 text-rose-200 hover:border-rose-400 hover:bg-rose-500/40"
    stopDim = "border-slate-700/70 bg-slate-900/70 text-rose-300/40"
    runCls = if props.isRunning then runDim else runActive
    stopCls = if props.isRunning then stopActive else stopDim
  in
    [ H.button
        [ H.className (base <> runCls)
        , H.attr "type" "button"
        , H.dataAttr "run-cell" "1"
        , H.dataAttr "cell-state" (if props.isRunning then "running" else "idle")
        , H.titleAttr "Run cell (⌘↵)"
        , H.OnClick props.onRun
        ]
        [ H.text "▶" ]
    , H.button
        [ H.className (base <> stopCls)
        , H.attr "type" "button"
        , H.dataAttr "stop-cell" "1"
        , H.titleAttr "Stop cell"
        , H.OnClick props.onStop
        ]
        [ H.text "■" ]
    ]

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
        <> (if props.isRunnable then [ statusDot props ] else [])
        <> (if props.isRunnable then runBtns props else [])
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
