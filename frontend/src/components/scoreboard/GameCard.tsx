import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Game } from "@/types";

function statusVariant(state: string): "default" | "secondary" | "destructive" | "outline" {
  switch (state) {
    case "in":
      return "destructive";
    case "post":
      return "secondary";
    default:
      return "outline";
  }
}

function statusLabel(game: Game): string {
  if (game.status.state === "in") {
    return `Q${game.status.period} ${game.status.clock}`;
  }
  return game.status.description || game.status.detail;
}

export function GameCard({ game }: { game: Game }) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={() => navigate(`/game/${game.id}`)}
    >
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <Badge variant={statusVariant(game.status.state)}>
            {statusLabel(game)}
          </Badge>
        </div>

        {/* Away team */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2">
            {game.awayTeam.logo && (
              <img
                src={game.awayTeam.logo}
                alt={game.awayTeam.abbreviation ?? ""}
                className="h-6 w-6"
              />
            )}
            <Link
              to={`/team/${game.awayTeam.abbreviation}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-sm hover:underline"
            >
              {game.awayTeam.abbreviation}
            </Link>
          </div>
          <span className="font-mono text-lg font-bold">{game.awayScore}</span>
        </div>

        {/* Home team */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2">
            {game.homeTeam.logo && (
              <img
                src={game.homeTeam.logo}
                alt={game.homeTeam.abbreviation ?? ""}
                className="h-6 w-6"
              />
            )}
            <Link
              to={`/team/${game.homeTeam.abbreviation}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-sm hover:underline"
            >
              {game.homeTeam.abbreviation}
            </Link>
          </div>
          <span className="font-mono text-lg font-bold">{game.homeScore}</span>
        </div>
      </CardContent>
    </Card>
  );
}
