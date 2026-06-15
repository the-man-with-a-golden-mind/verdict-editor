module Generated.App
  ( AppConfig
  , start
  , startWithShared
  , startWith
  ) where

import Prelude

import App.Runtime as AppRuntime
import Effect (Effect)
import Generated.Pages as Pages
import Generated.Route as Route
import PsSpa.Browser as Browser
import PsSpa.Runtime as Runtime

type AppConfig shared =
  { initialShared :: shared
  , onCommand :: AppRuntime.Command -> Effect Unit
  , onSubscription :: forall msg. (msg -> Effect Unit) -> AppRuntime.Subscription msg -> Effect Browser.Cleanup
  , rootId :: String
  , sharedSubscriptions :: Route.Request -> shared -> Array (AppRuntime.Subscription Void)
  }

start :: Effect Unit
start =
  startWithShared unit

startWithShared :: forall shared. shared -> Effect Unit
startWithShared initialShared =
  startWith
    { initialShared
    , onCommand: AppRuntime.onCommand
    , onSubscription: AppRuntime.onSubscription
    , rootId: "app"
    , sharedSubscriptions: \_ _ -> []
    }

startWith :: forall shared. AppConfig shared -> Effect Unit
startWith config =
  Runtime.start
    { initialShared: config.initialShared
    , loadPage: Pages.loadPage
    , onCommand: config.onCommand
    , onSubscription: config.onSubscription
    , parseRequest: Route.parseRequest
    , rootId: config.rootId
    , sharedSubscriptions: config.sharedSubscriptions
    , toPath: Route.toPath
    }
