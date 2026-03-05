import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import type { Game } from "@/types";

interface ScoreboardParams {
  week?: number;
  season?: number;
  seasontype?: number;
}

export function useScoreboard(params: ScoreboardParams = {}) {
  const { week, season, seasontype } = params;
  return useQuery<Game[]>({
    queryKey: ["scoreboard", week, season, seasontype],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (week != null) searchParams.set("week", String(week));
      if (season != null) searchParams.set("season", String(season));
      if (seasontype != null) searchParams.set("seasontype", String(seasontype));
      const qs = searchParams.toString();
      const { data } = await api.get<Game[]>(`/scoreboard${qs ? `?${qs}` : ""}`);
      return data;
    },
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}
