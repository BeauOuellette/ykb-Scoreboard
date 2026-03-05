interface WeekSelectorProps {
  week: number | undefined;
  season: number | undefined;
  seasontype: number | undefined;
  onChange: (params: {
    week?: number;
    season?: number;
    seasontype?: number;
  }) => void;
}

const WEEKS = Array.from({ length: 18 }, (_, i) => i + 1);
const SEASONS = [2025, 2024, 2023, 2022];
const SEASON_TYPES = [
  { value: 1, label: "Preseason" },
  { value: 2, label: "Regular Season" },
  { value: 3, label: "Postseason" },
];

export function WeekSelector({
  week,
  season,
  seasontype,
  onChange,
}: WeekSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
      <select
        value={season ?? ""}
        onChange={(e) =>
          onChange({
            week,
            season: e.target.value ? Number(e.target.value) : undefined,
            seasontype,
          })
        }
        className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
      >
        <option value="">Season</option>
        {SEASONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={seasontype ?? ""}
        onChange={(e) =>
          onChange({
            week,
            season,
            seasontype: e.target.value ? Number(e.target.value) : undefined,
          })
        }
        className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
      >
        <option value="">Type</option>
        {SEASON_TYPES.map((st) => (
          <option key={st.value} value={st.value}>
            {st.label}
          </option>
        ))}
      </select>

      <select
        value={week ?? ""}
        onChange={(e) =>
          onChange({
            week: e.target.value ? Number(e.target.value) : undefined,
            season,
            seasontype,
          })
        }
        className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
      >
        <option value="">Week</option>
        {WEEKS.map((w) => (
          <option key={w} value={w}>
            Week {w}
          </option>
        ))}
      </select>
    </div>
  );
}
