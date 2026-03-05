import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlayDetail } from "@/types";

interface TeamAggregates {
  totalPlays: number;
  totalEPA: number;
  epaPerPlay: number;
  passPlays: number;
  rushPlays: number;
  passEPA: number;
  rushEPA: number;
  successRate: number;
  scoringPlays: number;
}

function aggregate(plays: PlayDetail[], teamId: string | number): TeamAggregates {
  const teamPlays = plays.filter(
    (p) =>
      p.start?.pos_team?.id != null &&
      String(p.start.pos_team.id) === String(teamId) &&
      p.type?.text !== "End Period" &&
      p.type?.text !== "End of Half" &&
      p.type?.text !== "End of Game" &&
      p.type?.text !== "Timeout" &&
      p.type?.text !== "Two-minute warning" &&
      p.type?.text !== "Official Timeout"
  );

  const withEPA = teamPlays.filter((p) => p.expectedPoints?.added != null);
  const totalEPA = withEPA.reduce((s, p) => s + (p.expectedPoints!.added ?? 0), 0);

  const passPlays = teamPlays.filter(
    (p) =>
      p.type?.text?.includes("Pass") ||
      p.type?.text === "Sack" ||
      p.type?.text?.includes("Interception")
  );
  const rushPlays = teamPlays.filter((p) => p.type?.text === "Rush");

  const passEPA = passPlays.reduce((s, p) => s + (p.expectedPoints?.added ?? 0), 0);
  const rushEPA = rushPlays.reduce((s, p) => s + (p.expectedPoints?.added ?? 0), 0);

  const successPlays = withEPA.filter((p) => (p.expectedPoints!.added ?? 0) > 0);

  return {
    totalPlays: teamPlays.length,
    totalEPA,
    epaPerPlay: teamPlays.length > 0 ? totalEPA / teamPlays.length : 0,
    passPlays: passPlays.length,
    rushPlays: rushPlays.length,
    passEPA,
    rushEPA,
    successRate: withEPA.length > 0 ? successPlays.length / withEPA.length : 0,
    scoringPlays: teamPlays.filter((p) => p.scoringPlay).length,
  };
}

function StatRow({
  label,
  home,
  away,
  format = "number",
}: {
  label: string;
  home: number;
  away: number;
  format?: "number" | "epa" | "percent";
}) {
  const fmt = (v: number) => {
    if (format === "epa") return v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
    if (format === "percent") return `${(v * 100).toFixed(1)}%`;
    return String(v);
  };

  const color = (v: number) => {
    if (format !== "epa") return "";
    return v > 0 ? "text-green-400" : v < 0 ? "text-red-400" : "";
  };

  return (
    <TableRow>
      <TableCell className={`text-right font-mono ${color(away)}`}>
        {fmt(away)}
      </TableCell>
      <TableCell className="text-center text-muted-foreground text-xs font-medium">
        {label}
      </TableCell>
      <TableCell className={`font-mono ${color(home)}`}>{fmt(home)}</TableCell>
    </TableRow>
  );
}

export function BoxScore({
  plays,
  homeTeamId,
  awayTeamId,
  homeAbbr,
  awayAbbr,
}: {
  plays: PlayDetail[];
  homeTeamId: string;
  awayTeamId: string;
  homeAbbr: string;
  awayAbbr: string;
}) {
  const home = aggregate(plays, homeTeamId);
  const away = aggregate(plays, awayTeamId);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right w-24">{awayAbbr}</TableHead>
          <TableHead className="text-center">Stat</TableHead>
          <TableHead className="w-24">{homeAbbr}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <StatRow label="Total Plays" home={home.totalPlays} away={away.totalPlays} />
        <StatRow label="Total EPA" home={home.totalEPA} away={away.totalEPA} format="epa" />
        <StatRow label="EPA/Play" home={home.epaPerPlay} away={away.epaPerPlay} format="epa" />
        <StatRow label="Pass Plays" home={home.passPlays} away={away.passPlays} />
        <StatRow label="Pass EPA" home={home.passEPA} away={away.passEPA} format="epa" />
        <StatRow label="Rush Plays" home={home.rushPlays} away={away.rushPlays} />
        <StatRow label="Rush EPA" home={home.rushEPA} away={away.rushEPA} format="epa" />
        <StatRow
          label="Success Rate"
          home={home.successRate}
          away={away.successRate}
          format="percent"
        />
      </TableBody>
    </Table>
  );
}
