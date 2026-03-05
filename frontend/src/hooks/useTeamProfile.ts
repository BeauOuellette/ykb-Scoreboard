import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import type { TeamProfile } from "@/types";

export function useTeamProfile(teamAbbr: string, season: number = 2024) {
  return useQuery<TeamProfile>({
    queryKey: ["team", teamAbbr, season],
    queryFn: async () => {
      const { data } = await api.get<TeamProfile>(
        `/teams/${teamAbbr}?season=${season}`
      );
      return data;
    },
    staleTime: 10_800_000,
    enabled: !!teamAbbr,
  });
}
