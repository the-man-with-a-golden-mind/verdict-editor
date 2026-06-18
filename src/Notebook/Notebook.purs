module Notebook
  ( concatenateCode
  , bindingNamesInCell
  ) where

import Prelude

import Cell (Cell, CellKind(..))
import Data.Array (filter, null, uncons)
import Data.Maybe (Maybe(..))
import Data.String (trim)

concatenateCode :: Array Cell -> String
concatenateCode cells =
  let codeCells = filter (\c -> c.kind == Code) cells
      parts = map (\c -> trim c.source) codeCells
  in if null parts then "" else joinWith "\n\n" parts

joinWith :: String -> Array String -> String
joinWith _ [] = ""
joinWith sep arr = case uncons arr of
  Nothing -> ""
  Just { head, tail } ->
    if null tail then head else head <> sep <> joinWith sep tail

bindingNamesInCell :: Cell -> Array String
bindingNamesInCell cell =
  if cell.kind /= Code then []
  else bindingNamesFromSource cell.source

foreign import bindingNamesFromSource :: String -> Array String
