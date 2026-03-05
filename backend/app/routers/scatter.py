from __future__ import annotations

import asyncio
from typing import Optional

from fastapi import APIRouter, Query
import logging

from app.services import nflverse_svc
from app.utils.cache import cache

logger = logging.getLogger(__name__)
router = APIRouter()

SCATTER_TTL = 10800  # 3 hours


@router.get("/scatter")
async def get_scatter(
    season: Optional[int] = Query(2024, description="Season year"),
):
    """Get team-level EPA per play for scatter plot."""
    s = season or 2024
    cache_key = f"scatter:{s}"

    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    result = await asyncio.to_thread(nflverse_svc.get_scatter_data, s)
    cache.set(cache_key, result, SCATTER_TTL)
    return result
