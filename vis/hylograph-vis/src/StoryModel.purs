module StoryModel where

import Prelude

import Control.Monad.Except (runExcept)
import Data.Array (length)
import Data.Array as Array
import Data.Either (Either(..))
import Data.Maybe (Maybe(..), fromMaybe)
import Foreign (Foreign, readArray, readNumber, readString)
import Foreign.Index (readProp)

type StoryStep =
  { id :: String
  , title :: String
  , detail :: String
  , kind :: String
  }

type StoryDecision =
  { id :: String
  , question :: String
  , yes :: String
  , no :: String
  }

type StoryConsequence =
  { id :: String
  , label :: String
  , detail :: String
  , tone :: String
  }

type StoryLink =
  { source :: String
  , target :: String
  , value :: Number
  , label :: String
  }

type StoryModel =
  { title :: String
  , summary :: String
  , steps :: Array StoryStep
  , decisions :: Array StoryDecision
  , consequences :: Array StoryConsequence
  , links :: Array StoryLink
  }

readStringProp :: String -> Foreign -> Maybe String
readStringProp key obj =
  case runExcept (readProp key obj >>= readString) of
    Right s -> Just s
    Left _ -> Nothing

readNumberProp :: String -> Foreign -> Maybe Number
readNumberProp key obj =
  case runExcept (readProp key obj >>= readNumber) of
    Right n -> Just n
    Left _ -> Nothing

readArrayProp :: String -> Foreign -> Maybe (Array Foreign)
readArrayProp key obj =
  case runExcept (readProp key obj >>= readArray) of
    Right arr -> Just arr
    Left _ -> Nothing

readStep :: Foreign -> StoryStep
readStep f =
  { id: readStringProp "id" f # fromMaybe "step"
  , title: readStringProp "title" f # fromMaybe "Step"
  , detail: readStringProp "detail" f # fromMaybe ""
  , kind: readStringProp "kind" f # fromMaybe "process"
  }

readDecision :: Foreign -> StoryDecision
readDecision f =
  { id: readStringProp "id" f # fromMaybe "decision"
  , question: readStringProp "question" f # fromMaybe "Decision"
  , yes: readStringProp "yes" f # fromMaybe "Yes path"
  , no: readStringProp "no" f # fromMaybe "No path"
  }

readConsequence :: Foreign -> StoryConsequence
readConsequence f =
  { id: readStringProp "id" f # fromMaybe "consequence"
  , label: readStringProp "label" f # fromMaybe "Outcome"
  , detail: readStringProp "detail" f # fromMaybe ""
  , tone: readStringProp "tone" f # fromMaybe "neutral"
  }

readLink :: Foreign -> StoryLink
readLink f =
  { source: readStringProp "source" f # fromMaybe "Start"
  , target: readStringProp "target" f # fromMaybe "End"
  , value: readNumberProp "value" f # fromMaybe 1.0
  , label: readStringProp "label" f # fromMaybe ""
  }

decodeStoryModel :: Foreign -> StoryModel
decodeStoryModel f =
  { title: readStringProp "title" f # fromMaybe "Strategy Story"
  , summary: readStringProp "summary" f # fromMaybe ""
  , steps: readArrayProp "steps" f # map (map readStep) # fromMaybe []
  , decisions: readArrayProp "decisions" f # map (map readDecision) # fromMaybe []
  , consequences: readArrayProp "consequences" f # map (map readConsequence) # fromMaybe []
  , links: readArrayProp "links" f # map (map readLink) # fromMaybe []
  }

emptyStory :: StoryModel
emptyStory =
  { title: "Strategy Story"
  , summary: "Edit or run code to generate a plain-language story."
  , steps: []
  , decisions: []
  , consequences: []
  , links: []
  }

hasContent :: StoryModel -> Boolean
hasContent model =
  length model.steps > 0
    || length model.decisions > 0
    || length model.consequences > 0
    || length model.links > 0
