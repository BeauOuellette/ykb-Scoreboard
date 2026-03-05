import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PlayDetail } from "@/types";

function formatEPA(epa: number): string {
  return epa >= 0 ? `+${epa.toFixed(2)}` : epa.toFixed(2);
}

function wpSwing(play: PlayDetail): string | null {
  const before = play.winProbability?.before;
  const after = play.winProbability?.after;
  if (before == null || after == null) return null;
  const diff = (after - before) * 100;
  return diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
}

function quarterLabel(period: number | null | undefined): string {
  if (period == null) return "";
  if (period <= 4) return `Q${period}`;
  return `OT${period - 4}`;
}

export function KeyPlays({ plays }: { plays: PlayDetail[] }) {
  const keyPlays = plays
    .filter((p) => p.expectedPoints?.added != null && Math.abs(p.expectedPoints.added) > 2.0)
    .sort((a, b) => Math.abs(b.expectedPoints!.added!) - Math.abs(a.expectedPoints!.added!))
    .slice(0, 10);

  if (keyPlays.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No key plays (|EPA| &gt; 2.0) found.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {keyPlays.map((play, i) => {
        const epa = play.expectedPoints!.added!;
        const isPositive = epa > 0;
        const swing = wpSwing(play);

        return (
          <Card key={play.id ?? i}>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <Badge
                  variant={isPositive ? "default" : "destructive"}
                  className="shrink-0 font-mono text-xs"
                >
                  {formatEPA(epa)} EPA
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">
                    {quarterLabel(play.period)} {play.clock?.displayValue}{" "}
                    {play.start?.shortDownDistanceText && `· ${play.start.shortDownDistanceText}`}
                  </div>
                  <div className="text-sm">{play.text}</div>
                </div>
                {swing && (
                  <span className="text-xs font-mono text-muted-foreground shrink-0">
                    WP {swing}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
