module Notebook
  ( concatenateCode
  , concatenateDocument
  , bindingNamesInCell
  , bindingNamesFromSource
  , NotebookModel
  , emptyNotebook
  ) where

import Prelude

import Cell (Cell, CellKind(..))
import Data.Array (all, filter, foldMap, null, uncons)
import Data.Maybe (Maybe(..), isJust)
import Data.String (Pattern(..))
import Data.String.CodeUnits as CU
import Data.String.Common as SC

type NotebookModel =
  { cells :: Array Cell
  , focusedId :: Maybe String
  }

emptyNotebook :: NotebookModel
emptyNotebook = { cells: [], focusedId: Nothing }

concatenateCode :: Array Cell -> String
concatenateCode cells =
  let codeCells = filter (\c -> c.kind == Code) cells
      parts = filter (_ /= "") (map (\c -> SC.trim c.source) codeCells)
  in if null parts then "" else joinWith "\n\n" parts

concatenateDocument :: Array Cell -> String
concatenateDocument cells =
  let parts = mapMaybe cellDocumentPart cells
  in if null parts then "" else joinWith "\n\n" parts

cellDocumentPart :: Cell -> Maybe String
cellDocumentPart c = case c.kind of
  Code ->
    let s = SC.trim c.source
    in if s == "" then Nothing else Just s
  Wysiwyg ->
    let s = wysiwygAsComments c.source
    in if s == "" then Nothing else Just s

wysiwygAsComments :: String -> String
wysiwygAsComments md =
  let trimmed = SC.trim md
  in if trimmed == "" then ""
     else joinWith "\n" (map (\line -> "-- " <> line) (sourceLines trimmed))

sourceLines :: String -> Array String
sourceLines s = SC.split (Pattern "\n") s

joinWith :: String -> Array String -> String
joinWith _ [] = ""
joinWith sep arr = case uncons arr of
  Nothing -> ""
  Just { head, tail } ->
    if null tail then head else head <> sep <> joinWith sep tail

mapMaybe :: forall a b. (a -> Maybe b) -> Array a -> Array b
mapMaybe f xs = foldMap (\x -> case f x of
  Nothing -> []
  Just y -> [ y ]) xs

bindingNamesInCell :: Cell -> Array String
bindingNamesInCell cell =
  if cell.kind /= Code then []
  else bindingNamesFromSource cell.source

bindingNamesFromSource :: String -> Array String
bindingNamesFromSource source =
  foldMap lineBindingNames (sourceLines source)

lineBindingNames :: String -> Array String
lineBindingNames line =
  if isIndented line then []
  else
    let t = SC.trim line
    in if t == "" || isComment t then []
       else if startsWith (Pattern "let ") t then []
       else case CU.indexOf (Pattern " =") t of
         Nothing -> []
         Just eq ->
           let name = SC.trim (CU.take eq t)
               rhs = SC.trim (CU.drop (eq + 2) t)
           in if not (isBindingName name) then []
              else if rhs == name || startsWith (Pattern (name <> ",")) rhs then []
              else if startsWith (Pattern (name <> " }")) rhs then []
              else [ name ]

isIndented :: String -> Boolean
isIndented line =
  isJust (CU.stripPrefix (Pattern " ") line)
    || isJust (CU.stripPrefix (Pattern "\t") line)

startsWith :: Pattern -> String -> Boolean
startsWith pat s = isJust (CU.stripPrefix pat s)

isComment :: String -> Boolean
isComment t = startsWith (Pattern "--") (SC.trim t)

isBindingName :: String -> Boolean
isBindingName name = case unconsChars name of
  Nothing -> false
  Just { head, tail } -> isLowerChar head && all isIdentChar tail

unconsChars :: String -> Maybe { head :: Char, tail :: Array Char }
unconsChars s = case CU.toCharArray s of
  [] -> Nothing
  arr -> case uncons arr of
    Nothing -> Nothing
    Just { head, tail } -> Just { head, tail }

isLowerChar :: Char -> Boolean
isLowerChar c = c >= 'a' && c <= 'z'

isIdentChar :: Char -> Boolean
isIdentChar c =
  (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_'
