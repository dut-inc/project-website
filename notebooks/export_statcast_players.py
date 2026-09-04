"""
Export real MLB player data for the Behind the Plate pitch predictor.

Sources:
  - Statcast pitch-arsenal leaderboard (baseballsavant.mlb.com) -> per-pitcher
    pitch usage (percent) for the current season.
  - MLB Stats API (statsapi.mlb.com) -> player ids, handedness, teams, and
    qualified-batter strikeout rates (K% = SO / PA).

Run from the repo root:
    .venv/Scripts/python.exe notebooks/export_statcast_players.py
"""
import io
import json
from pathlib import Path

import pandas as pd
import requests

SEASON = 2026
MIN_PITCHES = 100  # arsenal leaderboard threshold (pitches thrown)

# The model's 12 pitch classes (must match lib/sports/pitchTypes.ts).
MODEL_PITCH_TYPES = ["CH", "CU", "EP", "FC", "FF", "FO", "FS", "KC", "KN", "SI", "SL", "ST"]

# baseballsavant arsenal leaderboard columns -> model pitch types.
# The leaderboard folds knuckle-curves into CU and omits the rare EP/FO, and
# still reports some sweepers under the legacy SV code (== ST).
ARSENAL_COLS = {
    "n_ff": "FF",
    "n_si": "SI",
    "n_fc": "FC",
    "n_sl": "SL",
    "n_ch": "CH",
    "n_cu": "CU",
    "n_fs": "FS",
    "n_kn": "KN",
    "n_st": "ST",
    "n_sv": "ST",
}

STATSAPI = "https://statsapi.mlb.com/api/v1"


def get_json(url, params):
    res = requests.get(url, params=params, timeout=90)
    res.raise_for_status()
    return res.json()


def fetch_arsenal():
    """Per-pitcher pitch usage (percent) from the Statcast arsenal leaderboard."""
    url = "https://baseballsavant.mlb.com/leaderboard/pitch-arsenals"
    params = {"year": SEASON, "min": MIN_PITCHES, "type": "n_", "hand": "", "csv": "true"}
    raw = requests.get(url, params=params, timeout=120).content
    text = None
    for enc in ("utf-8", "cp1252"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    if text is None:
        raise RuntimeError("could not decode arsenal CSV")
    df = pd.read_csv(io.StringIO(text)).fillna(0.0)
    out = {}
    for _, row in df.iterrows():
        pid = int(row["pitcher"])
        usage = {}
        for col, ptype in ARSENAL_COLS.items():
            pct = float(row.get(col, 0.0))
            if pct > 0:
                usage[ptype] = round(pct, 1)
        out[pid] = usage
    return out


def fetch_players():
    """id -> {name, team, hand} for every player on a 2026 roster."""
    teams = {
        t["id"]: t["abbreviation"]
        for t in get_json(f"{STATSAPI}/teams", {"season": SEASON, "sportIds": 1})["teams"]
        if t.get("abbreviation")
    }
    data = get_json(f"{STATSAPI}/sports/1/players", {"season": SEASON})["people"]
    players = {}
    for p in data:
        team = teams.get((p.get("currentTeam") or {}).get("id"))
        if not team:
            continue
        players[p["id"]] = {
            "name": p["fullName"],
            "team": team,
            "pitch_hand": (p.get("pitchHand") or {}).get("code"),
            "bat_hand": (p.get("batSide") or {}).get("code"),
        }
    return players


MIN_BATTER_PA = 100  # keep stars who missed time (qualified-only drops them)


def fetch_batter_krates():
    """id -> K% (SO / PA * 100) for every 2026 hitter with 100+ PA."""
    data = get_json(
        f"{STATSAPI}/stats",
        {
            "stats": "season",
            "season": SEASON,
            "group": "hitting",
            "limit": 5000,
            "playerPool": "ALL",
        },
    )
    out = {}
    for s in data["stats"][0]["splits"]:
        pid = s["player"]["id"]
        pa = s["stat"].get("plateAppearances") or 0
        so = s["stat"].get("strikeOuts") or 0
        if pa >= MIN_BATTER_PA:
            out[pid] = round(100.0 * so / pa, 1)
    return out


def main():
    arsenal = fetch_arsenal()
    players = fetch_players()
    krates = fetch_batter_krates()

    pitchers = []
    for pid, usage in arsenal.items():
        p = players.get(pid)
        if not p or p["pitch_hand"] not in ("R", "L"):
            continue
        pitchers.append(
            {
                "player_id": pid,
                "player_name": p["name"],
                "team": p["team"],
                "hand": p["pitch_hand"],
                "usage": dict(sorted(usage.items(), key=lambda kv: (-kv[1], kv[0]))),
            }
        )

    batters = []
    for pid, krate in krates.items():
        p = players.get(pid)
        if not p or p["bat_hand"] not in ("R", "L", "S"):
            continue
        batters.append(
            {
                "player_id": pid,
                "player_name": p["name"],
                "team": p["team"],
                "hand": p["bat_hand"],
                "k_rate": krate,
            }
        )

    pitchers.sort(key=lambda x: x["player_name"].lower())
    batters.sort(key=lambda x: x["player_name"].lower())

    out = {
        "season": str(SEASON),
        "generated_from": "Statcast pitch-arsenal leaderboard (usage) + MLB Stats API (ids, hands, K%)",
        "pitchers": pitchers,
        "batters": batters,
    }
    path = Path("public/data/pitch-predictor-players.json")
    path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {path} — {len(pitchers)} pitchers, {len(batters)} batters")


if __name__ == "__main__":
    main()