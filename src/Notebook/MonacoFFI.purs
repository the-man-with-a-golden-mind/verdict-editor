module MonacoFFI
  ( colorize
  , createEditor
  , disposeEditor
  ) where

import Prelude

import Effect (Effect)
import Effect.Uncurried (EffectFn2, EffectFn3, EffectFn1, mkEffectFn1, mkEffectFn2, mkEffectFn3)
import Foreign (Foreign)

foreign import colorizeImpl :: EffectFn2 String Foreign (Effect String)
foreign import createEditorImpl :: EffectFn3 Foreign String Foreign (Effect Foreign)
foreign import disposeEditorImpl :: EffectFn1 Foreign (Effect Unit)

colorize :: EffectFn2 String Foreign (Effect String)
colorize = colorizeImpl

createEditor :: EffectFn3 Foreign String Foreign (Effect Foreign)
createEditor = createEditorImpl

disposeEditor :: EffectFn1 Foreign (Effect Unit)
disposeEditor = disposeEditorImpl
