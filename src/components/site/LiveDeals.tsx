import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { getLiveDeals, type LiveDeal } from "@/lib/awards/deals.functions";
import { getProgram } from "@/lib/programs";

const CABIN_LABEL: Record<string, string> = {
  economy: "Economy",
  premium: "Premium",
  business: "Business",
  first: "First",
};

/**
 * "Deals right now" — the cheapest live award finds on popular AU corridors.
 * Every card is a real seat from the last scan, not marketing copy. Tapping
 * one runs the search for that route around the deal's date.
 */
export function LiveDeals({
  onPick,
}: {
  onPick: (deal: { from: string; to: string; date: string }) => void;
}) {
  const [deals, setDeals] = useState<LiveDeal[] | null>(null);

  useEffect(() => {
    let alive = true;
    getLiveDeals()
      .then((res) => {
        if (alive) setDeals(res.deals);
      })
      .catch(() => {
        if (alive) setDeals([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Quietly render nothing until we have real finds — no skeleton churn on
  // the marketing fold, and no empty-state noise if the scan fails.
  if (!deals || deals.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 pb-4" aria-label="Live award deals">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5">
          <Flame className="size-3.5 text-gold" aria-hidden="true" />
          Deals right now
        </h2>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Real seats · refreshed every 30 min
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {deals.map((d) => {
          const p = getProgram(d.programId);
          return (
            <button
              key={`${d.from}${d.to}`}
              type="button"
              onClick={() => onPick({ from: d.from, to: d.to, date: d.date })}
              className="shrink-0 w-52 text-left rounded-lg border border-border bg-card/60 p-4 hover:border-border-strong transition group"
              title={`Search ${d.from} → ${d.to} around ${d.date}`}
            >
              <div className="font-display text-lg tracking-wide">
                {d.from} <span className="text-gold">→</span> {d.to}
              </div>
              <div className="mt-2 font-mono tabular-nums text-xl text-foreground group-hover:text-gold transition">
                {d.miles.toLocaleString()}
                <span className="text-xs text-muted-foreground font-sans"> pts</span>
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                {CABIN_LABEL[d.cabin] ?? d.cabin} · {p?.short ?? d.programName}
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground tabular-nums">
                {new Date(d.date + "T00:00:00").toLocaleDateString([], {
                  day: "numeric",
                  month: "short",
                })}
                {d.seats > 0 && ` · ${d.seats} seat${d.seats > 1 ? "s" : ""}`}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
