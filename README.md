# NFL Game on Paper

Live in-game advanced analytics dashboard for NFL games. Real-time EPA (Expected Points Added), Win Probability, drive charts, player leaderboards, and team-level analytics.

<!-- screenshot here -->

## Tech Stack

**Backend:** Python 3.12, FastAPI, sportsdataverse (NFLPlayProcess for EP/WP models), nfl_data_py (historical stats), httpx

**Frontend:** React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui, Recharts, TanStack Query, react-router-dom

**Data Sources:**
- ESPN NFL Summary API (live play-by-play, win probability, scoring plays, drives)
- sportsdataverse NFLPlayProcess (XGBoost EP/WP model inference)
- nfl_data_py (historical PBP, weekly player stats, team metadata, schedules)

## Local Development

### Two-terminal setup

**Terminal 1 — Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173, backend at http://localhost:8000.

### Docker Compose (alternative)

```bash
docker-compose up
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/scoreboard?week=&season=&seasontype=` | NFL scoreboard |
| `GET /api/games/{espn_game_id}` | Full game with EP/WP analytics |
| `GET /api/teams` | All 32 NFL teams |
| `GET /api/teams/{abbr}?season=` | Team profile with EPA stats |
| `GET /api/leaderboards?season=&position=&stat=&limit=` | Player leaderboards |
| `GET /api/scatter?season=` | Team EPA scatter data |

## Deployment

**Backend:** Dockerized, deployed to Fly.io
```bash
cd backend
fly deploy
```

**Frontend:** Static build, deployed to Vercel
```bash
cd frontend
vercel --prod
```

### Environment Variables

**Backend** (`CORS_ORIGINS`): comma-separated allowed origins
```
CORS_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app
```

**Frontend** (`VITE_API_URL`): backend API base URL
```
VITE_API_URL=https://your-backend.fly.dev/api
```
