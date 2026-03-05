import { useState } from "react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";

const POSITIONS = ["QB", "WR", "RB", "TE"];
const STATS: Record<string, string[]> = {
  QB: ["epa", "yards", "touchdowns", "targets"],
  WR: ["epa", "yards", "touchdowns", "targets"],
  RB: ["epa", "yards", "touchdowns", "carries"],
  TE: ["epa", "yards", "touchdowns", "targets"],
};

const STAT_LABELS: Record<string, string> = {
  epa: "EPA",
  yards: "Yards",
  touchdowns: "TDs",
  targets: "Targets",
  carries: "Carries",
};

export default function LeaderboardPage() {
  const [position, setPosition] = useState("QB");
  const [stat, setStat] = useState("epa");
  const { data, isLoading, error } = useLeaderboard(2024, position, stat, 25);

  const availableStats = STATS[position] ?? STATS.QB;
  if (!availableStats.includes(stat)) {
    setStat(availableStats[0]);
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Player Leaderboards</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex rounded-md border border-border overflow-hidden">
          {POSITIONS.map((p) => (
            <button
              key={p}
              onClick={() => setPosition(p)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                position === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex rounded-md border border-border overflow-hidden">
          {availableStats.map((s) => (
            <button
              key={s}
              onClick={() => setStat(s)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                stat === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {STAT_LABELS[s] ?? s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive text-sm">
          Failed to load leaderboard.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 sm:w-12">#</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="hidden sm:table-cell">Team</TableHead>
                  <TableHead className="text-right">
                    {STAT_LABELS[stat] ?? stat}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((p) => (
                  <TableRow key={p.player_id}>
                    <TableCell className="font-mono text-muted-foreground">
                      {p.rank}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {p.headshot_url && (
                          <img
                            src={p.headshot_url}
                            alt={p.player_display_name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        )}
                        <span className="font-medium">
                          {p.player_display_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Link
                        to={`/team/${p.recent_team}`}
                        className="hover:underline text-muted-foreground"
                      >
                        {p.recent_team}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {p.stat_value != null
                        ? Math.abs(p.stat_value) < 10
                          ? p.stat_value.toFixed(2)
                          : p.stat_value.toFixed(1)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground">No data available.</p>
      )}
    </div>
  );
}
