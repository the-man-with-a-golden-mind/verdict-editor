module Cell
  ( CellKind(..)
  , Cell
  ) where

import Prelude

data CellKind = Code | Wysiwyg

derive instance eqCellKind :: Eq CellKind

type Cell =
  { id :: String
  , kind :: CellKind
  , source :: String
  }
