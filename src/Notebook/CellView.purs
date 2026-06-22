-- | Pure cell-VIEW decision logic: given a cell's render-relevant state (all
-- | JS-primitive inputs), compute a "render plan" describing what the cell
-- | should look like — fold visibility, the wrap className, editor height math,
-- | and the output sizing mode. The JS layer (`renderCell` in NotebookMount.js)
-- | stays a thin imperative applier that builds DOM and mounts the LIVE
-- | CodeMirror/Plotly instances; this module only decides booleans, numbers,
-- | and class strings so those choices live in one typed place.
module Notebook.CellView
  ( CellViewInput
  , CellViewPlan
  , cellViewPlan
  ) where

import Prelude

import Data.Int (round, toNumber)

-- | JS-shaped inputs (all primitives, matching the FFI boundary rule — no Maybe
-- | across the boundary). `viewportHeight` is window.innerHeight, read in JS and
-- | passed in (PureScript never touches window).
type CellViewInput =
  { kind :: String
  , focused :: Boolean
  , isMax :: Boolean
  , folded :: Boolean
  , codeFolded :: Boolean
  , outputFolded :: Boolean
  , editorResized :: Boolean
  , editorHeight :: Int
  , outputResized :: Boolean
  , outputHeight :: Int
  , lineCount :: Int
  , viewportHeight :: Int
  }

-- | The render plan JS applies to the DOM it builds. `outputMode` is
-- | "none" | "pinned" | "capped":
-- |   none   -> maxHeight: "none" (maximized cells)
-- |   pinned -> explicit height (user dragged the output taller/shorter)
-- |   capped -> max-height cap (un-resized; short output stays small)
type CellViewPlan =
  { showFolded :: Boolean
  , wrapClass :: String
  , showCodeFoldedBar :: Boolean
  , showEditorSection :: Boolean
  , editorHeightPx :: Int
  , maxEditorHeightPx :: Int
  , showOutput :: Boolean
  , outputMode :: String
  , outputHeightPx :: Int
  }

cellViewPlan :: CellViewInput -> CellViewPlan
cellViewPlan input =
  { showFolded
  , wrapClass
  , showCodeFoldedBar
  , showEditorSection: not showCodeFoldedBar
  , editorHeightPx
  , maxEditorHeightPx: maxEditorH
  , showOutput
  , outputMode
  , outputHeightPx
  }
  where
  -- shrink-0 so cells keep their height and the stack scrolls (Jupyter-style)
  -- instead of compressing every cell to fit the viewport.
  borderClass = if input.focused then "border-indigo-400/70" else "border-slate-800"
  wrapClass =
    "notebook-cell shrink-0 rounded-md border bg-slate-950/60 overflow-hidden "
      <> borderClass

  showFolded = input.folded && not input.isMax

  showCodeFoldedBar = input.codeFolded && input.kind == "code"

  -- A cell starts at its content height but capped at ~1/3 of the viewport (so a
  -- long runnable cell doesn't take the whole screen); the user can drag it
  -- taller (editorResized pins an explicit height up to maxEditorH).
  maxEditorH = if input.isMax then 2400 else 1600
  safeLineCount = max input.lineCount 1
  autoH = max (safeLineCount * 18 + 18) 48
  thirdViewport = max 160 (round (toNumber input.viewportHeight / 3.0))
  editorHeightPx =
    if input.editorResized then clamp 48 maxEditorH input.editorHeight
    else min autoH thirdViewport

  showOutput = not input.outputFolded
  -- Un-resized: cap with max-height so short output stays small. Once the user
  -- drags, pin an explicit height so growing AND shrinking both work (max-height
  -- alone can't grow past the content).
  outputHeightPx = max input.outputHeight 96
  outputMode =
    if input.isMax then "none"
    else if input.outputResized then "pinned"
    else "capped"
