module Notebook.Model
  ( Model
  , Msg(..)
  , JsCell
  , JsModel
  , JsMsg
  , update
  , updateJsModel
  ) where

import Prelude

import Cell (Cell, CellKind(..), CellUi, defaultCellUi)
import Data.Array as Array
import Data.Maybe (Maybe(..), fromMaybe)
import Data.Nullable (Nullable, toMaybe, toNullable)

type Model =
  { cells :: Array Cell
  , focusedId :: Maybe String
  , maximizedId :: Maybe String
  }

data Msg
  = Focus String
  | ToggleFold String
  | SetFolded String Boolean
  | ToggleCodeFold String
  | SetCodeFolded String Boolean
  | ToggleOutputFold String
  | SetOutputFolded String Boolean
  | SetOutputHeight String Int
  | SetEditorHeight String Int
  | Maximize String
  | ClearMaximize
  | InsertBelow String Cell
  | AppendCell Cell
  | DeleteCell String Cell
  | MoveCell String Int
  | SetSource String String
  | ReplaceOne Cell
  | ReplaceCells (Array Cell)

type JsCell =
  { id :: String
  , kind :: String
  , role :: String
  , path :: String
  , moduleName :: String
  , source :: String
  , ui :: CellUi
  }

type JsModel =
  { cells :: Array JsCell
  , focusedId :: Nullable String
  , maximizedId :: Nullable String
  }

type JsMsg =
  { tag :: String
  , id :: String
  , kind :: String
  , delta :: Int
  , source :: String
  , folded :: Boolean
  , height :: Int
  , cell :: JsCell
  , fallbackCell :: JsCell
  , cells :: Array JsCell
  }

updateJsModel :: JsMsg -> JsModel -> JsModel
updateJsModel rawMsg rawModel =
  modelToJs (update (jsToMsg rawMsg) (jsToModel rawModel))

update :: Msg -> Model -> Model
update msg model = case msg of
  Focus id ->
    model { focusedId = Just id }

  ToggleFold id ->
    updateCellUi id (\ui -> ui { folded = not ui.folded }) model

  SetFolded id folded ->
    updateCellUi id (\ui -> ui { folded = folded }) model

  ToggleCodeFold id ->
    updateCellUi id (\ui -> ui { codeFolded = not ui.codeFolded }) model

  SetCodeFolded id folded ->
    updateCellUi id (\ui -> ui { codeFolded = folded }) model

  ToggleOutputFold id ->
    updateCellUi id (\ui -> ui { outputFolded = not ui.outputFolded }) model

  SetOutputFolded id folded ->
    updateCellUi id (\ui -> ui { outputFolded = folded }) model

  SetOutputHeight id height ->
    updateCellUi id (\ui -> ui { outputHeight = max 96 height }) model

  SetEditorHeight id height ->
    updateCellUi id (\ui -> ui { editorHeight = max 48 height, editorResized = true }) model

  Maximize id ->
    if model.maximizedId == Just id then
      model { maximizedId = Nothing, focusedId = Just id }
    else
      model { maximizedId = Just id }

  ClearMaximize ->
    model { maximizedId = Nothing }

  InsertBelow id cell ->
    insertBelow id cell model

  AppendCell cell ->
    focusInserted cell (model { cells = model.cells <> [ cell ] })

  DeleteCell id fallback ->
    deleteCell id fallback model

  MoveCell id delta ->
    moveCell id delta model

  SetSource id source ->
    updateCell id (\cell -> cell { source = source }) model

  ReplaceOne cell ->
    focusInserted cell (model { cells = [ cell ], maximizedId = Nothing })

  ReplaceCells cells ->
    let next = if Array.null cells then [ emptyCodeCell ] else cells
    in model
      { cells = next
      , focusedId = firstCodeId next
      , maximizedId = Nothing
      }

insertBelow :: String -> Cell -> Model -> Model
insertBelow id cell model =
  let
    idx = fromMaybe (Array.length model.cells - 1) (Array.findIndex (\c -> c.id == id) model.cells)
    nextCells = fromMaybe (model.cells <> [ cell ]) (Array.insertAt (idx + 1) cell model.cells)
  in focusInserted cell (model { cells = nextCells })

deleteCell :: String -> Cell -> Model -> Model
deleteCell id fallback model =
  case Array.findIndex (\c -> c.id == id) model.cells of
    Nothing -> model
    Just idx ->
      let
        deleted = fromMaybe model.cells (Array.deleteAt idx model.cells)
        nextCells = if Array.null deleted then [ fallback ] else deleted
        nextFocused =
          if model.focusedId == Just id then firstCodeId nextCells
          else model.focusedId
        nextMaximized =
          if model.maximizedId == Just id then Nothing
          else model.maximizedId
      in model
        { cells = nextCells
        , focusedId = nextFocused
        , maximizedId = nextMaximized
        }

moveCell :: String -> Int -> Model -> Model
moveCell id delta model =
  case Array.findIndex (\c -> c.id == id) model.cells of
    Nothing -> model
    Just idx ->
      let
        len = Array.length model.cells
        target = max 0 (min (len - 1) (idx + delta))
      in if target == idx then model
         else case Array.index model.cells idx of
          Nothing -> model
          Just cell ->
            let
              without = fromMaybe model.cells (Array.deleteAt idx model.cells)
              nextCells = fromMaybe model.cells (Array.insertAt target cell without)
            in model { cells = nextCells }

focusInserted :: Cell -> Model -> Model
focusInserted cell model =
  if cell.kind == Code then model { focusedId = Just cell.id }
  else model

updateCell :: String -> (Cell -> Cell) -> Model -> Model
updateCell id f model =
  model { cells = map (\cell -> if cell.id == id then f cell else cell) model.cells }

updateCellUi :: String -> (CellUi -> CellUi) -> Model -> Model
updateCellUi id f =
  updateCell id (\cell -> cell { ui = f cell.ui })

firstCodeId :: Array Cell -> Maybe String
firstCodeId cells = case Array.find (\c -> c.kind == Code) cells of
  Just cell -> Just cell.id
  Nothing -> case Array.head cells of
    Just cell -> Just cell.id
    Nothing -> Nothing

emptyCodeCell :: Cell
emptyCodeCell =
  { id: ""
  , kind: Code
  , role: "runnable"
  , path: ""
  , moduleName: "Main"
  , source: ""
  , ui: defaultCellUi
  }

jsToMsg :: JsMsg -> Msg
jsToMsg msg = case msg.tag of
  "focus" -> Focus msg.id
  "toggleFold" -> ToggleFold msg.id
  "setFolded" -> SetFolded msg.id msg.folded
  "toggleCodeFold" -> ToggleCodeFold msg.id
  "setCodeFolded" -> SetCodeFolded msg.id msg.folded
  "toggleOutputFold" -> ToggleOutputFold msg.id
  "setOutputFolded" -> SetOutputFolded msg.id msg.folded
  "setOutputHeight" -> SetOutputHeight msg.id msg.height
  "setEditorHeight" -> SetEditorHeight msg.id msg.height
  "maximize" -> Maximize msg.id
  "clearMaximize" -> ClearMaximize
  "insertBelow" -> InsertBelow msg.id (jsToCell msg.cell)
  "appendCell" -> AppendCell (jsToCell msg.cell)
  "deleteCell" -> DeleteCell msg.id (jsToCell msg.fallbackCell)
  "moveCell" -> MoveCell msg.id msg.delta
  "setSource" -> SetSource msg.id msg.source
  "replaceOne" -> ReplaceOne (jsToCell msg.cell)
  "replaceCells" -> ReplaceCells (map jsToCell msg.cells)
  _ -> Focus msg.id

jsToModel :: JsModel -> Model
jsToModel model =
  { cells: map jsToCell model.cells
  , focusedId: toMaybe model.focusedId
  , maximizedId: toMaybe model.maximizedId
  }

modelToJs :: Model -> JsModel
modelToJs model =
  { cells: map cellToJs model.cells
  , focusedId: toNullable model.focusedId
  , maximizedId: toNullable model.maximizedId
  }

jsToCell :: JsCell -> Cell
jsToCell cell =
  { id: cell.id
  , kind: kindFromString cell.kind
  , role: cell.role
  , path: cell.path
  , moduleName: cell.moduleName
  , source: cell.source
  , ui: cell.ui
  }

cellToJs :: Cell -> JsCell
cellToJs cell =
  { id: cell.id
  , kind: kindToString cell.kind
  , role: cell.role
  , path: cell.path
  , moduleName: cell.moduleName
  , source: cell.source
  , ui: cell.ui
  }

kindFromString :: String -> CellKind
kindFromString "wysiwyg" = Wysiwyg
kindFromString _ = Code

kindToString :: CellKind -> String
kindToString Code = "code"
kindToString Wysiwyg = "wysiwyg"
