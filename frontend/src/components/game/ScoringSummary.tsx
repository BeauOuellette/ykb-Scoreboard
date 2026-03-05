import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ScoringPlay {
  id: string;
  type: { id: string; text: string; abbreviation: string };
  text: string;
  awayScore: number;
  homeScore: number;
  period: { number: number };
  clock: { displayValue: string };
  team: {
    abbreviation: string;
    displayName: string;
    logos?: Array<{ href: string }>;
  };
  scoringType?: { abbreviation: string };
}

function quarterLabel(num: number): string {
  if (num <= 4) return `Q${num}`;
  return `OT${num - 4}`;
}

export function ScoringSummary({
  scoringPlays,
  homeAbbr,
  awayAbbr,
}: {
  scoringPlays: ScoringPlay[];
  homeAbbr: string;
  awayAbbr: string;
}) {
  if (!scoringPlays || scoringPlays.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Scoring Summary
        </h3>
        <div className="space-y-2">
          {scoringPlays.map((sp) => {
            const logo = sp.team?.logos?.[0]?.href;
            return (
              <div
                key={sp.id}
                className="flex items-start gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent/30 transition-colors"
              >
                <Badge variant="outline" className="shrink-0 text-xs font-mono w-16 justify-center">
                  {quarterLabel(sp.period.number)} {sp.clock.displayValue}
                </Badge>
                <div className="flex items-center gap-2 shrink-0">
                  {logo && (
                    <img src={logo} alt={sp.team.abbreviation} className="h-5 w-5" />
                  )}
                  <span className="font-semibold w-9">{sp.team.abbreviation}</span>
                </div>
                <span className="text-muted-foreground flex-1 min-w-0 truncate sm:whitespace-normal sm:overflow-visible">
                  {sp.text}
                </span>
                <span className="font-mono text-xs font-bold shrink-0 ml-auto">
                  {awayAbbr} {sp.awayScore} – {homeAbbr} {sp.homeScore}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
