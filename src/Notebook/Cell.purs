module Cell
  ( CellKind(..)
  , Cell
  , CellUi
  , defaultCellUi
  ) where

import Prelude

data CellKind = Code | Wysiwyg

derive instance eqCellKind :: Eq CellKind

type CellUi =
  { folded :: Boolean
  , codeFolded :: Boolean
  , outputFolded :: Boolean
  , editorHeight :: Int
  , editorResized :: Boolean
  , outputHeight :: Int
  }

type Cell =
  { id :: String
  , kind :: CellKind
  , role :: String
  , path :: String
  , moduleName :: String
  , source :: String
  , ui :: CellUi
  }

defaultCellUi :: CellUi
defaultCellUi =
  { folded: false
  , codeFolded: false
  , outputFolded: false
  , editorHeight: 160
  , editorResized: false
  , outputHeight: 180
  }
