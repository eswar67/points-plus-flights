import { X, Trophy, Sparkles, Check } from "lucide-react";
import type { AwardItinerary } from "@/lib/awards/types";
import { PROGRAMS } from "@/lib/programs";
import {
  calcCppAud,
  gradeCpp,
  confidenceFor,
  fareEstimateAud,
  fmtAud,
  effectiveBalances,
  annotateSweetSpots,
  type RankedItinerary,
} from "@/lib/intelligence";

type MetricDir = "high" | "low";

function fmtHrs(min: number) {
  if (!min) return "—";
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso.slice(0, 10) + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

export function CompareModal({
  items,
  onClose,
  onRemove,
  balances = {},
  pax = 1,
}: {
  items: AwardItinerary[];
  onClose: () => void;
  onRemove: (id: string) => void;
  balances?: Record<string, number>;
  pax?: number;
}) {
  // Enrich items with sweet-spot data (comparing within just the selection is
  // fine — the sweet-spot detector is robust to small sets and downgrades to
  // baseline detection when there's no meaningful median).
  const ranked: RankedItinerary[] = items.map((a) => {
    const cpp = calcCppAud(a);
    return {
      ...a,
      cpp,
      grade: gradeCpp(cpp, a.cabin),
      confidence: confidenceFor(a).score,
    } as RankedItinerary;
  });
  const enriched = annotateSweetSpots(ranked);

  const hasBal = Object.keys(balances).length > 0;
  const reach = hasBal ? effectiveBalances(balances) : {};

  // ── Metric rows ───────────────────────────────────────────────────────
  type Row = {
    label: string;
    dir?: MetricDir;
    values: (string | number)[];
    raw: number[]; // for winner detection
    render?: (v: string | number, isWinner: boolean) => React.ReactNode;
  };

  const cashPer = enriched.map((a) => fareEstimateAud(a.from, a.to, a.cabin) * pax);
  const taxesAud = enriched.map((a) => a.taxesUsd * 1.55);
  const cashSaved = enriched.map((_, i) => Math.max(0, cashPer[i] - taxesAud[i]));

  const rows: Row[] = [
    {
      label: "Points required",
      dir: "low",
      values: enriched.map((a) => `${a.miles.toLocaleString()} pts`),
      raw: enriched.map((a) => a.miles),
    },
    {
      label: "Taxes / fees",
      dir: "low",
      values: enriched.map((a) => `US$${Math.round(a.taxesUsd)}`),
      raw: enriched.map((a) => a.taxesUsd),
    },
    {
      label: "Value (¢ / pt)",
      dir: "high",
      values: enriched.map((a) => `${a.cpp.toFixed(2)}¢`),
      raw: enriched.map((a) => a.cpp),
    },
    {
      label: "Cash equivalent",
      dir: "high",
      values: cashPer.map((c) => fmtAud(c)),
      raw: cashPer,
    },
    {
      label: "Est. cash saved",
      dir: "high",
      values: cashSaved.map((c) => (c > 0 ? fmtAud(c) : "—")),
      raw: cashSaved,
    },
    {
      label: "Sweet-spot discount",
      dir: "high",
      values: enriched.map((a) =>
        a.isSweetSpot
          ? `${Math.round(a.discountPct * 100)}% below typical`
          : a.savingsMiles > 0
            ? `${a.savingsMiles.toLocaleString()} pts under`
            : "Typical rate",
      ),
      raw: enriched.map((a) => a.discountPct || 0),
    },
    {
      label: "Seats available",
      dir: "high",
      values: enriched.map((a) => (a.seats > 0 ? `${a.seats}` : "Confirmed")),
      raw: enriched.map((a) => a.seats),
    },
    {
      label: "Duration",
      dir: "low",
      values: enriched.map((a) => fmtHrs(a.durationMin || 0)),
      raw: enriched.map((a) => a.durationMin || Number.POSITIVE_INFINITY),
    },
    {
      label: "Stops",
      dir: "low",
      values: enriched.map((a) =>
        a.direct || a.stops === 0 ? "Nonstop" : `${a.stops} stop${a.stops === 1 ? "" : "s"}`,
      ),
      raw: enriched.map((a) => a.stops),
    },
    {
      label: "Freshness",
      dir: "low",
      values: enriched.map((a) => {
        const c = confidenceFor(a);
        return `${c.label} · ${c.ageMin < 60 ? `${c.ageMin}m` : `${Math.round(c.ageMin / 60)}h`}`;
      }),
      raw: enriched.map((a) => confidenceFor(a).ageMin),
    },
  ];

  if (hasBal) {
    rows.push({
      label: "Bookability",
      dir: "high",
      values: enriched.map((a) => {
        const direct = balances[a.programId] ?? 0;
        const total = reach[a.programId]?.total ?? direct;
        if (direct >= a.miles) return "Book direct";
        if (total >= a.miles) return "Via transfer";
        return `Short ${(a.miles - total).toLocaleString()}`;
      }),
      raw: enriched.map((a) => {
        const direct = balances[a.programId] ?? 0;
        const total = reach[a.programId]?.total ?? direct;
        if (direct >= a.miles) return 2;
        if (total >= a.miles) return 1;
        return 0;
      }),
    });
  }

  function winners(raw: number[], dir?: MetricDir): boolean[] {
    if (!dir || raw.length === 0) return raw.map(() => false);
    const finite = raw.filter((v) => Number.isFinite(v));
    if (finite.length === 0) return raw.map(() => false);
    const target = dir === "high" ? Math.max(...finite) : Math.min(...finite);
    // Only mark a winner if there is a real gap between best and worst
    const worst = dir === "high" ? Math.min(...finite) : Math.max(...finite);
    if (target === worst) return raw.map(() => false);
    return raw.map((v) => Number.isFinite(v) && v === target);
  }

  // Overall "best pick" score — sweet spot first, then CPP, then miles.
  const overallScores = enriched.map(
    (a) => Number(a.isSweetSpot) * 100 + a.cpp * 10 - a.miles / 100000,
  );
  const bestIdx = overallScores.indexOf(Math.max(...overallScores));

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="Compare itineraries"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-3 md:p-8 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-5xl max-h-[92vh] rounded-lg border border-border bg-card shadow-elevated flex flex-col animate-scale-in overflow-hidden">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 border-b border-border sm:flex sm:flex-wrap">
            <div className="flex min-w-0 items-center gap-2">
              <Sparkles className="size-4 shrink-0 text-gold" />
              <h2 className="truncate font-display text-lg md:text-xl">
                Compare itineraries
              </h2>
              <span className="hidden sm:inline text-xs uppercase tracking-widest text-muted-foreground shrink-0">
                {enriched.length} selected
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-1.5 hover:bg-muted/50 transition"
              aria-label="Close comparison"
            >
              <X className="size-4" />
            </button>
          </header>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead className="sticky top-0 bg-card z-10">
                <tr>
                  <th className="text-left align-bottom p-3 border-b border-border w-40 md:w-52 text-[10px] uppercase tracking-widest text-muted-foreground font-normal">
                    Metric
                  </th>
                  {enriched.map((a, i) => {
                    const p = PROGRAMS.find((x) => x.id === a.programId);
                    const accent = p?.accent ?? "#c9a84c";
                    const isBest = i === bestIdx;
                    return (
                      <th
                        key={a.id}
                        className={`align-bottom p-3 border-b text-left ${
                          isBest
                            ? "border-gold/60 bg-gradient-to-b from-gold/10 to-transparent"
                            : "border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {isBest && (
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-gold mb-1">
                                <Trophy className="size-3" /> Best pick
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span
                                className="size-1.5 rounded-full shrink-0"
                                style={{ background: accent }}
                              />
                              <span className="truncate">{p?.name ?? a.programName}</span>
                            </div>
                            <div className="font-display text-sm mt-1 tabular-nums">
                              {a.from} → {a.to}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {a.carrier}
                              {a.flightNo ? ` · ${a.flightNo}` : ""}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {fmtDate(a.depart)} · {a.cabin}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemove(a.id)}
                            className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                            aria-label="Remove from comparison"
                            title="Remove"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const wins = winners(row.raw, row.dir);
                  return (
                    <tr key={row.label} className="hover:bg-muted/10 transition">
                      <td className="p-3 border-b border-border-soft text-xs uppercase tracking-widest text-muted-foreground">
                        {row.label}
                      </td>
                      {row.values.map((v, i) => {
                        const isWinner = wins[i];
                        return (
                          <td
                            key={i}
                            className={`p-3 border-b border-border-soft tabular-nums ${
                              isWinner
                                ? "bg-gold/5 text-gold font-medium"
                                : "text-foreground/90"
                            }`}
                          >
                            <span className="inline-flex items-center gap-1.5">
                              {isWinner && <Check className="size-3.5" />}
                              {v}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <footer className="px-5 py-3 border-t border-border text-[11px] text-muted-foreground">
            Gold rows highlight the leader per metric. Cash and savings are indicative
            AUD estimates based on route benchmark fares.
          </footer>
        </div>
      </div>
    </>
  );
}