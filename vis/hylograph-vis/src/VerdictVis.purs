module VerdictVis where

import Prelude

import Data.Array (length, null, zipWith, range)
import Data.Array as Array
import Data.Int as Int
import Data.String as String
import Data.String.Pattern (Pattern(..))
import Effect (Effect)
import Foreign (Foreign)
import Hylograph.HATS (Tree, elem, staticStr)
import Hylograph.HATS.Friendly as F
import Hylograph.HATS.InterpreterTick (rerenderInto)
import Hylograph.Internal.Element.Types (ElementType(..))
import StoryModel
  ( StoryModel
  , StoryStep
  , StoryDecision
  , StoryConsequence
  , StoryLink
  , decodeStoryModel
  , emptyStory
  , hasContent
  )

renderVerdictStory :: String -> Foreign -> Effect Unit
renderVerdictStory selector modelForeign = do
  let model = decodeStoryModel modelForeign
  if not (hasContent model) then
    void $ rerenderInto selector (emptyState model)
  else
    void $ rerenderInto selector (storyTree model)

emptyState :: StoryModel -> Tree
emptyState model =
  elem SVG [ F.viewBox 0.0 0.0 900.0 120.0, F.width 900.0, F.height 120.0 ]
    [ elem Text
        [ F.x 24.0, F.y 42.0, F.fill "#94a3b8", staticStr "fontSize" "14px", staticStr "fontFamily" "Inter, sans-serif" ]
        [ staticStr "textContent" model.summary ]
    ]

storyTree :: StoryModel -> Tree
storyTree model =
  let
    stepCount = length model.steps
    decisionCount = length model.decisions
    consequenceCount = length model.consequences
    stepBlockH = 92.0
    decisionBlockH = 118.0
    consequenceBlockH = 86.0
    gap = 18.0
    top = 72.0
    stepsH = if stepCount == 0 then 0.0 else top + Int.toNumber stepCount * (stepBlockH + gap)
    decisionsTop = stepsH + (if stepCount == 0 then 0.0 else 36.0)
    decisionsH = if decisionCount == 0 then 0.0 else decisionsTop + Int.toNumber decisionCount * (decisionBlockH + gap)
    consequencesTop = decisionsH + (if decisionCount == 0 then 0.0 else 36.0)
    consequencesH = if consequenceCount == 0 then 0.0 else consequencesTop + Int.toNumber consequenceCount * (consequenceBlockH + gap)
    linksTop = consequencesH + (if consequenceCount == 0 then 0.0 else 36.0)
    linksH = if null model.links then 0.0 else 220.0
    totalH = max 520.0 (linksTop + linksH + 40.0)
    stepNodes = zipWith (\idx step -> stepCard step 24.0 (top + Int.toNumber idx * (stepBlockH + gap)) 932.0 stepBlockH) (range 0 (max 0 (stepCount - 1))) model.steps
    decisionNodes = zipWith (\idx dec -> decisionCard dec 24.0 (decisionsTop + Int.toNumber idx * (decisionBlockH + gap)) 932.0 decisionBlockH) (range 0 (max 0 (decisionCount - 1))) model.decisions
    consequenceNodes = zipWith (\idx con -> consequenceCard con 24.0 (consequencesTop + Int.toNumber idx * (consequenceBlockH + gap)) 932.0 consequenceBlockH) (range 0 (max 0 (consequenceCount - 1))) model.consequences
  in
    elem SVG
      [ F.viewBox 0.0 0.0 980.0 totalH, F.width 980.0, F.height totalH, staticStr "style" "background:#071026;border-radius:10px;" ]
      ( [ elem Text
            [ F.x 24.0, F.y 28.0, F.fill "#e2e8f0", staticStr "fontSize" "18px", staticStr "fontWeight" "700", staticStr "fontFamily" "Inter, sans-serif" ]
            [ staticStr "textContent" model.title ]
        , elem Text
            [ F.x 24.0, F.y 52.0, F.fill "#94a3b8", staticStr "fontSize" "13px", staticStr "fontFamily" "Inter, sans-serif" ]
            [ staticStr "textContent" model.summary ]
        , sectionTitle "What Happens" 24.0 top
        ]
          <> stepNodes
          <> (if decisionCount > 0 then [ sectionTitle "Decisions" 24.0 decisionsTop ] else [])
          <> decisionNodes
          <> (if consequenceCount > 0 then [ sectionTitle "Consequences" 24.0 consequencesTop ] else [])
          <> consequenceNodes
          <> (if null model.links then [] else [ sectionTitle "Data & Impact Flow" 24.0 linksTop, flowSankey model.links linksTop ])
      )

sectionTitle :: String -> Number -> Number -> Tree
sectionTitle label x y =
  elem Text
    [ F.x x, F.y y, F.fill "#64748b", staticStr "fontSize" "11px", staticStr "fontWeight" "700", staticStr "letterSpacing" "0.12em", staticStr "fontFamily" "Inter, sans-serif", staticStr "textTransform" "uppercase" ]
    [ staticStr "textContent" label ]

stepCard :: StoryStep -> Number -> Number -> Number -> Number -> Tree
stepCard step x y w h =
  let
    fill =
      case step.kind of
        "input" -> "#0f172a"
        "external" -> "#172554"
        "storage" -> "#052e16"
        "notify" -> "#3b0764"
        _ -> "#111827"
    stroke =
      case step.kind of
        "input" -> "#38bdf8"
        "external" -> "#60a5fa"
        "storage" -> "#34d399"
        "notify" -> "#c084fc"
        _ -> "#818cf8"
  in
    elem Group []
      [ elem Rect [ F.x x, F.y y, F.width w, F.height h, F.rx 12.0, F.fill fill, staticStr "stroke" stroke, staticStr "strokeWidth" "1.5" ] []
      , elem Text [ F.x (x + 16.0), F.y (y + 28.0), F.fill "#e2e8f0", staticStr "fontSize" "14px", staticStr "fontWeight" "700", staticStr "fontFamily" "Inter, sans-serif" ] [ staticStr "textContent" step.title ]
      , elem Text [ F.x (x + 16.0), F.y (y + 52.0), F.fill "#cbd5e1", staticStr "fontSize" "12px", staticStr "fontFamily" "Inter, sans-serif" ] [ staticStr "textContent" step.detail ]
      ]

decisionCard :: StoryDecision -> Number -> Number -> Number -> Number -> Tree
decisionCard dec x y w h =
  let
    cx = x + w / 2.0
    cy = y + h / 2.0
    points = show cx <> "," <> show (y + 12.0) <> " " <> show (x + w - 24.0) <> "," <> show cy <> " " <> show cx <> "," <> show (y + h - 12.0) <> " " <> show (x + 24.0) <> "," <> show cy
  in
    elem Group []
      [ elem Polygon [ staticStr "points" points, F.fill "#1f2937", staticStr "stroke" "#f59e0b", staticStr "strokeWidth" "2" ] []
      , elem Text [ F.x (x + 120.0), F.y (y + 28.0), F.fill "#fde68a", staticStr "fontSize" "13px", staticStr "fontWeight" "700", staticStr "fontFamily" "Inter, sans-serif" ] [ staticStr "textContent" dec.question ]
      , elem Text [ F.x (x + 120.0), F.y (y + 54.0), F.fill "#86efac", staticStr "fontSize" "11px", staticStr "fontFamily" "Inter, sans-serif" ] [ staticStr "textContent" ("Yes: " <> dec.yes) ]
      , elem Text [ F.x (x + 120.0), F.y (y + 72.0), F.fill "#93c5fd", staticStr "fontSize" "11px", staticStr "fontFamily" "Inter, sans-serif" ] [ staticStr "textContent" ("No: " <> dec.no) ]
      ]

consequenceCard :: StoryConsequence -> Number -> Number -> Number -> Number -> Tree
consequenceCard con x y w h =
  let
    stroke =
      case con.tone of
        "positive" -> "#34d399"
        "negative" -> "#fb7185"
        "warning" -> "#fbbf24"
        _ -> "#94a3b8"
  in
    elem Group []
      [ elem Rect [ F.x x, F.y y, F.width w, F.height h, F.rx 10.0, F.fill "#0f172a", staticStr "stroke" stroke, staticStr "strokeWidth" "1.8" ] []
      , elem Text [ F.x (x + 16.0), F.y (y + 28.0), F.fill "#e2e8f0", staticStr "fontSize" "13px", staticStr "fontWeight" "700", staticStr "fontFamily" "Inter, sans-serif" ] [ staticStr "textContent" con.label ]
      , elem Text [ F.x (x + 16.0), F.y (y + 50.0), F.fill "#cbd5e1", staticStr "fontSize" "12px", staticStr "fontFamily" "Inter, sans-serif" ] [ staticStr "textContent" con.detail ]
      ]

flowSankey :: Array StoryLink -> Number -> Tree
flowSankey links top =
  elem Group [] $
    Array.concat
      [ mapWithIndex flowLink links ]
  where
    flowLink idx link =
      let
        y = top + 42.0 + Int.toNumber idx * 34.0
        x1 = 40.0 + Int.toNumber (colFor link.source) * 240.0 + 80.0
        x2 = 40.0 + Int.toNumber (colForTarget link.target) * 240.0 + 20.0
        strokeW = max 2.0 (min 10.0 link.value)
      in
        elem Group []
          [ elem Line [ staticStr "x1" (show x1), staticStr "y1" (show y), staticStr "x2" (show x2), staticStr "y2" (show y), staticStr "stroke" "#60a5fa", staticStr "strokeWidth" (show strokeW), staticStr "opacity" "0.75" ] []
          , elem Text [ F.x (x1 + 8.0), F.y (y - 6.0), F.fill "#cbd5e1", staticStr "fontSize" "10px", staticStr "fontFamily" "Inter, sans-serif" ] [ staticStr "textContent" (link.source <> " -> " <> link.target <> (if link.label == "" then "" else " (" <> link.label <> ")")) ]
          ]

    colFor source =
      if containsAny source [ "Market", "Input", "Price" ] then 0
      else if containsAny source [ "Strategy", "Score" ] then 1
      else if containsAny source [ "Decision", "Signal" ] then 2
      else 3

    colForTarget target =
      if containsAny target [ "Market", "Input", "Price" ] then 0
      else if containsAny target [ "Strategy", "Score" ] then 1
      else if containsAny target [ "Decision", "Signal", "Database", "Telegram", "Output" ] then 2
      else 3

    containsAny s parts = Array.any (\p -> String.contains (Pattern p) s) parts

mapWithIndex :: forall a b. (Int -> a -> b) -> Array a -> Array b
mapWithIndex f xs = zipWith f (range 0 (max 0 (length xs - 1))) xs
