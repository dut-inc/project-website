# Seattle Sports Dashboard — Backend Implementation

Implement the backend/data layer for the Seattle Sports Dashboard.

The frontend for this project has already been built using mock data and a frontend `TeamService` abstraction. **Do not redesign the frontend.** The goal of this task is to replace the mock data source with real backend data while preserving the existing frontend data contract.

My partner has been working on the project's backend using **Supabase**, so first inspect the existing project structure, Supabase configuration, database schema, and backend conventions.

**Do not replace, reset, or interfere with existing backend work.** Integrate with what already exists.

---

# Primary Goal

Provide real sports data to the existing frontend through a single backend-facing interface.

The frontend should eventually be able to do something conceptually equivalent to:

```text
TeamService
    ↓
Backend / Supabase
    ↓
Sports data providers
```

The React components should not need to know which sports API provided the data.

The existing frontend should continue consuming a common `Team` model.

---

# Supported Teams

- Seattle Mariners — MLB
- Seattle Seahawks — NFL
- Seattle Kraken — NHL
- Seattle Storm — WNBA
- Seattle Sounders — MLS
- Seattle Reign — NWSL
- Seattle Seawolves — MLR
- Seattle Torrent — NWHL
- Seattle SuperSonics — placeholder only; do not implement an external data integration

If the NWHL/Torrent data source requires special handling, investigate the available options and use the most reliable reasonable source.

---

# Important Architecture Requirement

Do **not** attempt to make the external sports APIs look identical.

Different sports naturally have different data:

- Baseball has innings, outs, pitchers, etc.
- Football has quarters, downs, passing statistics, etc.
- Hockey has periods, shots, power plays, etc.
- Soccer has halves, possession, shots, cards, etc.

Instead, normalize only the information that the dashboard actually has in common.

The backend should use a shared model similar to:

```text
Team
    id
    league
    name
    status
    record
    streak
    championships
    colors

    previousGame
    currentGame
    nextGames

    seasonStats
    gameStats
```

Sport-specific data should live inside appropriate nested structures rather than being forced into universal fields.

---

# Backend API

Expose a single frontend-friendly endpoint, or an equivalent Supabase-backed interface, for the dashboard.

Preferred conceptual endpoint:

```text
GET /api/teams
```

It should return all supported teams in the common frontend format.

Example:

```json
{
  "teams": [
    {
      "id": "mariners",
      "league": "MLB",
      "name": "Seattle Mariners",
      "status": "LIVE",
      "record": "63-45",
      "streak": "W4",
      "championships": 0,
      "colors": {
        "primary": "#005C5C",
        "secondary": "#C4CED4"
      },
      "previousGame": {},
      "currentGame": {},
      "nextGames": [],
      "seasonStats": {},
      "gameStats": {}
    }
  ]
}
```

The exact schema may be adjusted to match the existing frontend types, but **do not unnecessarily change the frontend contract**.

---

# External Sports API Architecture

Create a modular adapter/provider architecture.

Conceptually:

```text
                     ┌── MLB Provider
                     ├── NFL Provider
                     ├── NHL Provider
                     ├── WNBA Provider
                     ├── MLS Provider
                     ├── NWSL Provider
                     ├── MLR Provider
                     └── NWHL / Seattle Torrent Provider
                              │
                              ▼
                       Normalization Layer
                              │
                              ▼
                         Team Model
                              │
                              ▼
                     Supabase / Backend
                              │
                              ▼
                       GET /api/teams
                              │
                              ▼
                          Frontend
```

Do not put league-specific API calls directly inside the route handler.

Each provider/adapter should be responsible for:

- Fetching data from its source
- Parsing the provider's response
- Converting it into our internal model
- Handling provider-specific errors
- Handling missing data
- Handling differences in game states

This should make adding another league later straightforward.

---

# API Provider Selection

Before implementing integrations, inspect the available data sources for each league.

Prioritize:

1. Official league/team APIs
2. Stable, documented sports-data APIs
3. Reliable third-party providers
4. Other reasonable sources only when necessary

Do not scrape websites unless there is no reasonable alternative and the approach is appropriate.

Do not assume that an API exists simply because another sport has one.

Document which provider is being used for each league.

If a provider requires credentials, add the required environment variables to `.env.example`, but **never commit actual API keys or secrets**.

---

# Caching and Efficiency

Efficiency is important.

The frontend should not cause nine sports APIs to be hit every time a user loads the page.

Use Supabase/database storage and/or an appropriate server-side caching mechanism so that external providers are queried intelligently.

Recommended behavior:

### No live games

Refresh relatively infrequently, approximately every 30–60 minutes.

### Live game

Refresh live data approximately every 15–30 seconds.

The exact interval should be determined by the provider's rate limits and capabilities.

### Multiple users

If multiple users request `/api/teams`, they should share cached backend data rather than causing duplicate external API requests.

The backend should be responsible for deciding when cached data is stale.

The frontend should simply request the latest available dashboard data.

---

# Database / Supabase

Use the existing Supabase setup if one already exists.

Do not create redundant tables if the existing schema can support this feature.

If database tables are required, design them around the normalized dashboard data and/or cached provider responses.

Potential concepts include:

```text
teams
games
team_stats
standings
provider_cache
```

However, **do not blindly create all of these tables**. Inspect the existing schema first and only introduce structures that are actually necessary.

The database should not become a dumping ground for raw API responses unless there is a clear reason to store them.

---

# Game State

The backend must determine whether each team is:

```text
UPCOMING
LIVE
FINAL
POSTPONED
DELAYED
OFF
```

or an equivalent normalized state.

The frontend needs enough information to determine which card state to render.

For a live game, provide sport-appropriate information such as:

### MLB

- Score
- Inning
- Top/bottom
- Outs
- Base runners if available

### NFL

- Score
- Quarter
- Game clock
- Relevant game status

### NHL

- Score
- Period
- Game clock

### MLS / NWSL

- Score
- Half
- Game clock

### WNBA

- Score
- Quarter
- Game clock

### MLR

- Score
- Half
- Game clock

### NWHL / Seattle Torrent

- Score
- Period
- Game clock
- Other relevant hockey information when available

Do not force unavailable information into fake values.

---

# Schedule

For each team provide:

### Previous game

The most recently completed game:

- Date
- Opponent
- Home/away
- Result
- Score

### Upcoming games

Return at least the next three scheduled games.

Each game should contain whatever information is available:

- Date
- Time
- Opponent
- Home/away
- Venue
- Game status
- Broadcast information if available

When the team is live, the frontend only needs the next game displayed, but it is fine for the backend to continue returning the next three games.

---

# Season Statistics

Provide normalized season information where possible.

Examples:

```text
record
wins
losses
ties
streak
standing
```

Then provide sport-specific statistics inside `seasonStats`.

For example:

```json
{
  "seasonStats": {
    "record": "12-4",
    "standing": 2,
    "sportSpecific": {
      "pointsPerGame": 112.4
    }
  }
}
```

Do not force baseball statistics such as ERA into the same fields as NFL statistics such as passing yards.

The frontend already has a sport-aware statistics presentation layer.

---

# Live Game Statistics

When a game is live, provide the information available from the provider.

Examples include:

- Team statistics
- Player leaders
- Scoring summary
- Shots
- Possession
- Passing/rushing
- Runs/hits/errors
- Power plays
- etc.

Only provide statistics that are actually available.

Missing statistics should be represented cleanly rather than fabricated.

---

# Win/Loss Streak

Calculate or obtain the team's current streak.

Examples:

```text
W4
L2
W1
```

If the provider exposes streak information directly, use it where reliable.

Otherwise calculate it from recent completed games.

Handle ties appropriately for leagues where ties are possible.

---

# Championships

The frontend has a championship counter.

This does not need to be dynamically calculated from game APIs.

Use a stable team metadata field or configuration value.

The SuperSonics should remain a placeholder and should not require live data.

---

# Team Metadata

Maintain stable metadata separately from live sports data where appropriate.

For example:

```text
team ID
team name
league
team colors
championship count
provider/team ID
```

This makes it easier to add or modify teams without changing the API integration logic.

---

# Error Handling

One league's API failure should **not prevent the rest of the dashboard from loading**.

For example, if the MLR provider is unavailable:

```text
Mariners    ✓
Seahawks    ✓
Kraken      ✓
Storm       ✓
Sounders    ✓
Reign       ✓
Seawolves   ERROR
Torrent     ✓
```

The `/api/teams` response should still return the other teams.

A failed provider should produce a graceful status/error state that the frontend can display.

Do not crash the entire endpoint because one provider fails.

---

# API Rate Limits

Respect the rate limits of every external provider.

Do not poll aggressively just because the frontend is open.

Use:

- Server-side caching
- Appropriate refresh intervals
- Conditional requests where supported
- Shared cached responses
- Provider-specific refresh behavior when necessary

Document any important rate-limit considerations.

---

# Environment Variables

Never hardcode:

- API keys
- API secrets
- Supabase service keys
- Access tokens

Add placeholders to `.env.example`.

Keep secrets server-side.

Anything using a privileged Supabase/service-role credential must never be exposed to the browser.

---

# Development Strategy

Implement this incrementally.

Do not attempt to build every sports integration simultaneously.

Recommended order:

1. Inspect existing backend/Supabase architecture.
2. Inspect the frontend `Team` model and `TeamService`.
3. Establish the backend/frontend data contract.
4. Implement the backend route/service.
5. Implement one reliable provider first, preferably MLB.
6. Verify the normalized response against the frontend.
7. Add the remaining providers one at a time.
8. Add caching.
9. Add live-game refresh behavior.
10. Handle provider failures and missing data.
11. Test all team states using fixtures/mock provider responses.

Do not wait until every league is implemented before testing the frontend integration.

---

# Testing

Create fixtures or mock provider responses for:

- Upcoming game
- Live game
- Completed game
- Postponed game
- Delayed game
- No upcoming game
- Provider failure
- Missing statistics
- Sport-specific live information

The backend should be testable without repeatedly calling real sports APIs.

---

# SuperSonics

Keep the Seattle SuperSonics in the team list as an inactive/placeholder team.

Example:

```json
{
  "id": "supersonics",
  "name": "Seattle SuperSonics",
  "status": "INACTIVE"
}
```

No external API integration is necessary.

---

# Scope Restrictions

Do not:

- Redesign the frontend
- Replace the existing frontend architecture
- Make direct sports API calls from React
- Put API credentials in the frontend
- Replace existing Supabase work
- Reset or recreate the existing database
- Introduce an unrelated backend framework without first inspecting the project
- Hardcode live sports information
- Assume all sports expose the same statistics
- Make one provider failure break the entire dashboard

---

# Definition of Done

The backend implementation is complete when:

1. The existing frontend can request real team data through the agreed interface.
2. `/api/teams` or the equivalent Supabase-backed interface returns all supported teams.
3. Each supported league has a modular provider/adapter.
4. The data is normalized into the existing frontend `Team` model.
5. Previous and upcoming games are available.
6. Live games expose appropriate sport-specific information.
7. Season statistics are available where supported.
8. Win/loss streaks are available.
9. Championship counts are available.
10. External API calls are cached and rate-limit conscious.
11. One failed provider does not break the entire dashboard.
12. Secrets remain server-side.
13. The SuperSonics placeholder works without an API.
14. The existing frontend requires minimal changes to switch from mock data to real backend data.
15. The implementation integrates cleanly with the existing Supabase/backend work.

**Prioritize reliability and clean architecture over trying to support every possible statistic. If a sports provider does not expose a particular piece of information, gracefully omit it rather than creating a brittle workaround.**
