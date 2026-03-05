import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import scoreboard, games, teams, leaderboards, scatter
from app.models.schemas import HealthResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("NFL Game on Paper backend starting up")
    # Pre-warm nflverse schedule cache on startup (non-blocking)
    try:
        from app.services.nflverse_svc import get_schedules
        get_schedules()
        logger.info("nflverse schedule cache warmed")
    except Exception as e:
        logger.warning("Failed to pre-warm nflverse cache (non-critical): %s", e)
    yield
    logger.info("NFL Game on Paper backend shutting down")


app = FastAPI(
    title="NFL Game on Paper",
    description="Live in-game NFL advanced analytics API",
    version="0.1.0",
    lifespan=lifespan,
)

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scoreboard.router, prefix="/api")
app.include_router(games.router, prefix="/api")
app.include_router(teams.router, prefix="/api")
app.include_router(leaderboards.router, prefix="/api")
app.include_router(scatter.router, prefix="/api")


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="ok",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
