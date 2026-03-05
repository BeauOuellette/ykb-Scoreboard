import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import type { ScatterTeam } from "@/types";

export function useScatter(season: number = 2024) {
  return useQuery<ScatterTeam[]>({
    queryKey: ["scatter", season],
    queryFn: async () => {
      const { data } = await api.get<ScatterTeam[]>(
        `/scatter?season=${season}`
      );
      return data;
    },
    staleTime: 10_800_000,
  });
}
