-- | Thin DOM FFI for the code-block renderer. We build plain HTML elements and
-- | let the browser's flex layout do the recursive measure-and-place, rather
-- | than computing SVG coordinates by hand.
module BlockDom
  ( El
  , createEl
  , setClassName
  , setText
  , setAttr
  , appendChild
  , mount
  ) where

import Prelude (Unit)
import Effect (Effect)

foreign import data El :: Type

foreign import createEl :: String -> Effect El
foreign import setClassName :: String -> El -> Effect Unit
foreign import setText :: String -> El -> Effect Unit
foreign import setAttr :: String -> String -> El -> Effect Unit
-- | `appendChild child parent`.
foreign import appendChild :: El -> El -> Effect Unit
-- | Clear the element matched by the selector and mount `node` inside it.
foreign import mount :: String -> El -> Effect Unit
