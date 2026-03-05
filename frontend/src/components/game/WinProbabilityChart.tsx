import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { PlayDetail, EspnWinProbEntry } from "@/types";

interface WPChartProps {
  plays: PlayDetail[];
  espnWP: EspnWinProbEntry[];
  homeAbbr: string;
  awayAbbr: string;
  homeColor?: string;
  awayColor?: string;
}

export function WinProbabilityChart({
  plays,
  espnWP,
  homeAbbr,
  awayAbbr,
  homeColor = "#3b82f6",
  awayColor = "#ef4444",
}: WPChartProps) {
  // Build data from plays that have WP values
  const data = plays
    .filter((p) => p.winProbability?.before != null)
    .map((p, i) => {
      // Determine if home team has possession
      const homeId = plays[0]?.start?.team?.id;
      const isHomePoss =
        p.start?.pos_team?.id != null &&
        String(p.start.pos_team.id) === String(homeId);

      // wp_before is from pos_team perspective; convert to home perspective
      const rawWP = p.winProbability!.before!;
      const homeWP = isHomePoss ? rawWP * 100 : (1 - rawWP) * 100;

      return {
        play: i + 1,
        homeWP,
        text: p.text ?? "",
        period: p.period,
        clock: p.clock?.displayValue ?? "",
      };
    });

  // If we have ESPN WP data, prefer it (already in home perspective)
  const chartData =
    espnWP.length > 0
      ? espnWP.map((wp, i) => ({
          play: i + 1,
          homeWP: wp.homeWinPercentage * 100,
          text: "",
          period: null as number | null,
          clock: "",
        }))
      : data;

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        No win probability data available.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="h-[200px] sm:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="homeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={homeColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={homeColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="play"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}%`}
            width={45}
          />
          <ReferenceLine
            y={50}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: 12,
            }}
            formatter={(value: unknown) => [`${Number(value).toFixed(1)}%`, `${homeAbbr} WP`]}
            labelFormatter={(label: unknown) => `Play ${label}`}
          />
          <Area
            type="monotone"
            dataKey="homeWP"
            stroke={homeColor}
            fill="url(#homeGrad)"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 text-xs text-muted-foreground mt-1">
        <span>
          <span
            className="mr-1 inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: homeColor }}
          />
          {homeAbbr}
        </span>
        <span>
          <span
            className="mr-1 inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: awayColor }}
          />
          {awayAbbr}
        </span>
      </div>
    </div>
  );
}
