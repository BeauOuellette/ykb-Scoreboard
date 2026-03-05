import { Skeleton } from "@/components/ui/skeleton";
import { GameCard } from "./GameCard";
import type { Game } from "@/types";

export function ScoreboardGrid({
  games,
  isLoading,
}: {
  games: Game[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No games found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
