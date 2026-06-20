module Notebook.Run
  ( RunCellInfo
  , EvalOut
  , RouteResult
  , routeEvalResults
  , routeEvalResultsExport
  ) where

import Prelude

import Data.Array as Array
import Data.Maybe (Maybe(..))
import Data.Nullable (Nullable, toNullable)
import Effect.Uncurried (EffectFn4, mkEffectFn4)

-- | Minimal per-cell info needed to route eval outputs: the cell id, whether
-- | it is runnable, and the binding names it owns. JS-shaped for the FFI
-- | boundary (plain records, arrays of String).
type RunCellInfo =
  { id :: String
  , runnable :: Boolean
  , names :: Array String
  }

-- | One eval result; only `name` matters for routing. The opaque output payload
-- | stays in JS — PureScript just decides which cell each result belongs to.
type EvalOut =
  { name :: String }

-- | Routing decision, matching NotebookMount.js applyEvalResults exactly:
-- |  - `targetIds[i]` is the cell id `outs[i]` routes to (or null).
-- |  - `fallbackName` / `fallbackCellId` describe the focus-fallback overwrite
-- |    the original applies when the just-run cell matched nothing (both null
-- |    when no fallback fires).
type RouteResult =
  { targetIds :: Array (Nullable String)
  , fallbackName :: Nullable String
  , fallbackCellId :: Nullable String
  }

-- | Pure re-implementation of applyEvalResults' routing. Each output is assigned
-- | to the first runnable cell at index <= upToIdx whose binding names include
-- | the output name. If the just-run (focus) cell received no output, the first
-- | output carrying one of its binding names is additionally routed to it.
routeEvalResults
  :: Array RunCellInfo
  -> Array EvalOut
  -> Int
  -> String
  -> RouteResult
routeEvalResults cells outs upToIdx focusCellId =
  let
    inScope = Array.take (upToIdx + 1) cells

    targetFor :: EvalOut -> Maybe String
    targetFor o =
      map _.id (Array.find (\c -> c.runnable && Array.elem o.name c.names) inScope)

    primary = map targetFor outs

    matchedFocus = Array.any (\t -> t == Just focusCellId) primary

    focusCell = Array.index cells upToIdx
    focusNames = case focusCell of
      Just c -> c.names
      Nothing -> []

    fallback =
      if (not matchedFocus) && (not (Array.null focusNames)) then
        case focusCell of
          Just fc ->
            case Array.find (\o -> Array.elem o.name focusNames) outs of
              Just o -> { name: Just o.name, cellId: Just fc.id }
              Nothing -> { name: Nothing, cellId: Nothing }
          Nothing -> { name: Nothing, cellId: Nothing }
      else { name: Nothing, cellId: Nothing }
  in
    { targetIds: map toNullable primary
    , fallbackName: toNullable fallback.name
    , fallbackCellId: toNullable fallback.cellId
    }

routeEvalResultsExport
  :: EffectFn4 (Array RunCellInfo) (Array EvalOut) Int String RouteResult
routeEvalResultsExport =
  mkEffectFn4 \cells outs upToIdx focusCellId ->
    pure (routeEvalResults cells outs upToIdx focusCellId)
