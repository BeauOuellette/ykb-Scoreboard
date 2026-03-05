import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import type { PlayerLeaderboardEntry } from "@/types";

export function useLeaderboard(
  season: number = 2024,
  position: string = "QB",
  stat: string = "epa",
  limit: number = 25
) {
  return useQuery<PlayerLeaderboardEntry[]>({
    queryKey: ["leaderboard", season, position, stat, limit],
    queryFn: async () => {
      const { data } = await api.get<PlayerLeaderboardEntry[]>(
        `/leaderboards?season=${season}&position=${position}&stat=${stat}&limit=${limit}`
      );
      return data;
    },
    staleTime: 10_800_000,
  });
}
