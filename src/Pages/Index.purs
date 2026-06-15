module Pages.Index
  ( hasSubscriptions
  , kind
  , page
  , protect
  , view
  ) where

import Prelude
import Data.Maybe (Maybe(..))
import Generated.Link as Link
import Generated.Route (Request, Route(..))
import PsSpa.Html.DSL (h1, main, p, text, div, span)
import PsSpa.Page as Page
import PsSpa.PageKind (PageKind(..))
import PsSpa.View (Document)

page :: forall shared command subscription. Request -> Page.Page Unit Void shared Route command subscription
page _ =
  Page.static
    { view }

protect :: forall shared. shared -> Request -> Maybe Route
protect _ _ =
  Nothing

view :: Document Void
view =
  { title: "Home"
  , body:
      [ main
          { className: "relative flex min-h-screen flex-col items-center justify-center gap-7 overflow-hidden bg-[#0b0f1a] px-6 py-16 text-center font-sans" }
          [ div
              { className: "pointer-events-none absolute -top-40 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" }
              []
          , div
              { className: "relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-600 text-3xl font-black text-white shadow-2xl shadow-indigo-900/50 ring-1 ring-inset ring-white/20" }
              [ text "V" ]
          , div
              { className: "relative flex flex-col gap-3" }
              [ h1
                  { className: "text-5xl font-extrabold tracking-tight text-white" }
                  [ text "Verdict"
                  , span { className: "text-slate-600" } [ text " IDE" ]
                  ]
              , p
                  { className: "mx-auto max-w-xl text-lg text-slate-400" }
                  [ text "An intelligent editor for the Verdict language — with live types, instant diagnostics, and inline results as you type." ]
              ]
          , div
              { className: "relative flex flex-wrap items-center justify-center gap-2" }
              [ chip "Type-on-hover"
              , chip "Live diagnostics"
              , chip "Inline results"
              , chip "Runs on FinVM"
              ]
          , Link.link
              Editor
              { className: "relative mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-b from-violet-500 to-indigo-600 px-7 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-xl shadow-indigo-900/40 ring-1 ring-inset ring-white/15 transition-all hover:from-violet-400 hover:to-indigo-500 hover:shadow-indigo-700/50" }
              [ text "Open Editor →" ]
          ]
      ]
  }
  where
  chip label =
    span
      { className: "rounded-full border border-slate-700/70 bg-slate-800/40 px-3 py-1 text-xs font-medium text-slate-300" }
      [ text label ]

kind :: PageKind
kind = Static

hasSubscriptions :: Boolean
hasSubscriptions = false
