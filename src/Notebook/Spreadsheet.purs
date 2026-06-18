module Spreadsheet
  ( rowsToCsvFromTable
  , tableHeadersFromRows
  , tableBodyFromRows
  , mountSpreadsheetViewExport
  , viewTableDocument
  ) where

import Prelude hiding (div)

import Csv (rowsToCsv)
import Data.Array as Array
import Data.Maybe (fromMaybe)
import Data.Tuple (Tuple(..))
import Effect (Effect)
import Effect.Uncurried (EffectFn2, mkEffectFn2)
import Foreign (Foreign)
import PsSpa.Html as H
import PsSpa.View (Document)

-- | Spreadsheet CSV export: header row + data rows (PureScript-side, per Jupiter).
rowsToCsvFromTable :: Array String -> Array (Array String) -> String
rowsToCsvFromTable headers rows =
  rowsToCsv ([headers] <> rows)

foreign import tableHeadersFromRowsImpl :: Foreign -> Array String
foreign import tableBodyFromRowsImpl :: Foreign -> Array (Array String)
foreign import renderSpreadsheetPs :: Foreign -> Document (Effect Unit) -> Effect Unit
foreign import copyCsvToClipboard :: Array String -> Array (Array String) -> Effect Unit

tableHeadersFromRows :: Foreign -> Array String
tableHeadersFromRows = tableHeadersFromRowsImpl

tableBodyFromRows :: Foreign -> Array (Array String)
tableBodyFromRows = tableBodyFromRowsImpl

columnName :: Int -> String
columnName col =
  fromMaybe ("C" <> show (col + 1)) (Array.index columnNames col)

columnNames :: Array String
columnNames =
  [ "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"
  , "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
  , "AA", "AB", "AC", "AD", "AE", "AF", "AG", "AH", "AI", "AJ", "AK", "AL", "AM"
  , "AN", "AO", "AP", "AQ", "AR", "AS", "AT", "AU", "AV", "AW", "AX", "AY", "AZ"
  ]

viewTableDocument :: Array String -> Array (Array String) -> Document (Effect Unit)
viewTableDocument headers rows =
  { title: ""
  , body:
      [ H.div
          [ H.className "flex flex-col gap-2 notebook-spreadsheet-wrap" ]
          [ H.div
              [ H.className "overflow-auto rounded border border-slate-800 max-h-[320px] notebook-spreadsheet"
              , H.attr "data-notebook-table" "1"
              ]
              [ renderGrid headers rows ]
          , H.button
              [ H.className "self-end rounded border border-indigo-500/40 bg-indigo-500/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-200"
              , H.attr "data-copy-csv" "1"
              , H.attr "type" "button"
              , H.OnClick (copyCsvToClipboard headers rows)
              ]
              [ H.text "Copy to CSV" ]
          ]
      ]
  }

renderGrid :: Array String -> Array (Array String) -> H.Html (Effect Unit)
renderGrid headers rows =
  H.node "table"
    [ H.className "w-full border-collapse text-xs font-mono text-slate-200" ]
    [ renderHead headers
    , renderBody rows
    ]

renderHead :: Array String -> H.Html (Effect Unit)
renderHead headers =
  H.node "thead"
    []
    [ H.node "tr"
        [ H.className "bg-slate-900 sticky top-0 z-10" ]
        ( [ H.node "th"
              [ H.className "border border-slate-800 px-2 py-1 text-left text-slate-500 w-12" ]
              [ H.text "#" ]
          ]
            <> mapWithIndex headerCell headers
        )
    ]

headerCell :: Int -> String -> H.Html (Effect Unit)
headerCell idx label =
  H.node "th"
    [ H.className "border border-slate-800 px-2 py-1 text-left text-slate-400 min-w-[120px]" ]
    [ H.node "span" [ H.className "font-semibold text-slate-300" ] [ H.text label ]
    , H.text " "
    , H.node "span" [ H.className "text-[10px] text-slate-500" ] [ H.text (columnName idx) ]
    ]

renderBody :: Array (Array String) -> H.Html (Effect Unit)
renderBody rows =
  H.node "tbody"
    []
    (mapWithIndex dataRow rows)

dataRow :: Int -> Array String -> H.Html (Effect Unit)
dataRow rowIdx cells =
  H.node "tr"
    [ H.className "hover:bg-slate-900/50" ]
    ( [ H.node "td"
          [ H.className "border border-slate-800 px-2 py-1 text-slate-500 tabular-nums" ]
          [ H.text (show (rowIdx + 1)) ]
      ]
        <> map (\v -> H.node "td" [ H.className "border border-slate-800 px-2 py-1 tabular-nums" ] [ H.text v ]) cells
    )

mapWithIndex :: forall a b. (Int -> a -> b) -> Array a -> Array b
mapWithIndex f arr =
  if Array.null arr then []
  else map (\(Tuple i x) -> f i x) (Array.zip (Array.range 0 (Array.length arr - 1)) arr)

mountSpreadsheetView :: Foreign -> Array String -> Array (Array String) -> Effect Unit
mountSpreadsheetView host headers rows =
  renderSpreadsheetPs host (viewTableDocument headers rows)

mountSpreadsheetViewExport :: EffectFn2 Foreign Foreign Unit
mountSpreadsheetViewExport = mkEffectFn2 \host rowsForeign -> do
  let headers = tableHeadersFromRows rowsForeign
      body = tableBodyFromRows rowsForeign
  mountSpreadsheetView host headers body
