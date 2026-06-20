module Main
  ( mountNotebook
  , concatenateCodeExport
  , concatenateDocumentExport
  , bindingNamesExport
  , bindingNamesFromSourceExport
  , cellPreviewLineExport
  , seedSignatureExport
  , extractVerdictDocsExport
  , defaultCellUiExport
  , updateModelExport
  , escapeFieldExport
  , rowsToCsvExport
  , decodeDisplayKindExport
  , spreadsheetCsvExport
  , renderDisplayIntoExport
  , mountSpreadsheetViewExport
  , mountToolbarExport
  , mountGutterExport
  , main
  ) where

import Prelude

import Cell (Cell, CellKind(..), CellUi, defaultCellUi)
import Csv (escapeField, rowsToCsv)
import Display as D
import Notebook
  ( concatenateCode
  , concatenateDocument
  , bindingNamesInCell
  , bindingNamesFromSource
  , cellPreviewLine
  )
import Notebook.Gutter as GT
import Notebook.Model as NM
import Notebook.Toolbar as TB
import Seed (seedSignature)
import Spreadsheet as SS
import VerdictDocs (DocEntry, extractVerdictDocs)
import Data.Maybe (Maybe(..))
import Effect (Effect)
import Effect.Uncurried (EffectFn1, EffectFn2, EffectFn3, mkEffectFn1, mkEffectFn2, mkEffectFn3)
import Foreign (Foreign)

foreign import mountNotebookImpl :: String -> Foreign -> String -> Effect Foreign
foreign import unsafeReadString :: Foreign -> String -> String
foreign import unsafeReadCellUi :: Foreign -> CellUi
foreign import unsafeToRows :: Foreign -> Array (Array String)

mountNotebook :: EffectFn3 String Foreign String Foreign
mountNotebook = mkEffectFn3 mountNotebookImpl

concatenateCodeExport :: EffectFn1 (Array Foreign) String
concatenateCodeExport = mkEffectFn1 \rows ->
  pure (concatenateCode (map foreignToCell rows))

concatenateDocumentExport :: EffectFn1 (Array Foreign) String
concatenateDocumentExport = mkEffectFn1 \rows ->
  pure (concatenateDocument (map foreignToCell rows))

bindingNamesExport :: EffectFn1 Foreign (Array String)
bindingNamesExport = mkEffectFn1 \row ->
  pure (bindingNamesInCell (foreignToCell row))

bindingNamesFromSourceExport :: EffectFn1 String (Array String)
bindingNamesFromSourceExport = mkEffectFn1 \src -> pure (bindingNamesFromSource src)

cellPreviewLineExport :: EffectFn1 Foreign String
cellPreviewLineExport = mkEffectFn1 \row -> pure (cellPreviewLine (foreignToCell row))

seedSignatureExport :: EffectFn1 String String
seedSignatureExport = mkEffectFn1 \src -> pure (seedSignature src)

extractVerdictDocsExport :: EffectFn1 String (Array DocEntry)
extractVerdictDocsExport = mkEffectFn1 \src -> pure (extractVerdictDocs src)

defaultCellUiExport :: EffectFn1 Unit CellUi
defaultCellUiExport = mkEffectFn1 \_ -> pure defaultCellUi

updateModelExport :: EffectFn2 NM.JsModel NM.JsMsg NM.JsModel
updateModelExport = mkEffectFn2 \model msg -> pure (NM.updateJsModel msg model)

foreignToCell :: Foreign -> Cell
foreignToCell f =
  { id: unsafeReadString f "id"
  , kind: if unsafeReadString f "kind" == "wysiwyg" then Wysiwyg else Code
  , role: unsafeReadString f "role"
  , path: unsafeReadString f "path"
  , moduleName: unsafeReadString f "moduleName"
  , source: unsafeReadString f "source"
  , ui: unsafeReadCellUi f
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
    Just D.RowKind -> "row"
    Just D.ColKind -> "col"
    Just D.UnknownKind -> "unknown"
    Nothing -> "unknown")

spreadsheetCsvExport :: EffectFn1 Foreign String
spreadsheetCsvExport = mkEffectFn1 \raw ->
  pure (SS.rowsToCsvFromTable (tableHeaders raw) (tableBody raw))

mountSpreadsheetViewExport :: EffectFn2 Foreign Foreign Unit
mountSpreadsheetViewExport = SS.mountSpreadsheetViewExport

mountToolbarExport :: EffectFn2 Foreign TB.ToolbarProps Unit
mountToolbarExport = TB.mountToolbarExport

mountGutterExport :: EffectFn2 Foreign GT.GutterProps Unit
mountGutterExport = GT.mountGutterExport

renderDisplayIntoExport :: EffectFn3 Foreign Foreign Foreign Unit
renderDisplayIntoExport = D.renderDisplayIntoExport

foreign import tableHeaders :: Foreign -> Array String
foreign import tableBody :: Foreign -> Array (Array String)

main :: Effect Unit
main = pure unit
