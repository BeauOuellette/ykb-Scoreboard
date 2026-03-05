from __future__ import annotations

import asyncio
from typing import Optional

from fastapi import APIRouter, Query
import logging

from app.services import nflverse_svc
from app.utils.cache import cache

logger = logging.getLogger(__name__)
router = APIRouter()

LEADERBOARD_TTL = 10800  # 3 hours


@router.get("/leaderboards")
async def get_leaderboard(
    season: Optional[int] = Query(2024, description="Season year"),
    position: Optional[str] = Query("QB", description="Position: QB, WR, RB, TE"),
    stat: Optional[str] = Query("epa", description="Stat: epa, yards, touchdowns, targets, carries"),
    limit: Optional[int] = Query(25, description="Number of results"),
):
    """Get player stat leaderboard."""
    s = season or 2024
    pos = (position or "QB").upper()
    st = stat or "epa"
    lim = min(limit or 25, 50)

    cache_key = f"leaderboard:{s}:{pos}:{st}:{lim}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    result = await asyncio.to_thread(
        nflverse_svc.get_leaderboard, s, pos, st, lim
    )
    cache.set(cache_key, result, LEADERBOARD_TTL)
    return result
