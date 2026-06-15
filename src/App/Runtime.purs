module App.Runtime
  ( Command
  , Subscription
  , onCommand
  , onSubscription
  ) where

import Prelude

import Effect (Effect)
import PsSpa.Browser (Cleanup)

-- | Default app-level command type. Leave it empty until your app needs custom
-- | effects; then add constructors and implement `onCommand`.
type Command = Void

-- | Default app-level subscription type. Leave it empty until your app needs
-- | custom subscriptions; then add constructors and implement
-- | `onSubscription`.
data Subscription :: Type -> Type
data Subscription msg = NoSubscription

onCommand :: Command -> Effect Unit
onCommand = absurd

onSubscription :: forall msg. (msg -> Effect Unit) -> Subscription msg -> Effect Cleanup
onSubscription _ NoSubscription =
  pure (pure unit)
