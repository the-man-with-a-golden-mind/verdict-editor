module PlotlyFFI
  ( renderChart
  ) where

import Prelude

import Effect (Effect)
import Effect.Uncurried (EffectFn3, mkEffectFn3)
import Foreign (Foreign)

foreign import renderChartImpl :: EffectFn3 Foreign Foreign Foreign (Effect Unit)

renderChart :: EffectFn3 Foreign Foreign Foreign (Effect Unit)
renderChart = renderChartImpl
