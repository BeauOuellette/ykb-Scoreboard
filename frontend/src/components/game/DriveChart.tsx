import { Card, CardContent } from "@/components/ui/card";

interface Drive {
  id: string;
  description: string;
  team: {
    abbreviation: string;
    logos?: Array<{ href: string }>;
  };
  start: { yardLine: number; text: string };
  end: { yardLine: number; text: string };
  yards: number;
  isScore: boolean;
  result: string;
  shortDisplayResult: string;
}

interface DriveChartProps {
  drives: Drive[];
  homeAbbr: string;
  awayAbbr: string;
  homeColor: string;
  awayColor: string;
}

function resultIcon(result: string): string {
  const r = result?.toUpperCase() ?? "";
  if (r === "TD" || r === "TOUCHDOWN") return "\uD83C\uDFC8";
  if (r === "FG" || r === "FIELD GOAL") return "3";
  if (r === "PUNT") return "P";
  if (r.includes("INT") || r.includes("FUMBLE") || r === "TURNOVER" || r === "DOWNS" || r === "TURNOVER ON DOWNS")
    return "T";
  if (r === "END OF HALF" || r === "END OF GAME") return "\u23F9";
  if (r === "SAFETY") return "S";
  if (r === "MISSED FG") return "\u2717";
  return r.slice(0, 2);
}

export function DriveChart({
  drives,
  homeAbbr,
  homeColor,
  awayColor,
}: DriveChartProps) {
  if (!drives || drives.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No drive data available.
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-1.5">
        {drives.map((drive) => {
          const isHome = drive.team.abbreviation === homeAbbr;
          const color = isHome ? homeColor : awayColor;

          // yardLine is 0-100 from own endzone. start.yardLine=65 means team started at own 35.
          // Drive width proportional to yards gained (cap at 100)
          const barWidth = Math.max(Math.min(Math.abs(drive.yards), 100), 4);

          return (
            <div key={drive.id} className="flex items-center gap-2 text-sm">
              <span className="w-10 text-right font-semibold text-xs shrink-0">
                {drive.team.abbreviation}
              </span>
              <div className="flex-1 h-6 bg-muted/30 rounded relative overflow-hidden">
                <div
                  className="h-full rounded flex items-center justify-end px-1.5 text-xs font-bold text-white transition-all"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: color,
                    minWidth: "2rem",
                  }}
                >
                  {resultIcon(drive.shortDisplayResult || drive.result)}
                </div>
              </div>
              <span className="w-16 text-xs text-muted-foreground truncate shrink-0">
                {drive.yards}yd, {drive.shortDisplayResult || drive.result}
              </span>
            </div>
          );
        })}

        <div className="flex justify-between text-xs text-muted-foreground mt-2 px-12">
          <span>Own Endzone</span>
          <span>Opp Endzone</span>
        </div>
      </CardContent>
    </Card>
  );
}
