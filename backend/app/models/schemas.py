from __future__ import annotations

from typing import Any, List, Optional

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    timestamp: str


class TeamInfo(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    abbreviation: Optional[str] = None
    logo: Optional[str] = None
    color: Optional[str] = None


class GameStatus(BaseModel):
    clock: str
    period: int
    state: str
    completed: bool
    description: str
    detail: str


class ScoreboardGame(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    shortName: Optional[str] = None
    status: GameStatus
    homeTeam: TeamInfo
    awayTeam: TeamInfo
    homeScore: int
    awayScore: int


class ExpectedPoints(BaseModel):
    before: Optional[float] = None
    after: Optional[float] = None
    added: Optional[float] = None


class WinProbability(BaseModel):
    before: Optional[float] = None
    after: Optional[float] = None
    added: Optional[float] = None


class PlayDetail(BaseModel):
    """A single play enriched with EP/WP data."""
    id: Optional[str] = None
    text: Optional[str] = None
    period: Optional[int] = None
    clock: Optional[dict] = None
    type: Optional[dict] = None
    expectedPoints: Optional[ExpectedPoints] = None
    winProbability: Optional[WinProbability] = None
    start: Optional[dict] = None
    end: Optional[dict] = None
    modelInputs: Optional[dict] = None
    statYardage: Optional[int] = None
    scoringPlay: Optional[bool] = None


class GameDetail(BaseModel):
    """Full game response with processed plays and ESPN passthrough data."""
    id: str
    count: int
    plays: List[dict]
    box_score: Any = None
    homeTeamId: Optional[str] = None
    awayTeamId: Optional[str] = None
    drives: Any = None
    scoringPlays: List[dict] = []
    winprobability: List[dict] = []
    boxScore: Any = None
    header: Any = None
    broadcasts: List[dict] = []
    pickcenter: List[dict] = []
    standings: Any = None
    gameInfo: Optional[list] = None
