from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query
import logging

from app.services import espn
from app.utils.cache import cache

logger = logging.getLogger(__name__)
router = APIRouter()

SCOREBOARD_TTL = 30  # seconds


@router.get("/scoreboard")
async def get_scoreboard(
    week: Optional[int] = Query(None, description="Week number"),
    season: Optional[int] = Query(None, description="Season year, e.g. 2024"),
    seasontype: Optional[int] = Query(None, description="1=preseason, 2=regular, 3=postseason"),
):
    """Get NFL scoreboard. Defaults to current week when no params provided."""
    cache_key = f"scoreboard:{season}:{week}:{seasontype}"

    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        games = await espn.get_scoreboard(week=week, season=season, seasontype=seasontype)
        cache.set(cache_key, games, SCOREBOARD_TTL)
        return games
    except Exception as e:
        logger.error("Failed to fetch scoreboard: %s", e)
        raise HTTPException(status_code=502, detail="Failed to fetch scoreboard from ESPN")
