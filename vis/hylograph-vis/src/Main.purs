module Main where

import Prelude

import Effect (Effect)
import Foreign (Foreign, unsafeToForeign)
import VerdictVis (renderVerdictStory)

-- | ES module export used by the editor host.
render :: forall a. String -> a -> Effect Unit
render selector model = renderVerdictStory selector (unsafeToForeign model)

main :: Effect Unit
main = pure unit
