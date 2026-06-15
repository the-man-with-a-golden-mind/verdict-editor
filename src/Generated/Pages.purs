module Generated.Pages
  ( PageMeta
  , loadPage
  , pageForRoute
  , pages
  ) where

import Data.Maybe (Maybe(..))
import App.Runtime as AppRuntime
import Generated.Route (Request, Route(..))
import PsSpa.LoadResult as LoadResult
import PsSpa.LoadedPage as LoadedPage
import PsSpa.Page as Page
import PsSpa.PageKind (PageKind)
import Pages.Editor.Debug as EditorDebugPage
import Pages.Editor as EditorPage
import Pages.Index as IndexPage
import Pages.NotFound as NotFoundPage

type PageMeta =
  { moduleName :: String
  , sourcePath :: String
  , routePattern :: String
  , kind :: PageKind
  , hasSubscriptions :: Boolean
  }

pages :: Array PageMeta
pages =
  [ metaEditorDebug
  , metaEditor
  , metaIndex
  , metaNotFound
  ]

pageForRoute :: Route -> PageMeta
pageForRoute route =
  case route of
    EditorDebug -> metaEditorDebug
    Editor -> metaEditor
    Index -> metaIndex
    NotFound -> metaNotFound

loadPage
  :: forall shared
   . shared
  -> Request
  -> LoadResult.LoadResult shared Route AppRuntime.Command AppRuntime.Subscription
loadPage shared request =
  case request.route of
    EditorDebug -> decide EditorDebugPage.page EditorDebugPage.protect shared request
    Editor -> decide EditorPage.page EditorPage.protect shared request
    Index -> decide IndexPage.page IndexPage.protect shared request
    NotFound -> decide NotFoundPage.page NotFoundPage.protect shared request

decide
  :: forall model msg shared
   . (Request -> Page.Page model msg shared Route AppRuntime.Command AppRuntime.Subscription)
  -> (shared -> Request -> Maybe Route)
  -> shared
  -> Request
  -> LoadResult.LoadResult shared Route AppRuntime.Command AppRuntime.Subscription
decide load protect shared request =
  case protect shared request of
    Just redirect ->
      LoadResult.Redirect redirect

    Nothing ->
      LoadResult.Loaded (LoadedPage.fromPage (load request))

metaEditorDebug :: PageMeta
metaEditorDebug =
  { moduleName: "Pages.Editor.Debug"
  , sourcePath: "src/Pages/Editor/Debug.purs"
  , routePattern: "/editor/debug"
  , kind: EditorDebugPage.kind
  , hasSubscriptions: EditorDebugPage.hasSubscriptions
  }

metaEditor :: PageMeta
metaEditor =
  { moduleName: "Pages.Editor"
  , sourcePath: "src/Pages/Editor.purs"
  , routePattern: "/editor"
  , kind: EditorPage.kind
  , hasSubscriptions: EditorPage.hasSubscriptions
  }

metaIndex :: PageMeta
metaIndex =
  { moduleName: "Pages.Index"
  , sourcePath: "src/Pages/Index.purs"
  , routePattern: "/"
  , kind: IndexPage.kind
  , hasSubscriptions: IndexPage.hasSubscriptions
  }

metaNotFound :: PageMeta
metaNotFound =
  { moduleName: "Pages.NotFound"
  , sourcePath: "src/Pages/NotFound.purs"
  , routePattern: "/not-found"
  , kind: NotFoundPage.kind
  , hasSubscriptions: NotFoundPage.hasSubscriptions
  }
