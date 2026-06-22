module Notebook.CellsNav
  ( NavItem
  , viewCellsNav
  , mountCellsNavExport
  ) where

import Prelude hiding (div)

import Data.Array (null)
import Effect (Effect)
import Effect.Uncurried (EffectFn2, mkEffectFn2)
import Foreign (Foreign)
import PsSpa.Html as H
import PsSpa.View (Document)

-- | One row in the Cells navigation panel, derived from the Model. Display
-- | fields are plain strings/booleans and the actions are JS thunks
-- | (`Effect Unit` across FFI), so the shell can pass `() => {...}` directly.
-- | `meta` is the precomputed "N · Label" line; `name` is the user-assigned
-- | cell name ("" when unset → only the meta line shows). `status` drives the
-- | dot: "running" | "ok" | "idle".
type NavItem =
  { cellId :: String
  , meta :: String
  , name :: String
  , isRunnable :: Boolean
  , running :: Boolean
  , focused :: Boolean
  , status :: String
  , onNav :: Effect Unit
  , onRun :: Effect Unit
  , onStop :: Effect Unit
  }

cardBase :: String
cardBase = "flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 "

focusedCls :: String
focusedCls = "border-indigo-400/60 bg-indigo-500/10"

idleCls :: String
idleCls = "border-slate-800/80 bg-slate-900/40"

runBtnCls :: String
runBtnCls =
  "shrink-0 rounded border border-emerald-500/50 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200 hover:bg-emerald-500/25"

stopBtnCls :: String
stopBtnCls =
  "shrink-0 rounded border border-rose-500/50 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-200 hover:bg-rose-500/25"

dotClass :: String -> String
dotClass status = case status of
  "running" -> "text-rose-300"
  "ok" -> "text-emerald-400/80"
  _ -> "text-slate-700"

dotChar :: String -> String
dotChar status = case status of
  "running" -> "●"
  "ok" -> "●"
  _ -> "○"

navButton :: NavItem -> H.Html (Effect Unit)
navButton item =
  H.button
    [ H.className "flex w-full min-w-0 flex-1 flex-col gap-0.5 text-left"
    , H.attr "type" "button"
    , H.titleAttr "Jump to this cell"
    , H.OnClick item.onNav
    ]
    ( [ H.node "div"
          [ H.className "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500" ]
          [ H.node "span" [] [ H.text item.meta ] ]
      ]
        <>
          ( if item.name == "" then []
            else [ H.node "div" [ H.className "truncate font-mono text-[11px] text-slate-300" ] [ H.text item.name ] ]
          )
    )

runStop :: NavItem -> H.Html (Effect Unit)
runStop item =
  if item.running then
    H.button
      [ H.className stopBtnCls
      , H.attr "type" "button"
      , H.dataAttr "run-cell" item.cellId
      , H.dataAttr "cell-state" "running"
      , H.OnClick item.onStop
      ]
      [ H.text "■ Stop" ]
  else
    H.button
      [ H.className runBtnCls
      , H.attr "type" "button"
      , H.dataAttr "run-cell" item.cellId
      , H.OnClick item.onRun
      ]
      [ H.text "▶ Run" ]

statusDot :: NavItem -> H.Html (Effect Unit)
statusDot item =
  H.node "span"
    [ H.className ("shrink-0 text-[12px] " <> dotClass item.status) ]
    [ H.text (dotChar item.status) ]

cardView :: NavItem -> H.Html (Effect Unit)
cardView item =
  H.div
    [ H.className (cardBase <> if item.focused then focusedCls else idleCls)
    , H.dataAttr "nav-cell" item.cellId
    ]
    ( [ navButton item ]
        <> (if item.isRunnable then [ runStop item ] else [])
        <> [ statusDot item ]
    )

viewCellsNav :: Array NavItem -> Document (Effect Unit)
viewCellsNav items =
  { title: ""
  , body:
      if null items then
        [ H.div [ H.className "text-xs italic text-slate-600" ] [ H.text "No cells yet." ] ]
      else map cardView items
  }

foreign import renderCellsNavPs :: Foreign -> Document (Effect Unit) -> Effect Unit

mountCellsNavExport :: EffectFn2 Foreign (Array NavItem) Unit
mountCellsNavExport = mkEffectFn2 \host items ->
  renderCellsNavPs host (viewCellsNav items)
