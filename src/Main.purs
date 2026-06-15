module Main where

import Prelude

import Effect (Effect)
import Generated.App as App
import Shared as Shared

main :: Effect Unit
main =
  App.startWithShared Shared.init
