import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { PlayDetail } from "@/types";

function formatEPA(epa: number | null | undefined): string {
  if (epa == null) return "-";
  return epa >= 0 ? `+${epa.toFixed(2)}` : epa.toFixed(2);
}

function epaColor(epa: number | null | undefined): string {
  if (epa == null) return "";
  if (epa > 0) return "text-green-400";
  if (epa < 0) return "text-red-400";
  return "";
}

function formatWP(wp: number | null | undefined): string {
  if (wp == null) return "-";
  return `${(wp * 100).toFixed(1)}%`;
}

function quarterLabel(period: number | null | undefined): string {
  if (period == null) return "-";
  if (period <= 4) return `Q${period}`;
  return `OT${period - 4}`;
}

export function PlayByPlayTable({ plays }: { plays: PlayDetail[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: plays.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 20,
  });

  if (plays.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No plays available.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header — hide WP on mobile */}
      <div className="grid grid-cols-[50px_60px_80px_1fr_70px] sm:grid-cols-[60px_70px_100px_1fr_80px_80px] gap-2 bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
        <div>Qtr</div>
        <div>Clock</div>
        <div>Down & Dist</div>
        <div>Description</div>
        <div className="text-right">EPA</div>
        <div className="text-right hidden sm:block">WP</div>
      </div>

      {/* Virtualized rows */}
      <div
        ref={parentRef}
        className="max-h-[600px] overflow-auto"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const play = plays[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                className="absolute left-0 right-0 grid grid-cols-[50px_60px_80px_1fr_70px] sm:grid-cols-[60px_70px_100px_1fr_80px_80px] gap-2 border-b border-border px-3 py-2 text-sm hover:bg-accent/30 transition-colors"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="text-muted-foreground">
                  {quarterLabel(play.period)}
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {play.clock?.displayValue ?? "-"}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {play.start?.shortDownDistanceText ?? play.start?.downDistanceText ?? "-"}
                </div>
                <div className="text-foreground line-clamp-2 sm:truncate">
                  {play.text ?? "-"}
                </div>
                <div
                  className={`text-right font-mono text-xs font-medium ${epaColor(play.expectedPoints?.added)}`}
                >
                  {formatEPA(play.expectedPoints?.added)}
                </div>
                <div className="text-right font-mono text-xs text-muted-foreground hidden sm:block">
                  {formatWP(play.winProbability?.after)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
