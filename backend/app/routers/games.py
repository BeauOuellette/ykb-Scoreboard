import asyncio
import logging

from fastapi import APIRouter, HTTPException

from app.services import ep_wp
from app.utils.cache import cache

logger = logging.getLogger(__name__)
router = APIRouter()

ACTIVE_GAME_TTL = 30  # seconds
COMPLETED_GAME_TTL = 300  # 5 minutes


@router.get("/games/{espn_game_id}")
async def get_game(espn_game_id: str):
    """Get full game data with EP/WP analytics for an NFL game.

    Fetches play-by-play from ESPN, runs sportsdataverse EP/WP models,
    and returns enriched plays with expected points and win probability.
    """
    cache_key = f"game:{espn_game_id}"

    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        # sportsdataverse uses synchronous HTTP internally,
        # so run in a thread pool to avoid blocking the event loop
        result = await asyncio.to_thread(ep_wp.process_game, espn_game_id)
    except KeyError as e:
        logger.error("Malformed ESPN payload for game %s: %s", espn_game_id, e)
        raise HTTPException(
            status_code=404,
            detail="ESPN payload is malformed. Game data not available.",
        )
    except Exception as e:
        logger.error("Error processing game %s: %s", espn_game_id, e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process game: {str(e)}",
        )

    # Determine TTL based on game status
    is_completed = (
        result.get("header", {})
        .get("competitions", [{}])[0]
        .get("status", {})
        .get("type", {})
        .get("completed", False)
    )
    ttl = COMPLETED_GAME_TTL if is_completed else ACTIVE_GAME_TTL
    cache.set(cache_key, result, ttl)

    return result
