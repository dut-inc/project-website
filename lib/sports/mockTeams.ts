// lib/sports/mockTeams.ts
//
// Realistic mock data for the Seattle Sports Dashboard, shaped exactly like
// the frontend/backend contract in types.ts. No network calls — this module
// is only ever read by the mock TeamService.
//
// Intentionally covers every UI state:
//   - Mariners:  LIVE game (MLB — innings/outs, no clock)
//   - Storm:     LIVE game (WNBA — quarter + game clock)
//   - Seahawks / Sounders / Reign: recently finished a game + upcoming slate
//   - Kraken / Seawolves / Torrent: between seasons, next slate scheduled
//   - SuperSonics: inactive placeholder, no backend data at all
//
// "Snapshot" date for the whole dashboard: 2026-08-04.

import type { Team } from "./types";

export const mockTeams: Team[] = [
  // -------------------------------------------------------------------------
  // Seattle Mariners (MLB) — LIVE right now
  // -------------------------------------------------------------------------
  {
    id: "mariners",
    league: "mlb",
    name: "Seattle Mariners",
    shortName: "Mariners",
    status: "active",
    record: { wins: 62, losses: 48, position: 2, label: "2026" },
    streak: { type: "W", count: 2 },
    championships: 0,
    colors: { primary: "#0C2C56", secondary: "#005C5C" },
    previousGame: {
      date: "2026-08-03",
      opponent: "Houston Astros",
      at: "home",
      outcome: "W",
      teamScore: 5,
      opponentScore: 3,
      note: "F/9",
    },
    currentGame: {
      opponent: "Houston Astros",
      at: "home",
      teamScore: 4,
      opponentScore: 3,
      period: "Top 7th",
      clock: undefined,
      detail: "2 outs · runners on 1st & 2nd",
      channel: "ROOT Sports NW",
      sportSpecific: { Balls: 1, Strikes: 2, "Runners on": "1st & 2nd", "Pitch count": 84 },
    },
    nextGames: [
      { date: "2026-08-05", time: "7:10 PM", opponent: "Los Angeles Angels", at: "home" },
      { date: "2026-08-06", time: "7:10 PM", opponent: "Los Angeles Angels", at: "home" },
      { date: "2026-08-07", time: "7:10 PM", opponent: "Los Angeles Angels", at: "home" },
    ],
    gameStats: {
      teamStats: [
        { label: "Hits", value: "9 – 6" },
        { label: "Home runs", value: "2 – 1" },
        { label: "Errors", value: "0 – 2" },
        { label: "Left on base", value: "6 – 4" },
      ],
      scoring: [
        { period: "T1", side: "seattle", description: "Julio Rodríguez RBI single", score: "SEA 1 – 0 HOU" },
        { period: "T3", side: "seattle", description: "Cal Raleigh 2-run HR (24)", score: "SEA 3 – 0 HOU" },
        { period: "B4", side: "opponent", description: "Jose Altuve solo HR", score: "SEA 3 – 1 HOU" },
        { period: "B6", side: "opponent", description: "Yordan Alvarez 2-run HR", score: "SEA 3 – 3 HOU" },
        { period: "T7", side: "seattle", description: "Randy Arozarena RBI double", score: "SEA 4 – 3 HOU" },
      ],
      leaders: [
        { label: "Batting", player: "Julio Rodríguez", value: "2-3, 1 RBI" },
        { label: "Pitching", player: "Logan Gilbert", value: "6.0 IP, 2 ER, 7 K" },
      ],
    },
    seasonStats: {
      offense: [
        { label: "Batting average", value: ".261", sublabel: "3rd in AL" },
        { label: "Runs", value: "512", sublabel: "5th" },
        { label: "Home runs", value: "148", sublabel: "7th" },
        { label: "OPS", value: ".749", sublabel: "6th" },
      ],
      defense: [
        { label: "Team ERA", value: "3.41", sublabel: "4th" },
        { label: "WHIP", value: "1.18", sublabel: "5th" },
        { label: "Strikeouts", value: "1,102", sublabel: "6th" },
        { label: "Fielding %", value: ".987", sublabel: "2nd" },
      ],
      misc: [
        { label: "Home / Road", value: "34-22 / 28-26" },
        { label: "Last 10", value: "7-3" },
        { label: "Streak", value: "Won 2" },
      ],
      standings: [
        { position: 1, team: "Houston Astros", record: "65-45" },
        { position: 2, team: "Seattle Mariners", record: "62-48", gamesBack: "—" },
        { position: 3, team: "Texas Rangers", record: "58-52", gamesBack: "5.5" },
        { position: 4, team: "Oakland Athletics", record: "50-60", gamesBack: "15" },
        { position: 5, team: "Los Angeles Angels", record: "47-63", gamesBack: "18" },
      ],
      leaders: [
        { label: "Batting avg", player: "Julio Rodríguez", value: ".312" },
        { label: "Home runs", player: "Cal Raleigh", value: "24" },
        { label: "RBI", player: "Julio Rodríguez", value: "78" },
        { label: "ERA", player: "Logan Gilbert", value: "2.98" },
        { label: "Wins", player: "George Kirby", value: "11" },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // Seattle Seahawks (NFL) — recently played, preseason slate ahead
  // -------------------------------------------------------------------------
  {
    id: "seahawks",
    league: "nfl",
    name: "Seattle Seahawks",
    shortName: "Seahawks",
    status: "active",
    record: { wins: 1, losses: 0, label: "Preseason" },
    streak: { type: "W", count: 1 },
    championships: 1,
    colors: { primary: "#002244", secondary: "#69BE28" },
    previousGame: {
      date: "2026-08-02",
      opponent: "Los Angeles Chargers",
      at: "away",
      outcome: "W",
      teamScore: 24,
      opponentScore: 17,
      note: "Preseason",
    },
    nextGames: [
      { date: "2026-08-10", time: "7:00 PM", opponent: "Dallas Cowboys", at: "home", note: "Preseason" },
      { date: "2026-08-17", time: "4:00 PM", opponent: "Tennessee Titans", at: "away", note: "Preseason" },
      { date: "2026-09-13", time: "1:25 PM", opponent: "San Francisco 49ers", at: "home", note: "Season opener" },
    ],
    seasonStats: {
      offense: [
        { label: "Passing yards / gm", value: "235.4", sublabel: "2025" },
        { label: "Rushing yards / gm", value: "128.7" },
        { label: "Points / gm", value: "23.4" },
      ],
      defense: [
        { label: "Yards allowed / gm", value: "312.9" },
        { label: "Points allowed / gm", value: "21.3" },
        { label: "Takeaways", value: "27" },
      ],
      misc: [{ label: "2025 record", value: "10-7" }],
      standings: [
        { position: 1, team: "Los Angeles Rams", record: "10-7" },
        { position: 2, team: "Seattle Seahawks", record: "10-7", gamesBack: "—" },
        { position: 3, team: "Arizona Cardinals", record: "8-9", gamesBack: "2" },
        { position: 4, team: "San Francisco 49ers", record: "6-11", gamesBack: "4" },
      ],
      leaders: [
        { label: "Passing", player: "Geno Smith", value: "4,320 yds · 23 TD" },
        { label: "Rushing", player: "Kenneth Walker III", value: "1,142 yds · 9 TD" },
        { label: "Receiving", player: "Jaxon Smith-Njigba", value: "1,223 yds · 9 TD" },
        { label: "Tackles", player: "Ernest Jones IV", value: "148" },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // Seattle Kraken (NHL) — between seasons
  // -------------------------------------------------------------------------
  {
    id: "kraken",
    league: "nhl",
    name: "Seattle Kraken",
    shortName: "Kraken",
    status: "active",
    record: { wins: 33, losses: 37, otLosses: 12, position: 5, label: "2025-26" },
    streak: { type: "L", count: 1 },
    championships: 0,
    colors: { primary: "#001628", secondary: "#99D9D9" },
    previousGame: {
      date: "2026-04-14",
      opponent: "Anaheim Ducks",
      at: "away",
      outcome: "L",
      teamScore: 2,
      opponentScore: 4,
      note: "F",
    },
    nextGames: [
      { date: "2026-09-27", time: "7:00 PM", opponent: "Vancouver Canucks", at: "home", note: "Preseason" },
      { date: "2026-09-29", time: "6:30 PM", opponent: "Calgary Flames", at: "away", note: "Preseason" },
      { date: "2026-10-10", time: "7:00 PM", opponent: "Edmonton Oilers", at: "home", note: "Season opener" },
    ],
    seasonStats: {
      offense: [
        { label: "Goals / gm", value: "2.89", sublabel: "18th" },
        { label: "Power play", value: "21.4%", sublabel: "14th" },
        { label: "Shots / gm", value: "30.1" },
      ],
      defense: [
        { label: "Goals against / gm", value: "3.21", sublabel: "23rd" },
        { label: "Penalty kill", value: "78.2%", sublabel: "22nd" },
      ],
      misc: [
        { label: "Home", value: "17-19-5" },
        { label: "Road", value: "16-18-7" },
      ],
      standings: [
        { position: 1, team: "Vegas Golden Knights", record: "50-22-10", points: 110 },
        { position: 2, team: "Edmonton Oilers", record: "48-24-10", points: 106 },
        { position: 3, team: "Los Angeles Kings", record: "44-26-12", points: 100 },
        { position: 4, team: "Vancouver Canucks", record: "41-30-11", points: 93 },
        { position: 5, team: "Seattle Kraken", record: "33-37-12", points: 78 },
      ],
      leaders: [
        { label: "Goals", player: "Jared McCann", value: "34" },
        { label: "Assists", player: "Vince Dunn", value: "41" },
        { label: "Points", player: "Matty Beniers", value: "68" },
        { label: "Wins", player: "Joey Daccord", value: "24" },
        { label: "GAA", player: "Joey Daccord", value: "2.78" },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // Seattle Storm (WNBA) — LIVE right now
  // -------------------------------------------------------------------------
  {
    id: "storm",
    league: "wnba",
    name: "Seattle Storm",
    shortName: "Storm",
    status: "active",
    record: { wins: 19, losses: 11, position: 3, label: "2026" },
    streak: { type: "W", count: 3 },
    championships: 4,
    colors: { primary: "#007A33", secondary: "#FFC20E" },
    previousGame: {
      date: "2026-08-02",
      opponent: "Phoenix Mercury",
      at: "home",
      outcome: "W",
      teamScore: 88,
      opponentScore: 79,
      note: "F",
    },
    currentGame: {
      opponent: "Las Vegas Aces",
      at: "away",
      teamScore: 68,
      opponentScore: 71,
      period: "3rd",
      clock: "4:32",
      detail: "Aces on a 12-4 run",
      channel: "ESPN",
      sportSpecific: { "Biggest lead": "SEA +8", Lead: "LVA +3", "Timeouts": "SEA 3 – LVA 2" },
    },
    nextGames: [
      { date: "2026-08-06", time: "6:00 PM", opponent: "Minnesota Lynx", at: "home" },
      { date: "2026-08-08", time: "6:30 PM", opponent: "Phoenix Mercury", at: "away" },
      { date: "2026-08-11", time: "7:00 PM", opponent: "Indiana Fever", at: "home" },
    ],
    gameStats: {
      teamStats: [
        { label: "Field goal %", value: "44.1% – 47.6%" },
        { label: "3-pointers", value: "8 – 11" },
        { label: "Rebounds", value: "32 – 35" },
        { label: "Assists", value: "19 – 17" },
        { label: "Turnovers", value: "9 – 12" },
      ],
      scoring: [
        { period: "Q1", side: "opponent", description: "Aces take the opening frame", score: "SEA 19 – LVA 24" },
        { period: "Q2", side: "seattle", description: "Storm rally behind 9-point Loyd quarter", score: "SEA 41 – LVA 40" },
        { period: "Q3", side: "opponent", description: "Aces answer with a 12-4 run", score: "SEA 68 – LVA 71" },
      ],
      leaders: [
        { label: "Points", player: "Jewell Loyd", value: "21" },
        { label: "Assists", player: "Skylar Diggins-Smith", value: "12 pts · 8 ast" },
        { label: "Rebounds", player: "Nneka Ogwumike", value: "14 pts · 7 reb" },
      ],
    },
    seasonStats: {
      offense: [
        { label: "Points / gm", value: "84.2", sublabel: "4th" },
        { label: "Field goal %", value: "45.9%" },
        { label: "3-point %", value: "36.1%", sublabel: "3rd" },
      ],
      defense: [
        { label: "Points allowed / gm", value: "78.9", sublabel: "3rd" },
        { label: "Rebounds / gm", value: "36.2" },
        { label: "Steals / gm", value: "7.8" },
      ],
      misc: [
        { label: "Home / Road", value: "11-3 / 8-8" },
        { label: "Last 10", value: "8-2" },
      ],
      standings: [
        { position: 1, team: "Las Vegas Aces", record: "23-7" },
        { position: 2, team: "Phoenix Mercury", record: "20-10" },
        { position: 3, team: "Seattle Storm", record: "19-11" },
        { position: 4, team: "Minnesota Lynx", record: "17-13" },
        { position: 5, team: "Dallas Wings", record: "12-18" },
      ],
      leaders: [
        { label: "Points / gm", player: "Jewell Loyd", value: "23.4" },
        { label: "Rebounds / gm", player: "Nneka Ogwumike", value: "9.1" },
        { label: "Assists / gm", player: "Skylar Diggins-Smith", value: "6.8" },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // Seattle Sounders (MLS) — recently played
  // -------------------------------------------------------------------------
  {
    id: "sounders",
    league: "mls",
    name: "Seattle Sounders",
    shortName: "Sounders",
    status: "active",
    record: { wins: 14, losses: 6, draws: 7, position: 2, label: "2026" },
    streak: { type: "W", count: 2 },
    championships: 2,
    colors: { primary: "#005C29", secondary: "#0077C8" },
    previousGame: {
      date: "2026-08-02",
      opponent: "LAFC",
      at: "home",
      outcome: "W",
      teamScore: 3,
      opponentScore: 1,
      note: "F",
    },
    nextGames: [
      { date: "2026-08-08", time: "7:30 PM", opponent: "Portland Timbers", at: "home", note: "Cascadia Derby" },
      { date: "2026-08-15", time: "5:30 PM", opponent: "Minnesota United", at: "away" },
      { date: "2026-08-22", time: "7:30 PM", opponent: "St. Louis City", at: "home" },
    ],
    seasonStats: {
      offense: [
        { label: "Goals", value: "41", sublabel: "3rd in West" },
        { label: "Goals / gm", value: "1.52" },
        { label: "xG", value: "42.1" },
      ],
      defense: [
        { label: "Goals against", value: "24", sublabel: "2nd" },
        { label: "Clean sheets", value: "8" },
      ],
      misc: [
        { label: "Home / Away", value: "9-1-3 / 5-5-4" },
        { label: "Last 5", value: "4-0-1" },
      ],
      standings: [
        { position: 1, team: "LA Galaxy", record: "14-6-8", points: 50 },
        { position: 2, team: "Seattle Sounders", record: "14-6-7", points: 49 },
        { position: 3, team: "Minnesota United", record: "12-8-7", points: 43 },
        { position: 4, team: "Portland Timbers", record: "11-9-8", points: 41 },
        { position: 5, team: "Vancouver Whitecaps", record: "10-9-9", points: 39 },
      ],
      leaders: [
        { label: "Goals", player: "Jordan Morris", value: "14" },
        { label: "Assists", player: "Albert Rusnák", value: "9" },
        { label: "Saves", player: "Stefan Frei", value: "61" },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // Seattle Reign (NWSL) — recently finished a game
  // -------------------------------------------------------------------------
  {
    id: "reign",
    league: "nwsl",
    name: "Seattle Reign",
    shortName: "Reign",
    status: "active",
    record: { wins: 9, losses: 5, draws: 7, position: 4, label: "2026" },
    streak: { type: "L", count: 2 },
    championships: 0,
    colors: { primary: "#1E1E4B", secondary: "#A8D120" },
    previousGame: {
      date: "2026-08-01",
      opponent: "Orlando Pride",
      at: "away",
      outcome: "L",
      teamScore: 0,
      opponentScore: 1,
      note: "F",
    },
    nextGames: [
      { date: "2026-08-08", time: "7:00 PM", opponent: "Angel City FC", at: "home" },
      { date: "2026-08-15", time: "4:30 PM", opponent: "Houston Dash", at: "away" },
      { date: "2026-08-22", time: "7:00 PM", opponent: "Kansas City Current", at: "home" },
    ],
    seasonStats: {
      offense: [
        { label: "Goals", value: "23", sublabel: "6th" },
        { label: "xG", value: "24.8" },
        { label: "Shots on target / gm", value: "4.6" },
      ],
      defense: [
        { label: "Goals against", value: "18", sublabel: "3rd" },
        { label: "Clean sheets", value: "6" },
      ],
      misc: [
        { label: "Home / Away", value: "5-2-3 / 4-3-4" },
        { label: "Championships", value: "0", sublabel: "2× NWSL Shield" },
      ],
      standings: [
        { position: 1, team: "Orlando Pride", record: "12-4-5", points: 41 },
        { position: 2, team: "Kansas City Current", record: "11-5-5", points: 38 },
        { position: 3, team: "NJ/NY Gotham", record: "10-6-6", points: 36 },
        { position: 4, team: "Seattle Reign", record: "9-5-7", points: 34 },
        { position: 5, team: "Washington Spirit", record: "9-6-6", points: 33 },
      ],
      leaders: [
        { label: "Goals", player: "Bethany Balcer", value: "7" },
        { label: "Assists", player: "Ji So-yun", value: "6" },
        { label: "Saves", player: "Laurel Ivory", value: "54" },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // Seattle Seawolves (MLR) — off-season, 2026 champions
  // -------------------------------------------------------------------------
  {
    id: "seawolves",
    league: "mlr",
    name: "Seattle Seawolves",
    shortName: "Seawolves",
    status: "active",
    record: { wins: 12, losses: 6, position: 2, label: "2026" },
    streak: { type: "W", count: 1 },
    championships: 3,
    colors: { primary: "#123B8A", secondary: "#D7263D" },
    previousGame: {
      date: "2026-07-11",
      opponent: "San Diego Legion",
      at: "away",
      outcome: "W",
      teamScore: 28,
      opponentScore: 24,
      note: "MLR Championship",
    },
    nextGames: [
      { date: "2027-02-06", time: "4:00 PM", opponent: "Old Glory DC", at: "home", note: "Season opener" },
      { date: "2027-02-13", time: "4:00 PM", opponent: "Chicago Hounds", at: "away" },
      { date: "2027-02-20", time: "4:00 PM", opponent: "New England Free Jacks", at: "home" },
    ],
    seasonStats: {
      offense: [
        { label: "Tries", value: "68", sublabel: "1st in MLR" },
        { label: "Points scored", value: "512" },
      ],
      defense: [
        { label: "Tries conceded", value: "41", sublabel: "3rd" },
        { label: "Tackle success", value: "86%" },
      ],
      misc: [
        { label: "Home / Away", value: "7-1 / 5-5" },
        { label: "2026 finish", value: "Champions" },
      ],
      standings: [
        { position: 1, team: "San Diego Legion", record: "13-5" },
        { position: 2, team: "Seattle Seawolves", record: "12-6" },
        { position: 3, team: "Houston SaberCats", record: "11-7" },
        { position: 4, team: "Chicago Hounds", record: "9-9" },
      ],
      leaders: [
        { label: "Tries", player: "Taniela Tupou", value: "11" },
        { label: "Points", player: "AJ Alatimu", value: "148" },
        { label: "Tackles", player: "Riekert Hattingh", value: "214" },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // Seattle Torrent (PWHL) — between seasons
  // -------------------------------------------------------------------------
  {
    id: "torrent",
    league: "pwhl",
    name: "Seattle Torrent",
    shortName: "Torrent",
    status: "active",
    record: { wins: 21, losses: 9, otLosses: 4, position: 2, label: "2025-26" },
    streak: { type: "L", count: 1 },
    championships: 0,
    colors: { primary: "#2F4F4F", secondary: "#8FD0D8" },
    previousGame: {
      date: "2026-05-03",
      opponent: "Toronto Sceptres",
      at: "away",
      outcome: "L",
      teamScore: 1,
      opponentScore: 2,
      note: "OT · Rd 1 G3",
    },
    nextGames: [
      { date: "2026-11-20", time: "7:00 PM", opponent: "Minnesota Frost", at: "home", note: "Season opener" },
      { date: "2026-11-22", time: "6:00 PM", opponent: "Ottawa Charge", at: "home" },
      { date: "2026-11-27", time: "4:00 PM", opponent: "Boston Fleet", at: "away" },
    ],
    seasonStats: {
      offense: [
        { label: "Goals / gm", value: "3.1", sublabel: "2nd" },
        { label: "Power play", value: "22.5%" },
      ],
      defense: [
        { label: "Goals against / gm", value: "2.6", sublabel: "3rd" },
        { label: "Penalty kill", value: "84.1%" },
      ],
      misc: [
        { label: "Home / Road", value: "12-3-2 / 9-6-2" },
        { label: "2025-26 finish", value: "Playoff Rd 1" },
      ],
      standings: [
        { position: 1, team: "Montreal Victoire", record: "24-7-3", points: 51 },
        { position: 2, team: "Seattle Torrent", record: "21-9-4", points: 46 },
        { position: 3, team: "Toronto Sceptres", record: "20-11-3", points: 43 },
        { position: 4, team: "Boston Fleet", record: "19-12-3", points: 41 },
        { position: 5, team: "Minnesota Frost", record: "17-14-3", points: 37 },
      ],
      leaders: [
        { label: "Goals", player: "Ella Shelton", value: "18" },
        { label: "Points", player: "Hayley Scamurra", value: "44" },
        { label: "Wins", player: "Nicole Hensley", value: "17" },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // Seattle SuperSonics (NBA) — placeholder only, no backend data
  // -------------------------------------------------------------------------
  {
    id: "supersonics",
    league: "nba",
    name: "Seattle SuperSonics",
    shortName: "SuperSonics",
    status: "inactive",
    note: "Not currently an NBA franchise. Placeholder card — waiting on NBA expansion before any roster, schedule, or stats exist.",
    record: { wins: 0, losses: 0, label: "Awaiting expansion" },
    streak: { type: "W", count: 0 },
    championships: 1,
    colors: { primary: "#007A33", secondary: "#FFC200" },
    nextGames: [],
  },
];

export default mockTeams;
