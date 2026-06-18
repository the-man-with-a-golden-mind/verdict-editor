module Display
  ( DisplayKind(..)
  , decodeDisplayKind
  , renderDisplayIntoExport
  ) where

import Prelude

import Data.Maybe (Maybe(..))
import Effect (Effect)
import Effect.Uncurried (EffectFn3, mkEffectFn3)
import Foreign (Foreign)

data DisplayKind
  = TextKind
  | ChartKind
  | TableKind
  | StackKind
  | UnknownKind

foreign import decodeDisplayKindImpl :: Foreign -> String
foreign import renderDisplayIntoImpl :: Foreign -> Foreign -> Foreign -> Effect Unit

decodeDisplayKind :: Foreign -> Maybe DisplayKind
decodeDisplayKind f =
  case decodeDisplayKindImpl f of
    "text" -> Just TextKind
    "chart" -> Just ChartKind
    "table" -> Just TableKind
    "stack" -> Just StackKind
    _ -> Just UnknownKind

renderDisplayIntoExport :: EffectFn3 Foreign Foreign Foreign Unit
renderDisplayIntoExport = mkEffectFn3 renderDisplayIntoImpl
