I’m currently extending an existing NBA standings prediction page on my website.

I want you to implement the following features while preserving the existing functionality and the established **punk-rock / DIY flyer / photocopied zine** visual design.

This should be a real implementation, not a visual mockup.

Before changing anything, inspect the existing codebase, components, data structures, API calls, database models, and prediction logic so you understand how the current system works.

Do not unnecessarily rewrite working code.

---

# OVERALL CONCEPT

This page is an NBA prediction competition for me and my friends.

Users make predictions about:

* NBA standings
* NBA awards
* NBA champion

The site calculates points based on how those predictions perform.

The current page already has a leaderboard/standings UI with the DIY punk-flyer aesthetic.

I want to expand it with:

1. Historical/past-season standings
2. Awards predictions
3. NBA Champion predictions
4. A season-long weekly prediction progression graph
5. Historical progression graphs
6. Reusable data structures/components so future seasons are easy to add

Everything should feel like one cohesive **NBA prediction scrapbook / punk flyer**.

---

# IMPORTANT: PRESERVE EXISTING FUNCTIONALITY

Before implementing anything:

1. Inspect the current page.
2. Understand the current leaderboard.
3. Understand how standings predictions are stored.
4. Understand how users are represented.
5. Understand how scoring currently works.
6. Understand where NBA team/player data comes from.
7. Understand the current frontend architecture.
8. Understand the current backend/API architecture.
9. Reuse existing components/data sources wherever possible.

Do NOT:

* break existing prediction functionality
* remove existing features
* change existing API behavior unnecessarily
* replace working data sources with hardcoded data
* create duplicate implementations when a reusable component can be extracted
* redesign unrelated pages

The goal is to extend the existing system.

---

# 1. PAST YEARS / HISTORICAL STANDINGS

I have historical NBA standings in:

`past-standings.md`

The file is messy and may not have a perfectly consistent format.

Parse and normalize it as necessary.

Do not require me to manually clean it before implementation.

## UI

Add a prominent button near the current leaderboard:

**VIEW PAST YEARS**

Clicking it should open a historical standings view.

I prefer this to be **one scrollable page containing every historical season**, rather than a separate page for each year.

Conceptually:

```text
PAST YEARS

2025–26
[standings]

2024–25
[standings]

2023–24
[standings]

2022–23
[standings]

...
```

If there are many seasons, add a small year navigation element so users can quickly jump to a season.

---

# 2. REUSE THE EXACT SAME LEADERBOARD COMPONENT

This is very important.

The historical standings should use the **exact same leaderboard component** as the current standings.

Do not create a second implementation that merely looks similar.

If necessary, refactor the current leaderboard into a reusable component.

Both current and historical standings should use the same component/data interface.

The historical version must preserve the exact same:

* Team name cutouts
* Font
* Font size
* Font weight
* Text color
* Paper/cutout appearance
* Team logos
* Spacing
* Borders
* Rotations
* Imperfections
* Hover states
* Team-row layout
* Conference layout

In particular:

**The name cutouts must be visually identical between the current leaderboard and historical leaderboard.**

If the current leaderboard uses a particular paper texture, font, color, rotation system, or CSS effect, reuse that exact implementation.

Do not create a separate "historical team name" style.

---

# 3. AWARDS PREDICTIONS

Add an awards prediction section.

Awards:

* MVP
* ROY
* MIP
* DPOY
* 6MOY
* CPOY
* COY
* FMVP

Each user should be able to select a prediction.

## UI

Use dropdown/select controls or another clean selection UI.

Conceptually:

```text
AWARDS PREDICTIONS

MVP      [ Player ▼ ]
ROY      [ Player ▼ ]
MIP      [ Player ▼ ]
DPOY     [ Player ▼ ]
6MOY     [ Player ▼ ]
CPOY     [ Player ▼ ]
COY      [ Coach ▼ ]
FMVP     [ Player ▼ ]
```

The exact visual implementation can be improved to fit the existing design.

The controls should feel like part of the DIY flyer aesthetic rather than generic HTML forms.

---

# 4. PLAYER / COACH DATA

The player dropdowns should contain the appropriate active NBA players going into the season.

Do not hardcode only a handful of candidates.

Use an existing NBA player/team data source if the project already has one.

If a clean data source already exists in the application, reuse it.

COY should contain NBA head coaches rather than players.

The system should be structured so the player/coach lists can be updated for future seasons.

---

# 5. AWARD SCORING

Each correct award prediction is worth:

**+1 point**

Example:

```text
MVP
Nikola Jokić
✓ +1
```

If incorrect:

```text
ROY
Player X
✗ 0
```

Once the actual award result is known:

### Correct prediction

Highlight the prediction **green**.

### Incorrect prediction

Show the appropriate incorrect/neutral state using the existing design language.

The important requirement is that correct predictions are immediately recognizable.

Do not award partial points for awards.

---

# 6. NBA CHAMPION PREDICTION

Add a separate prediction for:

**NBA CHAMPION**

The user selects one NBA team.

Scoring:

### Correct champion

**+3 points**

### Predicted team reaches the NBA Finals but loses

**+1 point**

### Team fails to reach the Finals

**0 points**

Visual states:

### Champion

Green:

```text
NBA CHAMPION

[ Team ]

✓ CHAMPION
+3
```

### Finalist

Yellow:

```text
NBA CHAMPION

[ Team ]

~ FINALIST
+1
```

### Incorrect

Neutral/incorrect styling:

```text
NBA CHAMPION

[ Team ]

✗ ELIMINATED
0
```

The finalist state **must be yellow**, while the fully correct state is **green**.

---

# 7. TOTAL PREDICTION SCORE

Create a reusable scoring system so each user's total prediction points can be calculated from their individual predictions.

The current scoring rules are:

### Awards

8 awards × 1 point each

### NBA Champion

* Champion = +3
* Finalist = +1
* Otherwise = 0

Do not scatter these numbers throughout the UI as hardcoded values.

Put the scoring rules somewhere centralized/reusable so they can be changed later.

---

# 8. SEASON PROGRESSION GRAPH — WEEKLY

Add a graph below the main leaderboard showing how the prediction competition changes throughout the season.

IMPORTANT:

**Do NOT use the old idea of checking every 10 games.**

The graph should use **weekly calendar checkpoints**.

The 2025–26 NBA regular season ends on:

**April 11, 2026**

Treat the season as approximately **25 weeks** for this feature.

---

# 9. WHAT THE WEEKLY GRAPH ACTUALLY MEANS

This is the most important part of the graph implementation.

At every weekly checkpoint, temporarily pretend:

> **"The NBA season ended today."**

Then calculate what every user's prediction score would have been **if that date were the actual end of the season**.

That calculated score becomes that user's data point for that week.

For example:

```text
Week 1
"What would everyone's prediction score be if the season ended today?"

Week 2
"What would everyone's prediction score be if the season ended today?"

Week 3
"What would everyone's prediction score be if the season ended today?"

...

Week 25
"What would everyone's prediction score be if the season ended today?"
```

This is NOT:

* a percentage of their final score
* a prediction of what their final score will be
* a running tally of awards points
* a simple cumulative counter
* an arbitrary interpolation

It is a **full recalculation of the existing prediction scoring system using the standings/results available as of that date**.

---

# 10. WEEKLY STANDINGS SNAPSHOTS

For each weekly checkpoint:

1. Get all NBA games/results that occurred on or before that date.
2. Reconstruct the NBA standings as they existed on that date.
3. Treat those standings as the "final standings" for the hypothetical season.
4. Run the existing standings-prediction scoring logic against those standings.
5. Calculate each user's hypothetical prediction score.
6. Store that score for that checkpoint.
7. Plot it on the graph.

Conceptually:

```text
Games through Week 7
        ↓
Standings as of Week 7
        ↓
Pretend season ended
        ↓
Run prediction scoring
        ↓
User A = 7 points
User B = 5 points
User C = 8 points
        ↓
Plot Week 7
```

Then repeat for Week 8.

---

# 11. WEEKLY DATES

Do not manually invent 25 dates.

The system should derive the checkpoints from the actual season dates.

The season should have:

```text
seasonStart
seasonEnd
numberOfWeeks = 25
```

The final checkpoint must correspond to:

**April 11, 2026**

Generate the weekly checkpoints programmatically.

Each checkpoint should contain both:

* week number
* actual calendar date

Conceptually:

```text
Week 1 → [date]
Week 2 → [date]
Week 3 → [date]
...
Week 25 → April 11, 2026
```

The exact checkpoint dates should be deterministically calculated from the season range rather than manually typed throughout the application.

For future seasons, the same system should work by providing that season's start/end dates.

---

# 12. GRAPH DATA

Create a reusable structure for season progression.

Conceptually:

```js
{
  season: "2025-26",

  checkpoints: [
    {
      week: 1,
      date: "...",
      scores: {
        userA: 2,
        userB: 1,
        userC: 3
      }
    },

    {
      week: 2,
      date: "...",
      scores: {
        userA: 3,
        userB: 4,
        userC: 3
      }
    },

    ...

    {
      week: 25,
      date: "2026-04-11",
      scores: {
        userA: ...,
        userB: ...,
        userC: ...
      }
    }
  ]
}
```

Adapt this to the project's actual architecture.

The key is:

**Every score must be tied to an actual date.**

---

# 13. CURRENT-SEASON GRAPH

The current season graph should only display data that actually exists.

For example, if we're currently in Week 7:

```text
Week 1 ─ Week 2 ─ Week 3 ─ Week 4 ─ Week 5 ─ Week 6 ─ Week 7
                                                     ↑
                                               Current week
```

Do not fabricate future values.

Future weeks can either:

* not appear yet, or
* appear as empty/faded timeline space.

But no fake scores.

---

# 14. GRAPH AXES

### X-axis

Weekly dates.

Use concise labels such as:

```text
Oct 24
Oct 31
Nov 7
Nov 14
...
Apr 11
```

Don't cram 25 labels onto the screen if that makes the graph unreadable.

The graph can still contain all 25 data points while only displaying selected axis labels.

Hovering a point should reveal the exact information:

```text
Week 7
Date: Nov 28
Ben: 6 points
```

### Y-axis

Prediction points.

### Lines

One line per participant.

The legend should clearly identify each participant.

---

# 15. HISTORICAL PROGRESSION GRAPHS

The exact same graph component should work for historical seasons.

For example:

```text
PAST YEARS

2025–26

[Historical Standings]

[Weekly Prediction Progression]


2024–25

[Historical Standings]

[Weekly Prediction Progression]


2023–24

[Historical Standings]

[Weekly Prediction Progression]
```

The historical graph must use the same weekly methodology:

> "If this season had ended on this date, what would everyone's prediction score have been?"

Do not use a different calculation for historical seasons.

---

# 16. HISTORICAL DATA

If historical game/result data is available, reconstruct the weekly snapshots programmatically.

For every historical season:

```text
Historical games
       ↓
Weekly date
       ↓
Standings as of that date
       ↓
Pretend season ended
       ↓
Run prediction scoring
       ↓
Weekly user scores
```

If the project does not have enough historical information to reconstruct a season's weekly progression:

**Do not fabricate data.**

Instead, gracefully display something like:

> Weekly progression data unavailable for this season.

The historical standings themselves should still work.

---

# 17. REUSABLE COMPONENT ARCHITECTURE

Prioritize reusable components.

Potential components:

* `Standings`
* `TeamRow`
* `SeasonStandings`
* `PastYears`
* `AwardPrediction`
* `AwardsPredictions`
* `ChampionPrediction`
* `PredictionScore`
* `SeasonProgressionChart`

These are suggestions, not requirements.

Follow the existing architecture if equivalent components already exist.

The critical requirements are:

### Leaderboards

Current and historical standings use the same leaderboard component.

### Awards

Award selectors use reusable components.

### Graphs

Current and historical progression graphs use the same chart component.

### Scoring

Current and historical scoring use the same prediction-scoring logic.

---

# 18. SEASON DATA ARCHITECTURE

Structure the system so seasons are data rather than hardcoded UI.

Conceptually:

```text
Season
 ├── season metadata
 ├── standings
 ├── predictions
 ├── awards
 ├── champion
 └── progression checkpoints
```

For example:

```text
2025-26
    standings
    predictions
    awards
    champion
    progression

2024-25
    standings
    predictions
    awards
    champion
    progression
```

Adding another season later should not require duplicating an entire page.

---

# 19. PUNK / DIY VISUAL DESIGN

Keep the established visual language throughout these new features.

The page should feel like:

**NBA statistics × punk show flyer × photocopied zine × messy collage × physical paper**

Not:

**NBA statistics × generic SaaS dashboard**

---

## Awards

Make the section header feel like cut-out letters.

Dropdowns can appear as:

* paper strips
* pasted labels
* little scraps of cardstock
* taped-on prediction slips

---

## Champion

Make the champion selection feel like a larger prediction poster.

Potential header:

**WHO TAKES THE TITLE?**

Then the selected team underneath.

---

## Graph

The graph should feel like someone drew a season-long prediction race onto graph paper and taped the sheet to a wall.

Possible visual elements:

* graph paper
* hand-drawn axis lines
* paper background
* marker-like annotations
* tape
* rough labels
* slightly imperfect line treatment
* cutout legend

However:

**Do not sacrifice readability for the aesthetic.**

The graph needs to remain immediately understandable.

---

## Past Years

The `VIEW PAST YEARS` button should also fit the paper/cutout aesthetic.

The historical page should feel like flipping through older pages of the same physical prediction scrapbook.

---

# 20. RESPONSIVE DESIGN

Everything needs to work on:

* Desktop
* Tablet
* Mobile

On smaller screens:

* reduce decorative rotations
* simplify the collage
* allow standings to remain readable
* make dropdowns touch-friendly
* make the graph horizontally scrollable if necessary
* don't allow decorative elements to overlap important information

The actual functionality must remain usable on touch devices.

---

# 21. ANIMATION

Use subtle physical/paper-like interactions.

Good examples:

* Paper lifts slightly on hover
* Prediction card shifts 1–3px
* Tiny rotation changes
* Dragged elements feel like paper being picked up
* Dropdowns have tactile transitions

Avoid excessive animation.

The goal is:

**physical and tactile**

rather than:

**modern app with lots of animation.**

---

# 22. DATA VALIDATION / EDGE CASES

Handle:

* Current season still in progress
* Awards not yet decided
* Champion not yet decided
* Historical seasons
* Missing historical progression data
* Players changing teams
* Players becoming inactive
* Players appearing in multiple seasons
* Teams not playing exactly the same number of games on a given weekly date
* Schedule irregularities
* A season ending before a team reaches exactly 82 games

For weekly snapshots, use the actual games/results available by the checkpoint date.

Do not assume every team has played the same number of games.

---

# 23. MOST IMPORTANT SCORING RULE FOR THE GRAPH

To make this completely explicit:

Suppose it is November 30.

The graph's November 30 point should answer:

> **"If the NBA regular season had ended on November 30, how many prediction points would each user have earned?"**

Take the actual standings/results as of November 30 and run the same scoring system against them.

Then suppose it is December 7.

Recalculate from scratch:

> **"If the NBA regular season had ended on December 7, how many prediction points would each user have earned?"**

That becomes the December 7 point.

Continue this for every weekly checkpoint.

Therefore the graph is effectively a series of **25 hypothetical season endings**.

It is NOT a cumulative progress meter.

It is NOT "points earned so far."

It is NOT a prediction of future points.

It is:

**"What would the final score have been if the season had ended on this date?"**

That distinction is critical.

---

# 24. FINAL PAGE STRUCTURE

The finished page should conceptually look like:

```text
                    NBA
              STANDINGS PREDICTIONS

              [ existing controls ]


             CURRENT LEADERBOARD

             Eastern Conference
             [team]
             [team]
             [team]
             ...

             Western Conference
             [team]
             [team]
             [team]
             ...


              AWARDS PREDICTIONS

             MVP       [player]
             ROY       [player]
             MIP       [player]
             DPOY      [player]
             6MOY      [player]
             CPOY      [player]
             COY       [coach]
             FMVP      [player]


              NBA CHAMPION

             [team]

             +3 / +1 / 0


          SEASON PREDICTION RACE

             [weekly graph]

       Week 1 → Week 25 / April 11


              [VIEW PAST YEARS]


                 PAST YEARS

               2025–26
             [standings]
             [weekly graph]

               2024–25
             [standings]
             [weekly graph]

                  ...

```

The exact layout can differ if the existing page has a better structure.

---

# 25. FINAL GOAL

When finished, this should feel like a complete **NBA prediction scrapbook** rather than simply a standings table.

Users should be able to:

1. View the current NBA standings.
2. Make/view their standings predictions.
3. Make/view award predictions.
4. Make/view an NBA Champion prediction.
5. See their current prediction score.
6. See how the prediction competition would have looked if the season had ended on each weekly checkpoint.
7. Open historical seasons.
8. View historical standings.
9. View historical weekly prediction progression when data exists.

Everything should share the same:

**punk rock × DIY flyer × photocopied sports scrapbook**

visual identity.

Most importantly, build the underlying system so that future seasons can be added without rebuilding the UI or scoring logic.

Start by inspecting the existing implementation and data architecture, then implement these features cleanly and incrementally.
