module Main
  ( mountNotebook
  , concatenateCodeExport
  , bindingNamesExport
  , escapeFieldExport
  , rowsToCsvExport
  , decodeDisplayKindExport
  , spreadsheetCsvExport
  , renderDisplayIntoExport
  , mountSpreadsheetViewExport
  ) where

import Prelude

import Cell (Cell, CellKind(..))
import Csv (escapeField, rowsToCsv)
import Display as D
import Notebook (concatenateCode, bindingNamesInCell)
import Spreadsheet as SS
import Data.Maybe (Maybe(..))
import Effect (Effect)
import Effect.Uncurried (EffectFn1, EffectFn2, EffectFn3, mkEffectFn1, mkEffectFn3)
import Foreign (Foreign)

foreign import mountNotebookImpl :: String -> Foreign -> String -> Effect Foreign
foreign import unsafeReadString :: Foreign -> String -> String
foreign import unsafeToRows :: Foreign -> Array (Array String)

mountNotebook :: EffectFn3 String Foreign String Foreign
mountNotebook = mkEffectFn3 mountNotebookImpl

concatenateCodeExport :: EffectFn1 (Array Foreign) String
concatenateCodeExport = mkEffectFn1 \rows ->
  pure (concatenateCode (map foreignToCell rows))

bindingNamesExport :: EffectFn1 Foreign (Array String)
bindingNamesExport = mkEffectFn1 \row ->
  pure (bindingNamesInCell (foreignToCell row))

foreignToCell :: Foreign -> Cell
foreignToCell f =
  { id: unsafeReadString f "id"
  , kind: if unsafeReadString f "kind" == "wysiwyg" then Wysiwyg else Code
  , source: unsafeReadString f "source"
  }

escapeFieldExport :: EffectFn1 String String
escapeFieldExport = mkEffectFn1 \s -> pure (escapeField s)

rowsToCsvExport :: EffectFn1 Foreign String
rowsToCsvExport = mkEffectFn1 \rows -> pure (rowsToCsv (unsafeToRows rows))

decodeDisplayKindExport :: EffectFn1 Foreign String
decodeDisplayKindExport = mkEffectFn1 \raw ->
  pure (case D.decodeDisplayKind raw of
    Just D.TextKind -> "text"
    Just D.ChartKind -> "chart"
    Just D.TableKind -> "table"
    Just D.StackKind -> "stack"
    Just D.UnknownKind -> "unknown"
    Nothing -> "unknown")

spreadsheetCsvExport :: EffectFn1 Foreign String
spreadsheetCsvExport = mkEffectFn1 \raw ->
  pure (SS.rowsToCsvFromTable (tableHeaders raw) (tableBody raw))

mountSpreadsheetViewExport :: EffectFn2 Foreign Foreign Unit
mountSpreadsheetViewExport = SS.mountSpreadsheetViewExport

renderDisplayIntoExport :: EffectFn3 Foreign Foreign Foreign Unit
renderDisplayIntoExport = D.renderDisplayIntoExport

foreign import tableHeaders :: Foreign -> Array String
foreign import tableBody :: Foreign -> Array (Array String)

main :: Effect Unit
main = pure unit
