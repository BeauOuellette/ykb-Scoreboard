import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import type { TeamListItem } from "@/types";

export function useTeams() {
  return useQuery<TeamListItem[]>({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data } = await api.get<TeamListItem[]>("/teams");
      return data;
    },
    staleTime: 86_400_000,
  });
}
