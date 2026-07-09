import { Sparkles, TrendingUp } from "lucide-react";
import type { RankedItinerary } from "@/lib/intelligence";
import type { SweetSpotInfo } from "@/lib/intelligence";
import { fareEstimateAud, fmtAud } from "@/lib/intelligence";

type Enriched = RankedItinerary & SweetSpotInfo;

/**
 * Picks the single most compelling itinerary from the currently visible set
 * and explains, in one sentence, WHY it's the customer's best bet.
 */
export function TopPickBanner({ items, pax }: { items: Enriched[]; pax: number }) {
  if (!items || items.length === 0) return null;

  // Score: sweet spots first, then CPP, then miles.
  const pick = [...items].sort(
    (a, b) =>
      Number(b.isSweetSpot) - Number(a.isSweetSpot) ||
      b.cpp - a.cpp ||
      a.miles - b.miles,
  )[0];

  const cash = fareEstimateAud(pick.from, pick.to, pick.cabin) * pax;
  const taxesAud = pick.taxesUsd * 1.55; // rough USD→AUD, purely indicative
  const cashSaved = Math.max(0, cash - taxesAud);

  const reason = pick.isSweetSpot
    ? `Sweet spot — ${Math.round(pick.discountPct * 100)}% under the typical ${pick.cabin} rate.`
    : pick.cpp >= 2.5
      ? `Exceptional value at ${pick.cpp.toFixed(1)}¢ per point.`
      : `Best value we found — ${pick.cpp.toFixed(1)}¢ per point.`;

  return (
    <div className="mb-4 relative overflow-hidden rounded-lg border border-gold/40 bg-gradient-to-br from-gold/10 via-card to-background p-5 animate-fade-in">
      <div className="absolute -top-16 -right-16 size-48 rounded-full bg-gold/20 blur-3xl pointer-events-none" />
      <div className="relative flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 text-gold border border-gold/40 px-2.5 py-1 text-[10px] uppercase tracking-widest">
            <Sparkles className="size-3" />
            Top pick
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg md:text-xl">
            {pick.programName} ·{" "}
            <span className="tabular-nums">{pick.miles.toLocaleString()}</span>{" "}
            <span className="text-muted-foreground text-sm">pts</span>
            <span className="text-muted-foreground text-sm"> · </span>
            <span className="text-muted-foreground text-sm tabular-nums">
              +US${Math.round(pick.taxesUsd)} taxes
            </span>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {reason}
            {cashSaved > 300 ? (
              <span className="text-foreground">
                {" "}Save ~
                <span className="text-gold font-medium tabular-nums">{fmtAud(cashSaved)}</span>{" "}
                vs cash.
              </span>
            ) : null}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 shrink-0 text-xs uppercase tracking-widest text-gold">
          <TrendingUp className="size-3.5" />
          {pick.cpp.toFixed(1)}¢ / pt
        </div>
      </div>
    </div>
  );
}