import { useParams, Link, useSearchParams } from "react-router-dom";
import { useTeamProfile } from "@/hooks/useTeamProfile";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const SEASONS = [2024, 2023, 2022, 2021, 2020];

function StatCard({ label, value }: { label: string; value: number | null }) {
  const formatted =
    value != null ? (Math.abs(value) < 1 ? value.toFixed(4) : value.toFixed(1)) : "\u2014";
  const isPositive = value != null && value > 0;
  const isNegative = value != null && value < 0;

  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </div>
        <div
          className={`text-xl font-bold font-mono ${
            isPositive ? "text-green-400" : isNegative ? "text-red-400" : ""
          }`}
        >
          {formatted}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeamPage() {
  const { abbr } = useParams<{ abbr: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const season = Number(searchParams.get("season")) || 2024;

  const { data, isLoading, error } = useTeamProfile(abbr ?? "", season);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-destructive/10 p-4 text-destructive text-sm">
        Failed to load team data.
      </div>
    );
  }

  const { team, stats, recent_games } = data;
  const logo = (team as Record<string, string>).team_logo_espn;
  const teamName = (team as Record<string, string>).team_name;
  const color = (team as Record<string, string>).team_color;

  return (
    <div>
      {/* Team Header */}
      <div className="flex items-center gap-4 mb-6">
        {logo && <img src={logo} alt={abbr} className="h-16 w-16" />}
        <div>
          <h1 className="text-2xl font-bold">{teamName}</h1>
          <span className="text-muted-foreground text-sm">{abbr?.toUpperCase()}</span>
        </div>
        {color && (
          <div
            className="ml-auto hidden sm:block h-2 w-24 rounded"
            style={{ backgroundColor: `#${color}` }}
          />
        )}
      </div>

      {/* Season Selector */}
      <div className="mb-6">
        <select
          value={season}
          onChange={(e) => setSearchParams({ season: e.target.value })}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
        >
          {SEASONS.map((s) => (
            <option key={s} value={s}>
              {s} Season
            </option>
          ))}
        </select>
      </div>

      {/* Stats Grid */}
      {stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
          <StatCard label="Off EPA/Play" value={stats.off_epa_per_play} />
          <StatCard label="Def EPA/Play" value={stats.def_epa_per_play} />
          <StatCard label="Pass EPA/Play" value={stats.pass_epa_per_play} />
          <StatCard label="Rush EPA/Play" value={stats.rush_epa_per_play} />
          <StatCard label="Off Success %" value={stats.off_success_rate != null ? stats.off_success_rate * 100 : null} />
          <StatCard label="Def Success %" value={stats.def_success_rate != null ? stats.def_success_rate * 100 : null} />
          <StatCard label="Off Plays" value={stats.total_off_plays} />
          <StatCard label="Def Plays" value={stats.total_def_plays} />
        </div>
      ) : (
        <p className="text-muted-foreground mb-8">No stats available for this season.</p>
      )}

      {/* Recent Games */}
      {recent_games.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Games</h2>
          <div className="space-y-2">
            {recent_games.map((g, i) => (
              <Card key={i}>
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Badge variant={g.result === "W" ? "default" : "secondary"}>
                      {g.result}
                    </Badge>
                    <span className="text-sm">
                      {g.home_away === "away" ? "@" : "vs"}{" "}
                      <Link
                        to={`/team/${g.opponent}`}
                        className="font-semibold hover:underline"
                      >
                        {g.opponent}
                      </Link>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold">
                      {g.team_score}\u2013{g.opp_score}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {g.gameday}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
