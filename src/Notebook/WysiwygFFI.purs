module WysiwygFFI
  ( mountWysiwyg
  , destroyWysiwyg
  ) where

import Prelude

import Effect (Effect)
import Effect.Uncurried (EffectFn3, EffectFn1, mkEffectFn1, mkEffectFn3)
import Foreign (Foreign)

foreign import mountWysiwygImpl :: EffectFn3 Foreign String (String -> Effect Unit) Foreign
foreign import destroyWysiwygImpl :: EffectFn1 Foreign (Effect Unit)

mountWysiwyg :: EffectFn3 Foreign String (String -> Effect Unit) Foreign
mountWysiwyg = mountWysiwygImpl

destroyWysiwyg :: EffectFn1 Foreign (Effect Unit)
destroyWysiwyg = destroyWysiwygImpl
