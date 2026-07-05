import type { ValueGrade } from "@/lib/intelligence";
import { fmtCpp } from "@/lib/intelligence";

export type DaySummary = { cpp: number; grade: ValueGrade; count: number };

const GRADE_BG: Record<ValueGrade, string> = {
  exceptional: "bg-emerald-500/25 border-emerald-500/50 hover:border-emerald-400",
  great: "bg-gold/20 border-gold/50 hover:border-gold",
  fair: "bg-muted/60 border-border hover:border-gold/40",
  skip: "bg-destructive/10 border-destructive/20 hover:border-destructive/40",
};

const GRADE_TEXT: Record<ValueGrade, string> = {
  exceptional: "text-emerald-300",
  great: "text-gold",
  fair: "text-muted-foreground",
  skip: "text-destructive/70",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Calendar heatmap of best award value per day for one month.
 * `days` maps YYYY-MM-DD -> best-result summary; absent keys render empty.
 */
export function MonthHeatmap({
  monthStart, // YYYY-MM-01
  days,
  onPickDate,
  onMonthChange,
  canPrev,
  canNext,
  loading,
}: {
  monthStart: string;
  days: Record<string, DaySummary | undefined>;
  onPickDate: (date: string) => void;
  onMonthChange: (delta: 1 | -1) => void;
  canPrev: boolean;
  canNext: boolean;
  loading?: boolean;
}) {
  const first = new Date(monthStart + "T00:00:00");
  const year = first.getFullYear();
  const month = first.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first offset: JS getDay() is 0=Sun.
  const leadingBlanks = (first.getDay() + 6) % 7;
  const today = new Date().toISOString().slice(0, 10);

  const monthLabel = first.toLocaleDateString([], { month: "long", year: "numeric" });

  const cells: Array<{ date: string; day: number } | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
      return { date: d, day: i + 1 };
    }),
  ];

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => onMonthChange(-1)}
          disabled={!canPrev || loading}
          aria-label="Previous month"
          className="size-8 rounded-full border border-border text-muted-foreground hover:text-gold hover:border-gold/50 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ←
        </button>
        <div className="font-display text-xl">{monthLabel}</div>
        <button
          type="button"
          onClick={() => onMonthChange(1)}
          disabled={!canNext || loading}
          aria-label="Next month"
          className="size-8 rounded-full border border-border text-muted-foreground hover:text-gold hover:border-gold/50 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center mb-1.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground py-1">
            {w}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 gap-1.5 ${loading ? "opacity-50 animate-pulse" : ""}`}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={`blank-${i}`} />;
          const summary = days[cell.date];
          const past = cell.date < today;
          if (past || !summary) {
            return (
              <div
                key={cell.date}
                className={`aspect-square rounded-lg border border-border/40 grid place-items-center text-xs ${
                  past ? "opacity-30 text-muted-foreground" : "text-muted-foreground/60"
                }`}
              >
                {cell.day}
              </div>
            );
          }
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onPickDate(cell.date)}
              title={`${cell.date} · best ${fmtCpp(summary.cpp)} · ${summary.count} option${summary.count === 1 ? "" : "s"}`}
              className={`aspect-square rounded-lg border transition grid place-items-center ${GRADE_BG[summary.grade]}`}
            >
              <span className="leading-tight">
                <span className="block text-xs text-foreground">{cell.day}</span>
                <span className={`block text-[9px] font-mono ${GRADE_TEXT[summary.grade]}`}>
                  {summary.cpp.toFixed(1)}¢
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <Legend className="bg-emerald-500/40" label="Exceptional" />
        <Legend className="bg-gold/50" label="Great" />
        <Legend className="bg-muted" label="Fair" />
        <Legend className="bg-destructive/30" label="Skip" />
        <span className="ml-auto normal-case tracking-normal">Tap a day to see its itineraries</span>
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2.5 rounded-sm ${className}`} />
      {label}
    </span>
  );
}
