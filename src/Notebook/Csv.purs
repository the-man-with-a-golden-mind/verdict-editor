module Csv
  ( escapeField
  , rowsToCsv
  ) where

import Prelude

import Data.Array (intercalate, null)
import Data.String (Pattern(..), Replacement(..), contains, replaceAll)

escapeField :: String -> String
escapeField s =
  let needsQuote = contains (Pattern ",") s || contains (Pattern "\"") s || contains (Pattern "\n") s || contains (Pattern "\r") s
  in if needsQuote then "\"" <> replaceAll (Pattern "\"") (Replacement "\"\"") s <> "\""
     else s

rowsToCsv :: Array (Array String) -> String
rowsToCsv rows =
  if null rows then ""
  else intercalate "\n" (map (intercalate "," <<< map escapeField) rows)
