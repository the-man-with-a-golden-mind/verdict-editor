module Pages.Editor
  ( Model
  , Msg(..)
  , hasSubscriptions
  , init
  , kind
  , page
  , protect
  , subscriptions
  , update
  , view
  ) where

import Prelude

import Data.Maybe (Maybe(..))
import Generated.Link as Link
import Generated.Route (Request, Route(..))
import PsSpa.Effect as Effect
import PsSpa.Html.DSL (element, h1, main, text, div, span)
import PsSpa.Page as Page
import PsSpa.PageKind (PageKind(..))
import PsSpa.View (Document)

type Model =
  { status :: String
  }

data Msg
  = Triggered

page :: forall shared command subscription. Request -> Page.Page Model Msg shared Route command subscription
page _ =
  Page.advanced
    { init
    , update
    , view
    , subscriptions
    }

protect :: forall shared. shared -> Request -> Maybe Route
protect _ _ =
  Nothing

init :: forall shared route command. Page.Step Model (Effect.Effect command shared route)
init =
  { model:
      { status: "ready"
      }
  , effect: Effect.none
  }

update :: forall shared route command. Msg -> Model -> Page.Step Model (Effect.Effect command shared route)
update msg model =
  case msg of
    Triggered ->
      { model:
          { status: "handled"
          }
      , effect: Effect.none
      }

subscriptions :: forall subscription. Model -> Array (subscription Msg)
subscriptions _ =
  []

view :: Model -> Document Msg
view model =
  { title: "Verdict IDE"
  , body:
      [ main
          { className: "h-screen w-screen flex flex-col bg-[#0b0f1a] text-slate-200 font-sans overflow-hidden" }
          [ div
              { className: "flex items-center justify-between px-5 py-2.5 bg-slate-950/90 border-b border-slate-800" }
              [ div
                  { className: "flex items-center gap-3" }
                  [ div
                      { className: "flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-indigo-600 text-sm font-black text-white shadow-lg shadow-indigo-900/40 ring-1 ring-inset ring-white/15" }
                      [ text "V" ]
                  , div
                      { className: "flex items-baseline gap-1.5" }
                      [ h1
                          { className: "text-lg font-bold tracking-tight text-white" }
                          [ text "Verdict" ]
                      , span
                          { className: "text-lg font-light text-slate-500" }
                          [ text "IDE" ]
                      ]
                  , span
                      { className: "rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-400 ring-1 ring-inset ring-white/5" }
                      [ text "v0.1" ]
                  ]
              , div
                  { className: "flex items-center gap-2" }
                  [ Link.link
                      Editor
                      { className: "rounded-md bg-indigo-600/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-200 ring-1 ring-inset ring-indigo-400/40" }
                      [ text "Editor" ]
                  , Link.link
                      EditorDebug
                      { className: "rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 transition-colors hover:text-white" }
                      [ text "Debug" ]
                  , span
                      { className: "hidden font-mono text-xs text-slate-600 sm:block ml-2" }
                      [ text "Verdict → FinVM" ]
                  , Link.link
                      Index
                      { className: "ml-2 text-sm font-medium text-slate-400 transition-colors hover:text-white" }
                      [ text "Home" ]
                  ]
              ]
          , div
              { className: "relative flex-1 min-h-0" }
              [ element "verdict-editor" {} [] ]
          ]
      ]
  }

kind :: PageKind
kind = Advanced

hasSubscriptions :: Boolean
hasSubscriptions = true