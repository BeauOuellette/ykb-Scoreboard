"""nfl_data_py wrapper for historical data, schedule metadata, and roster lookups.

Used for:
- Team metadata and colors
- Season EPA aggregates (from PBP data)
- Player leaderboards (from weekly stats)
- Schedule cross-references

NOT used for live EP/WP computation.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional

import nfl_data_py as nfl
import pandas as pd

logger = logging.getLogger(__name__)

_schedule_cache: Optional[List[dict]] = None
_team_desc_cache: Optional[List[dict]] = None
_pbp_cache: Dict[int, pd.DataFrame] = {}
_weekly_cache: Dict[int, pd.DataFrame] = {}


def get_schedules(years: Optional[List[int]] = None) -> List[dict]:
    """Load NFL schedules with ESPN game ID cross-references."""
    global _schedule_cache
    if _schedule_cache is not None:
        return _schedule_cache

    if years is None:
        years = [2024, 2025]

    try:
        df = nfl.import_schedules(years)
        _schedule_cache = df.to_dict(orient="records")
        logger.info("Loaded %d schedule entries for years %s", len(_schedule_cache), years)
        return _schedule_cache
    except Exception as e:
        logger.error("Failed to load nfl_data_py schedules: %s", e)
        return []


def get_team_descriptions() -> List[dict]:
    """Load NFL team metadata (names, colors, logos, divisions)."""
    global _team_desc_cache
    if _team_desc_cache is not None:
        return _team_desc_cache

    try:
        df = nfl.import_team_desc()
        _team_desc_cache = df.to_dict(orient="records")
        return _team_desc_cache
    except Exception as e:
        logger.error("Failed to load team descriptions: %s", e)
        return []


def _get_pbp(season: int) -> pd.DataFrame:
    """Load and cache PBP data for a season."""
    if season not in _pbp_cache:
        logger.info("Loading PBP data for %d...", season)
        _pbp_cache[season] = nfl.import_pbp_data([season])
        logger.info("PBP loaded: %d rows", len(_pbp_cache[season]))
    return _pbp_cache[season]


def _get_weekly(season: int) -> pd.DataFrame:
    """Load and cache weekly player stats for a season."""
    if season not in _weekly_cache:
        logger.info("Loading weekly stats for %d...", season)
        _weekly_cache[season] = nfl.import_weekly_data([season])
        logger.info("Weekly stats loaded: %d rows", len(_weekly_cache[season]))
    return _weekly_cache[season]


def get_team_season_stats(team_abbr: str, season: int = 2024) -> Optional[dict]:
    """Compute season EPA aggregates for a team from PBP data."""
    teams = get_team_descriptions()
    team_info = next((t for t in teams if t["team_abbr"] == team_abbr.upper()), None)
    if team_info is None:
        return None

    try:
        pbp = _get_pbp(season)
    except Exception as e:
        logger.error("Failed to load PBP for %d: %s", season, e)
        return {"team": team_info, "stats": None, "recent_games": []}

    # Filter to regular plays (exclude penalties-only, NA play types)
    plays = pbp[pbp["play_type"].isin(["pass", "run", "qb_kneel", "qb_spike"])].copy()

    off = plays[plays["posteam"] == team_abbr.upper()]
    def_ = plays[plays["defteam"] == team_abbr.upper()]

    off_pass = off[off["play_type"] == "pass"]
    off_rush = off[off["play_type"] == "run"]

    stats = {
        "off_epa_per_play": _safe_mean(off, "epa"),
        "def_epa_per_play": _safe_mean(def_, "epa"),
        "off_success_rate": _safe_mean(off, "success") if "success" in off.columns else None,
        "def_success_rate": _safe_mean(def_, "success") if "success" in def_.columns else None,
        "pass_epa_per_play": _safe_mean(off_pass, "epa"),
        "rush_epa_per_play": _safe_mean(off_rush, "epa"),
        "total_off_plays": len(off),
        "total_def_plays": len(def_),
    }

    # Recent games from schedule
    scheds = get_schedules([season])
    team_games = [
        s for s in scheds
        if (s.get("home_team") == team_abbr.upper() or s.get("away_team") == team_abbr.upper())
        and s.get("result") is not None
        and not pd.isna(s.get("result"))
    ]
    recent = sorted(team_games, key=lambda g: g.get("gameday", ""), reverse=True)[:5]
    recent_games = []
    for g in recent:
        is_home = g.get("home_team") == team_abbr.upper()
        recent_games.append({
            "gameday": g.get("gameday"),
            "opponent": g.get("away_team") if is_home else g.get("home_team"),
            "home_away": "home" if is_home else "away",
            "team_score": g.get("home_score") if is_home else g.get("away_score"),
            "opp_score": g.get("away_score") if is_home else g.get("home_score"),
            "result": "W" if (g.get("result", 0) > 0) == is_home else "L",
        })

    return {"team": team_info, "stats": stats, "recent_games": recent_games}


def get_leaderboard(
    season: int = 2024,
    position: str = "QB",
    stat: str = "epa",
    limit: int = 25,
) -> List[dict]:
    """Get player leaderboard from weekly stats, aggregated to season totals."""
    try:
        weekly = _get_weekly(season)
    except Exception as e:
        logger.error("Failed to load weekly stats for %d: %s", season, e)
        return []

    pos_upper = position.upper()
    filtered = weekly[weekly["position"] == pos_upper].copy()
    if filtered.empty:
        return []

    # Map stat names to columns and aggregation
    stat_map = {
        "epa": {
            "QB": ("passing_epa", "sum"),
            "WR": ("receiving_epa", "sum"),
            "TE": ("receiving_epa", "sum"),
            "RB": ("rushing_epa", "sum"),
        },
        "yards": {
            "QB": ("passing_yards", "sum"),
            "WR": ("receiving_yards", "sum"),
            "TE": ("receiving_yards", "sum"),
            "RB": ("rushing_yards", "sum"),
        },
        "touchdowns": {
            "QB": ("passing_tds", "sum"),
            "WR": ("receiving_tds", "sum"),
            "TE": ("receiving_tds", "sum"),
            "RB": ("rushing_tds", "sum"),
        },
        "targets": {
            "WR": ("targets", "sum"),
            "TE": ("targets", "sum"),
            "RB": ("targets", "sum"),
            "QB": ("attempts", "sum"),
        },
        "carries": {
            "RB": ("carries", "sum"),
            "QB": ("carries", "sum"),
            "WR": ("carries", "sum"),
            "TE": ("carries", "sum"),
        },
    }

    stat_conf = stat_map.get(stat, stat_map["epa"])
    col, agg = stat_conf.get(pos_upper, stat_conf.get("QB", ("passing_epa", "sum")))

    if col not in filtered.columns:
        return []

    # Aggregate per player
    agg_dict = {
        col: agg,
        "player_display_name": "first",
        "headshot_url": "first",
        "recent_team": "last",
        "position": "first",
    }
    # Add secondary stat columns
    secondary_cols = {
        "QB": ["passing_yards", "passing_tds", "interceptions", "completions", "attempts"],
        "WR": ["receiving_yards", "receiving_tds", "targets", "receptions"],
        "TE": ["receiving_yards", "receiving_tds", "targets", "receptions"],
        "RB": ["rushing_yards", "rushing_tds", "carries", "receiving_yards", "targets"],
    }
    for sc in secondary_cols.get(pos_upper, []):
        if sc in filtered.columns and sc not in agg_dict:
            agg_dict[sc] = "sum"

    grouped = filtered.groupby("player_id").agg(agg_dict)
    grouped = grouped.sort_values(col, ascending=False).head(limit)
    grouped["rank"] = range(1, len(grouped) + 1)
    grouped["stat_value"] = grouped[col]
    grouped["stat_name"] = stat

    result = grouped.reset_index().to_dict(orient="records")
    # Clean NaN values
    for r in result:
        for k, v in r.items():
            if isinstance(v, float) and pd.isna(v):
                r[k] = None
    return result


def get_scatter_data(season: int = 2024) -> List[dict]:
    """Get team-level off/def EPA per play for scatter plot."""
    try:
        pbp = _get_pbp(season)
    except Exception as e:
        logger.error("Failed to load PBP for scatter: %s", e)
        return []

    plays = pbp[pbp["play_type"].isin(["pass", "run"])].copy()
    teams = get_team_descriptions()
    team_map = {t["team_abbr"]: t for t in teams}

    result = []
    for abbr in plays["posteam"].dropna().unique():
        off = plays[plays["posteam"] == abbr]
        def_ = plays[plays["defteam"] == abbr]
        info = team_map.get(abbr, {})

        result.append({
            "team_abbr": abbr,
            "team_name": info.get("team_name", abbr),
            "team_logo_espn": info.get("team_logo_espn"),
            "team_color": info.get("team_color"),
            "off_epa_per_play": _safe_mean(off, "epa"),
            "def_epa_per_play": _safe_mean(def_, "epa"),
        })

    return sorted(result, key=lambda t: t.get("off_epa_per_play") or 0, reverse=True)


def _safe_mean(df: pd.DataFrame, col: str) -> Optional[float]:
    """Compute mean of a column, returning None if empty or all NaN."""
    if df.empty or col not in df.columns:
        return None
    val = df[col].mean()
    if pd.isna(val):
        return None
    return round(float(val), 4)
