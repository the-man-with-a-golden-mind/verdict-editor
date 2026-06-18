module Spreadsheet
  ( rowsToCsvFromTable
  , tableHeadersFromRows
  , tableBodyFromRows
  ) where

import Prelude

import Csv (rowsToCsv)
import Foreign (Foreign)

-- | Spreadsheet CSV export: header row + data rows (PureScript-side, per Jupiter).
rowsToCsvFromTable :: Array String -> Array (Array String) -> String
rowsToCsvFromTable headers rows =
  rowsToCsv ([headers] <> rows)

foreign import tableHeadersFromRowsImpl :: Foreign -> Array String
foreign import tableBodyFromRowsImpl :: Foreign -> Array (Array String)

tableHeadersFromRows :: Foreign -> Array String
tableHeadersFromRows = tableHeadersFromRowsImpl

tableBodyFromRows :: Foreign -> Array (Array String)
tableBodyFromRows = tableBodyFromRowsImpl
