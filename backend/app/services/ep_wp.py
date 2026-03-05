"""EP/WP computation service using sportsdataverse NFLPlayProcess.

This is a direct port of game-on-paper-app/python/app.py, swapping
CFBPlayProcess for NFLPlayProcess. sportsdataverse handles all the
heavy lifting: ESPN data fetching, feature engineering, XGBoost
model prediction for Expected Points and Win Probability.
"""

from __future__ import annotations

import json
import logging
import sys

import numpy as np

# sportsdataverse's __init__ eagerly imports nfl_loaders which requires pyreadr.
# We only need nfl_pbp, so stub out the loaders module if pyreadr is missing.
try:
    from sportsdataverse.nfl.nfl_pbp import NFLPlayProcess
except ModuleNotFoundError:

    class _Stub:
        pass

    sys.modules.setdefault("sportsdataverse.nfl.nfl_loaders", _Stub())
    sys.modules.setdefault("sportsdataverse.cfb.cfb_loaders", _Stub())
    sys.modules.setdefault("sportsdataverse.mbb.mbb_loaders", _Stub())
    sys.modules.setdefault("sportsdataverse.wbb.wbb_loaders", _Stub())
    sys.modules.setdefault("sportsdataverse.nhl.nhl_loaders", _Stub())
    sys.modules.setdefault("sportsdataverse.mlb.mlb_loaders", _Stub())
    from sportsdataverse.nfl.nfl_pbp import NFLPlayProcess

logger = logging.getLogger(__name__)

# Flat columns created by sportsdataverse that we restructure back into
# nested objects. Removed from the final play records after restructuring.
BAD_COLS = [
    "start.distance",
    "start.yardLine",
    "start.team.id",
    "start.down",
    "start.yardsToEndzone",
    "start.posTeamTimeouts",
    "start.defTeamTimeouts",
    "start.shortDownDistanceText",
    "start.possessionText",
    "start.downDistanceText",
    "start.pos_team_timeouts",
    "start.def_pos_team_timeouts",
    "clock.displayValue",
    "type.id",
    "type.text",
    "type.abbreviation",
    "end.distance",
    "end.yardLine",
    "end.team.id",
    "end.down",
    "end.yardsToEndzone",
    "end.posTeamTimeouts",
    "end.defTeamTimeouts",
    "end.shortDownDistanceText",
    "end.possessionText",
    "end.downDistanceText",
    "end.pos_team_timeouts",
    "end.def_pos_team_timeouts",
    "expectedPoints.before",
    "expectedPoints.after",
    "expectedPoints.added",
    "winProbability.before",
    "winProbability.after",
    "winProbability.added",
    "scoringType.displayName",
    "scoringType.name",
    "scoringType.abbreviation",
]


def _safe_get(record: dict, key: str, default=None):
    """Safely get a key from a record, returning default if missing or NaN."""
    val = record.get(key, default)
    if val is None:
        return default
    if isinstance(val, float) and np.isnan(val):
        return default
    return val


def _restructure_play(record: dict) -> dict:
    """Restructure a flat sportsdataverse play record back into nested objects.

    This mirrors the restructuring logic in game-on-paper-app/python/app.py
    lines 83-230.
    """
    record["clock"] = {
        "displayValue": _safe_get(record, "clock.displayValue", "0:00"),
        "minutes": _safe_get(record, "clock.minutes", 0),
        "seconds": _safe_get(record, "clock.seconds", 0),
    }

    record["type"] = {
        "id": _safe_get(record, "type.id"),
        "text": _safe_get(record, "type.text"),
        "abbreviation": _safe_get(record, "type.abbreviation"),
    }

    record["modelInputs"] = {
        "start": {
            "down": _safe_get(record, "start.down"),
            "distance": _safe_get(record, "start.distance"),
            "yardsToEndzone": _safe_get(record, "start.yardsToEndzone"),
            "TimeSecsRem": _safe_get(record, "start.TimeSecsRem"),
            "adj_TimeSecsRem": _safe_get(record, "start.adj_TimeSecsRem"),
            "pos_score_diff": _safe_get(record, "pos_score_diff_start"),
            "posTeamTimeouts": _safe_get(record, "start.posTeamTimeouts"),
            "defTeamTimeouts": _safe_get(record, "start.defPosTeamTimeouts"),
            "ExpScoreDiff": _safe_get(record, "start.ExpScoreDiff"),
            "ExpScoreDiff_Time_Ratio": _safe_get(record, "start.ExpScoreDiff_Time_Ratio"),
            "spread_time": _safe_get(record, "start.spread_time"),
            "pos_team_receives_2H_kickoff": _safe_get(record, "start.pos_team_receives_2H_kickoff"),
            "is_home": _safe_get(record, "start.is_home"),
            "period": _safe_get(record, "period"),
        },
        "end": {
            "down": _safe_get(record, "end.down"),
            "distance": _safe_get(record, "end.distance"),
            "yardsToEndzone": _safe_get(record, "end.yardsToEndzone"),
            "TimeSecsRem": _safe_get(record, "end.TimeSecsRem"),
            "adj_TimeSecsRem": _safe_get(record, "end.adj_TimeSecsRem"),
            "posTeamTimeouts": _safe_get(record, "end.posTeamTimeouts"),
            "defTeamTimeouts": _safe_get(record, "end.defPosTeamTimeouts"),
            "pos_score_diff": _safe_get(record, "pos_score_diff_end"),
            "ExpScoreDiff": _safe_get(record, "end.ExpScoreDiff"),
            "ExpScoreDiff_Time_Ratio": _safe_get(record, "end.ExpScoreDiff_Time_Ratio"),
            "spread_time": _safe_get(record, "end.spread_time"),
            "pos_team_receives_2H_kickoff": _safe_get(record, "end.pos_team_receives_2H_kickoff"),
            "is_home": _safe_get(record, "end.is_home"),
            "period": _safe_get(record, "period"),
        },
    }

    record["expectedPoints"] = {
        "before": _safe_get(record, "EP_start"),
        "after": _safe_get(record, "EP_end"),
        "added": _safe_get(record, "EPA"),
    }

    record["winProbability"] = {
        "before": _safe_get(record, "wp_before"),
        "after": _safe_get(record, "wp_after"),
        "added": _safe_get(record, "wpa"),
    }

    record["start"] = {
        "team": {"id": _safe_get(record, "start.team.id")},
        "pos_team": {
            "id": _safe_get(record, "start.pos_team.id"),
            "name": _safe_get(record, "start.pos_team.name"),
        },
        "def_pos_team": {
            "id": _safe_get(record, "start.def_pos_team.id"),
            "name": _safe_get(record, "start.def_pos_team.name"),
        },
        "distance": _safe_get(record, "start.distance"),
        "yardLine": _safe_get(record, "start.yardLine"),
        "down": _safe_get(record, "start.down"),
        "yardsToEndzone": _safe_get(record, "start.yardsToEndzone"),
        "homeScore": _safe_get(record, "start.homeScore"),
        "awayScore": _safe_get(record, "start.awayScore"),
        "pos_team_score": _safe_get(record, "start.pos_team_score"),
        "def_pos_team_score": _safe_get(record, "start.def_pos_team_score"),
        "pos_score_diff": _safe_get(record, "pos_score_diff_start"),
        "posTeamTimeouts": _safe_get(record, "start.posTeamTimeouts"),
        "defTeamTimeouts": _safe_get(record, "start.defPosTeamTimeouts"),
        "ExpScoreDiff": _safe_get(record, "start.ExpScoreDiff"),
        "ExpScoreDiff_Time_Ratio": _safe_get(record, "start.ExpScoreDiff_Time_Ratio"),
        "shortDownDistanceText": _safe_get(record, "start.shortDownDistanceText"),
        "possessionText": _safe_get(record, "start.possessionText"),
        "downDistanceText": _safe_get(record, "start.downDistanceText"),
        "posTeamSpread": _safe_get(record, "start.pos_team_spread"),
    }

    record["end"] = {
        "team": {"id": _safe_get(record, "end.team.id")},
        "pos_team": {
            "id": _safe_get(record, "end.pos_team.id"),
            "name": _safe_get(record, "end.pos_team.name"),
        },
        "def_pos_team": {
            "id": _safe_get(record, "end.def_pos_team.id"),
            "name": _safe_get(record, "end.def_pos_team.name"),
        },
        "distance": _safe_get(record, "end.distance"),
        "yardLine": _safe_get(record, "end.yardLine"),
        "down": _safe_get(record, "end.down"),
        "yardsToEndzone": _safe_get(record, "end.yardsToEndzone"),
        "homeScore": _safe_get(record, "end.homeScore"),
        "awayScore": _safe_get(record, "end.awayScore"),
        "pos_team_score": _safe_get(record, "end.pos_team_score"),
        "def_pos_team_score": _safe_get(record, "end.def_pos_team_score"),
        "pos_score_diff": _safe_get(record, "pos_score_diff_end"),
        "posTeamTimeouts": _safe_get(record, "end.posTeamTimeouts"),
        "defPosTeamTimeouts": _safe_get(record, "end.defPosTeamTimeouts"),
        "ExpScoreDiff": _safe_get(record, "end.ExpScoreDiff"),
        "ExpScoreDiff_Time_Ratio": _safe_get(record, "end.ExpScoreDiff_Time_Ratio"),
        "shortDownDistanceText": record.get("end.shortDownDistanceText"),
        "possessionText": record.get("end.possessionText"),
        "downDistanceText": record.get("end.downDistanceText"),
    }

    # Remove intermediate flat columns
    for col in BAD_COLS:
        record.pop(col, None)

    return record


def process_game(game_id: str) -> dict:
    """Process an NFL game through sportsdataverse EP/WP pipeline.

    This is a synchronous function because sportsdataverse uses
    synchronous HTTP calls internally. Run in a thread pool from async context.

    Args:
        game_id: ESPN game ID (e.g., "401772988")

    Returns:
        Dict with processed plays, box score, and ESPN passthrough data.
    """
    processed_data = NFLPlayProcess(gameId=int(game_id))
    pbp = processed_data.espn_nfl_pbp()
    processed_data.run_processing_pipeline()

    # Convert DataFrame to JSON records
    tmp_json = processed_data.plays_json.to_json(orient="records")
    plays = json.loads(tmp_json)

    # Create advanced box score
    box = processed_data.create_box_score()

    # Restructure each play record
    for record in plays:
        _restructure_play(record)

    # Extract team IDs from header
    competitors = pbp["header"]["competitions"][0]["competitors"]
    home_team_id = competitors[0]["team"]["id"]
    away_team_id = competitors[1]["team"]["id"]

    result = {
        "id": game_id,
        "count": len(plays),
        "plays": plays,
        "box_score": box,
        "homeTeamId": home_team_id,
        "awayTeamId": away_team_id,
        "drives": pbp.get("drives", {}),
        "scoringPlays": _to_list(pbp.get("scoringPlays", [])),
        "winprobability": _to_list(pbp.get("winprobability", [])),
        "boxScore": pbp.get("boxscore", {}),
        "header": pbp.get("header", {}),
        "broadcasts": _to_list(pbp.get("broadcasts", [])),
        "pickcenter": _to_list(pbp.get("pickcenter", [])),
        "standings": pbp.get("standings", {}),
        "gameInfo": _to_list(pbp.get("gameInfo", [])),
    }

    return result


def _to_list(val) -> list:
    """Convert numpy arrays or other iterables to plain Python lists."""
    if isinstance(val, np.ndarray):
        return val.tolist()
    if isinstance(val, list):
        return val
    if isinstance(val, dict):
        return [val]
    return list(val) if val else []
