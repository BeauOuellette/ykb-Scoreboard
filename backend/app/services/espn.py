from __future__ import annotations

import asyncio
import logging
from typing import List, Optional

import httpx

logger = logging.getLogger(__name__)

ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl"
TIMEOUT = 10.0
MAX_RETRIES = 3


async def _fetch_with_retry(url: str) -> dict:
    """Fetch a URL with exponential backoff retry logic."""
    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                return resp.json()
        except (httpx.HTTPStatusError, httpx.RequestError) as e:
            if attempt == MAX_RETRIES - 1:
                logger.error("ESPN API failed after %d attempts: %s", MAX_RETRIES, e)
                raise
            wait = 2 ** attempt
            logger.warning("ESPN API attempt %d failed, retrying in %ds: %s", attempt + 1, wait, e)
            await asyncio.sleep(wait)


async def get_scoreboard(
    week: Optional[int] = None,
    season: Optional[int] = None,
    seasontype: Optional[int] = None,
) -> List[dict]:
    """Fetch NFL scoreboard from ESPN.

    Args:
        week: Week number (optional)
        season: Season year, e.g. 2024 (optional)
        seasontype: 1=preseason, 2=regular, 3=postseason (optional)

    Returns a simplified list of games with id, teams, scores, status.
    """
    params = {}
    if week is not None:
        params["week"] = str(week)
    if season is not None:
        params["dates"] = str(season)
    if seasontype is not None:
        params["seasontype"] = str(seasontype)

    query = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"{ESPN_BASE}/scoreboard" + (f"?{query}" if query else "")
    data = await _fetch_with_retry(url)
    games = []
    for event in data.get("events", []):
        competition = event.get("competitions", [{}])[0]
        competitors = competition.get("competitors", [])

        home = next((c for c in competitors if c.get("homeAway") == "home"), {})
        away = next((c for c in competitors if c.get("homeAway") == "away"), {})

        status = event.get("status", {})
        status_type = status.get("type", {})

        games.append({
            "id": event.get("id"),
            "name": event.get("name"),
            "shortName": event.get("shortName"),
            "status": {
                "clock": status.get("displayClock", "0:00"),
                "period": status.get("period", 0),
                "state": status_type.get("state", "pre"),
                "completed": status_type.get("completed", False),
                "description": status_type.get("description", ""),
                "detail": status_type.get("detail", ""),
            },
            "homeTeam": {
                "id": home.get("team", {}).get("id"),
                "name": home.get("team", {}).get("displayName"),
                "abbreviation": home.get("team", {}).get("abbreviation"),
                "logo": home.get("team", {}).get("logo"),
                "color": home.get("team", {}).get("color"),
            },
            "awayTeam": {
                "id": away.get("team", {}).get("id"),
                "name": away.get("team", {}).get("displayName"),
                "abbreviation": away.get("team", {}).get("abbreviation"),
                "logo": away.get("team", {}).get("logo"),
                "color": away.get("team", {}).get("color"),
            },
            "homeScore": int(home.get("score", 0)),
            "awayScore": int(away.get("score", 0)),
        })
    return games


async def get_game_summary(espn_game_id: str) -> dict:
    """Fetch full game summary from ESPN NFL summary API.

    Returns raw JSON with drives, plays, header, pickcenter, winprobability, etc.
    """
    return await _fetch_with_retry(f"{ESPN_BASE}/summary?event={espn_game_id}")
