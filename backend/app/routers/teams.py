from __future__ import annotations

import asyncio
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
import logging

from app.services import nflverse_svc
from app.utils.cache import cache

logger = logging.getLogger(__name__)
router = APIRouter()

TEAMS_TTL = 86400  # 24 hours
TEAM_PROFILE_TTL = 10800  # 3 hours


@router.get("/teams")
async def list_teams():
    """Get all 32 NFL teams with metadata."""
    cached = cache.get("teams:all")
    if cached is not None:
        return cached

    teams = await asyncio.to_thread(nflverse_svc.get_team_descriptions)
    # Filter to active NFL teams (exclude historical/inactive)
    active = [
        {
            "team_abbr": t["team_abbr"],
            "team_name": t["team_name"],
            "team_logo_espn": t.get("team_logo_espn"),
            "team_color": t.get("team_color"),
            "team_color2": t.get("team_color2"),
        }
        for t in teams
        if t.get("team_abbr") and t["team_abbr"] not in ("", None)
    ]
    cache.set("teams:all", active, TEAMS_TTL)
    return active


@router.get("/teams/{team_abbr}")
async def get_team(
    team_abbr: str,
    season: Optional[int] = Query(None, description="Season year, default 2024"),
):
    """Get team profile with season EPA stats and recent games."""
    s = season or 2024
    cache_key = f"team:{team_abbr}:{s}"

    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    result = await asyncio.to_thread(nflverse_svc.get_team_season_stats, team_abbr, s)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Team '{team_abbr}' not found")

    cache.set(cache_key, result, TEAM_PROFILE_TTL)
    return result
