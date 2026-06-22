module Notebook.Toolbar
  ( ToolbarProps
  , viewToolbar
  , mountToolbarExport
  ) where

import Prelude hiding (div)

import Effect (Effect)
import Effect.Uncurried (EffectFn2, mkEffectFn2)
import Foreign (Foreign)
import PsSpa.Html as H
import PsSpa.View (Document)

-- | Toolbar handlers, supplied as JS thunks (`Effect Unit`) across the FFI
-- | boundary. Each corresponds to a toolbar button's onclick. Keeping the
-- | record JS-shaped means NotebookMount.js can pass plain `() => {...}`
-- | callbacks directly.
type ToolbarProps =
  { onSave :: Effect Unit
  , onAddCode :: Effect Unit
  , onAddModule :: Effect Unit
  , onAddText :: Effect Unit
  , onCut :: Effect Unit
  , onCopy :: Effect Unit
  , onPaste :: Effect Unit
  , onRun :: Effect Unit
  , onStop :: Effect Unit
  , onRunAll :: Effect Unit
  , onSource :: Effect Unit
  , onOpen :: Effect Unit
  , onReset :: Effect Unit
  }

baseBtn :: String
baseBtn =
  "rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300 hover:border-indigo-400/50 hover:text-white "

btn
  :: String
  -> String
  -> String
  -> Effect Unit
  -> H.Html (Effect Unit)
btn label extra title onClick =
  H.button
    [ H.className (baseBtn <> extra)
    , H.attr "type" "button"
    , H.titleAttr title
    , H.OnClick onClick
    ]
    [ H.text label ]

viewToolbar :: ToolbarProps -> Document (Effect Unit)
viewToolbar props =
  { title: ""
  , body:
      [ H.div
          [ H.className "notebook-toolbar flex shrink-0 flex-wrap items-center gap-2 px-0 py-0" ]
          [ btn "Save" "border-slate-600" "Save notebook as .vnb" props.onSave
          , btn "+ Runnable" "" "Insert a runnable cell (module Main exposing (main))" props.onAddCode
          , btn "+ Module" "" "Insert a module cell (shared helpers, imported by other cells)" props.onAddModule
          , btn "+ Text" "" "Insert a text cell" props.onAddText
          , btn "Cut" "" "Cut selected cell" props.onCut
          , btn "Copy" "" "Copy selected cell" props.onCopy
          , btn "Paste" "" "Paste copied cell below selected cell" props.onPaste
          , btn "Run" "border-emerald-500/40 text-emerald-200" "Run selected cell" props.onRun
          , btn "Stop" "border-rose-500/40 text-rose-200" "Stop selected cell" props.onStop
          , btn "Run all" "border-emerald-500/40 text-emerald-200" "Run every code cell once" props.onRunAll
          , btn "Source" "" "Open the concatenated Verdict source" props.onSource
          , btn "Open" "" "Open .verdict or .vnb" props.onOpen
          , btn "Reset" "border-rose-500/40 text-rose-200" "Reset to default example" props.onReset
          ]
      ]
  }

foreign import renderToolbarPs :: Foreign -> Document (Effect Unit) -> Effect Unit

mountToolbarExport :: EffectFn2 Foreign ToolbarProps Unit
mountToolbarExport = mkEffectFn2 \host props ->
  renderToolbarPs host (viewToolbar props)
