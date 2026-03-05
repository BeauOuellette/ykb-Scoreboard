import { useScatter } from "@/hooks/useScatter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";

interface TooltipPayloadEntry {
  payload: {
    team_abbr: string;
    team_name: string;
    off_epa_per_play: number;
    def_epa_per_play: number;
  };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card p-2 text-sm shadow-lg">
      <div className="font-bold">{d.team_name}</div>
      <div>Off EPA/Play: {d.off_epa_per_play?.toFixed(4)}</div>
      <div>Def EPA/Play: {d.def_epa_per_play?.toFixed(4)}</div>
    </div>
  );
}

export default function ScatterPage() {
  const { data, isLoading, error } = useScatter(2024);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Team EPA Scatter</h1>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold">Team EPA Scatter</h1>
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive text-sm">
          Failed to load scatter data.
        </div>
      </div>
    );
  }

  // Invert def EPA so that lower (better defense) appears higher on the chart
  const chartData = data.map((t) => ({
    ...t,
    def_epa_inverted: t.def_epa_per_play != null ? -t.def_epa_per_play : 0,
    off: t.off_epa_per_play ?? 0,
  }));

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Team EPA Scatter</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        2024 Season — Offensive EPA/Play vs Defensive EPA/Play (inverted: up = better defense)
      </p>

      <p className="mb-3 text-xs text-muted-foreground sm:hidden">
        Best viewed on desktop — pinch to zoom on mobile.
      </p>

      <Card>
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={520}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                dataKey="off"
                name="Off EPA/Play"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                label={{
                  value: "Offensive EPA/Play →",
                  position: "bottom",
                  offset: 0,
                  style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
                }}
              />
              <YAxis
                type="number"
                dataKey="def_epa_inverted"
                name="Def EPA/Play (inv)"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                label={{
                  value: "← Better Defense",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={0} stroke="hsl(var(--border))" />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Scatter
                data={chartData}
                onClick={(entry) => {
                  if (entry?.team_abbr) navigate(`/team/${entry.team_abbr}`);
                }}
                cursor="pointer"
              >
                {chartData.map((t) => (
                  <Cell
                    key={t.team_abbr}
                    fill={t.team_color ? `#${t.team_color}` : "hsl(var(--primary))"}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          {/* Team labels below chart */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {data.map((t) => (
              <button
                key={t.team_abbr}
                onClick={() => navigate(`/team/${t.team_abbr}`)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-accent/50 transition-colors"
              >
                {t.team_logo_espn && (
                  <img src={t.team_logo_espn} alt={t.team_abbr} className="h-4 w-4" />
                )}
                <span>{t.team_abbr}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
