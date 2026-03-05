import { useState } from "react";
import { useScoreboard } from "@/hooks/useScoreboard";
import { ScoreboardGrid } from "@/components/scoreboard/ScoreboardGrid";
import { WeekSelector } from "@/components/scoreboard/WeekSelector";

export default function ScoreboardPage() {
  const [params, setParams] = useState<{
    week?: number;
    season?: number;
    seasontype?: number;
  }>({});

  const { data: games, isLoading, error } = useScoreboard(params);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">NFL Scoreboard</h1>
        <WeekSelector
          week={params.week}
          season={params.season}
          seasontype={params.seasontype}
          onChange={setParams}
        />
      </div>
      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive text-sm">
          Failed to load scoreboard. Retrying...
        </div>
      )}
      <ScoreboardGrid games={games} isLoading={isLoading} />
    </div>
  );
}
