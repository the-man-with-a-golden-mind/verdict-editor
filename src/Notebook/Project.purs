-- | Pure cell-project logic: classify a cell's role from its source, label it,
-- | and assemble the Verdict program text for a single runnable cell (with its
-- | imported module cells inlined) or for the whole notebook. Ported from the
-- | former hand-rolled `NotebookProject.js`; that file is now a thin marshalling
-- | adapter over these functions so role/label/program logic lives in one typed
-- | place alongside the rest of the notebook model.
module Notebook.Project
  ( ProjCell
  , CellMeta
  , cellModuleName
  , cellModuleNameJs
  , importModuleNames
  , inferCellRole
  , isModuleCell
  , isRunnableCell
  , projectCellLabel
  , buildRunnableCellSource
  , buildNotebookProgramSource
  , normalizeCellMeta
  ) where

import Prelude

import Data.Array (elem, filter, find, findMap, mapMaybe, nub, reverse, snoc)
import Data.Foldable (foldl)
import Data.Maybe (Maybe(..), fromMaybe, isJust)
import Data.String (Pattern(..), Replacement(..))
import Data.String.CodeUnits as CU
import Data.String.Common (joinWith, replaceAll, split, trim)
import Data.Tuple (Tuple(..), snd)

-- | JS-shaped cell (all fields plain strings, matching the FFI boundary rule).
-- | `kind` is "code" | "wysiwyg"; `role`/`moduleName`/`path` are "" when absent.
type ProjCell =
  { kind :: String
  , source :: String
  , role :: String
  , moduleName :: String
  , path :: String
  }

type CellMeta =
  { kind :: String
  , source :: String
  , role :: String
  , moduleName :: String
  , path :: String
  }

lines :: String -> Array String
lines = split (Pattern "\n")

-- | The module name declared on a `module X exposing (..)` line, if any.
moduleNameOfLine :: String -> Maybe String
moduleNameOfLine line =
  case CU.stripPrefix (Pattern "module ") (trim line) of
    Nothing -> Nothing
    Just rest
      | isJust (CU.indexOf (Pattern "exposing") rest) ->
          let name = CU.takeWhile (\c -> c /= ' ' && c /= '(') (trim rest)
          in if name /= "" then Just name else Nothing
      | otherwise -> Nothing

importNameOfLine :: String -> Maybe String
importNameOfLine line =
  case CU.stripPrefix (Pattern "import ") (trim line) of
    Nothing -> Nothing
    Just rest ->
      let name = CU.takeWhile (\c -> c /= ' ' && c /= '(') (trim rest)
      in if name /= "" then Just name else Nothing

cellModuleName :: String -> Maybe String
cellModuleName src = findMap moduleNameOfLine (lines src)

-- | JS-friendly variant: "" when the source declares no module.
cellModuleNameJs :: String -> String
cellModuleNameJs = cellModuleName >>> fromMaybe ""

importModuleNames :: String -> Array String
importModuleNames src = nub (mapMaybe importNameOfLine (lines src))

isKnownRole :: String -> Boolean
isKnownRole r = r == "module" || r == "runnable" || r == "asset" || r == "note"

inferCellRole :: ProjCell -> String
inferCellRole cell
  | isKnownRole cell.role = cell.role
  | cell.kind == "wysiwyg" = "note"
  | otherwise = case cellModuleName cell.source of
      Just m | m /= "Main" -> "module"
      _ -> "runnable"

isModuleCell :: ProjCell -> Boolean
isModuleCell cell = cell.kind == "code" && inferCellRole cell == "module"

isRunnableCell :: ProjCell -> Boolean
isRunnableCell cell =
  let r = inferCellRole cell
  in cell.kind == "code" && r /= "module" && r /= "asset"

projectCellLabel :: ProjCell -> String
projectCellLabel cell = case inferCellRole cell of
  "module" -> "Module"
  "asset" -> "Asset"
  "note" -> "Markdown"
  _ -> "Runnable"

stripModuleHeader :: String -> String
stripModuleHeader src =
  trim (joinWith "\n" (filter (not <<< isJust <<< moduleNameOfLine) (lines src)))

stripImports :: String -> String
stripImports src =
  trim (joinWith "\n" (filter (not <<< isJust <<< importNameOfLine) (lines src)))

sourceBody :: String -> String
sourceBody = stripModuleHeader >>> stripImports

moduleHeaderFor :: ProjCell -> String
moduleHeaderFor cell =
  let
    fallback = if cell.moduleName /= "" then cell.moduleName else "Main"
    name = fromMaybe fallback (cellModuleName cell.source)
  in "module " <> name <> " exposing (..)"

-- | Module cells keyed by module name. Reversed so a later declaration of the
-- | same module name wins on lookup (matching the JS Map.set semantics).
visibleModuleMap :: Array ProjCell -> Array (Tuple String ProjCell)
visibleModuleMap cells = mapMaybe entry (reverse cells)
  where
  entry c =
    if isModuleCell c then
      let mn = if c.moduleName /= "" then c.moduleName else fromMaybe "" (cellModuleName c.source)
      in if mn /= "" then Just (Tuple mn c) else Nothing
    else Nothing

lookupModule :: String -> Array (Tuple String ProjCell) -> Maybe ProjCell
lookupModule name entries = map snd (find (\(Tuple k _) -> k == name) entries)

-- | Post-order DFS over a runnable cell's transitive module imports, deduped,
-- | so dependencies are emitted before the modules/cell that use them.
collectDeps :: ProjCell -> Array (Tuple String ProjCell) -> Array ProjCell
collectDeps target moduleMap =
  (foldl go { seen: [], acc: [] } (importModuleNames target.source)).acc
  where
  go :: { seen :: Array String, acc :: Array ProjCell } -> String -> { seen :: Array String, acc :: Array ProjCell }
  go st name =
    if elem name st.seen then st
    else
      let st1 = st { seen = snoc st.seen name }
      in case lookupModule name moduleMap of
           Nothing -> st1
           Just dep ->
             let st2 = foldl go st1 (importModuleNames dep.source)
             in st2 { acc = snoc st2.acc dep }

buildRunnableCellSource :: ProjCell -> Array ProjCell -> String
buildRunnableCellSource target cells =
  if not (isRunnableCell target) then target.source
  else
    let
      deps = collectDeps target (visibleModuleMap cells)
      chunks = filter (_ /= "")
        (map trim
          ([ moduleHeaderFor target ]
            <> map (\c -> sourceBody c.source) deps
            <> [ sourceBody target.source ]))
    in joinWith "\n\n" chunks <> "\n"

buildNotebookProgramSource :: Array ProjCell -> String
buildNotebookProgramSource cells =
  let
    codeCells = filter (\c -> c.kind == "code") cells
    chunks = filter (_ /= "")
      (map trim
        ([ "module Main exposing (..)" ] <> map (\c -> sourceBody c.source) codeCells))
  in joinWith "\n\n" chunks <> "\n"

normalizeCellMeta :: ProjCell -> CellMeta
normalizeCellMeta cell =
  let
    kind = if cell.kind == "wysiwyg" then "wysiwyg" else "code"
    source = cell.source
    moduleName =
      if cell.moduleName /= "" then cell.moduleName
      else fromMaybe (if kind == "code" then "Main" else "") (cellModuleName source)
    role = inferCellRole (cell { kind = kind, source = source, moduleName = moduleName })
    path =
      if cell.path /= "" then cell.path
      else if moduleName /= "" then replaceAll (Pattern ".") (Replacement "/") moduleName <> ".verdict"
      else ""
  in { kind, source, role, moduleName, path }
