module Main where

import Prelude

import Effect (Effect)
import Effect.Uncurried (EffectFn2, mkEffectFn2)
import Foreign (unsafeToForeign)
import CodeBlocks (renderInto)

-- | Render the Verdict AST (from the compiler's `astJS`) as nested code blocks.
-- | Exposed as an `EffectFn2` so the JS host can call `renderCode(selector, ast)`
-- | directly (a plain curried `Effect` would just return a thunk).
renderCode :: forall a. EffectFn2 String a Unit
renderCode = mkEffectFn2 \selector ast -> renderInto selector (unsafeToForeign ast)

main :: Effect Unit
main = pure unit
