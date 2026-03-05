import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import type { GameDetail } from "@/types";

export function useGame(gameId: string) {
  return useQuery<GameDetail>({
    queryKey: ["game", gameId],
    queryFn: async () => {
      const { data } = await api.get<GameDetail>(`/games/${gameId}`);
      return data;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.header?.competitions?.[0]?.status;
      if (status?.type?.completed) return false;
      return 30_000;
    },
    staleTime: 25_000,
  });
}
