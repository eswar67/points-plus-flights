import type { Cabin } from "./awards/types";
import type { RankedItinerary } from "./intelligence";
import { fareEstimateAud, taxesAudFromUsd } from "./intelligence";

export type ConciergeTone = "great" | "good" | "fair" | "skip";
export type Concierge = { headline: string; tone: ConciergeTone };

/**
 * Plain-English one-liner for a redemption. Derived from the existing
 * grade + benchmark fare — no new data. Rounds savings to the nearest $100
 * so the copy reads like advice, not a spreadsheet.
 */
export function conciergeFor(a: RankedItinerary): Concierge {
  const fare = fareEstimateAud(a.from, a.to, a.cabin) * (a.pax || 1);
  const taxesAud = taxesAudFromUsd(a.taxesUsd);
  const rawSave = fare - taxesAud;
  const save = rawSave > 200 ? Math.round(rawSave / 100) * 100 : 0;
  const saveStr = save.toLocaleString("en-AU");
  switch (a.grade) {
    case "exceptional":
      return {
        tone: "great",
        headline: save ? `Excellent deal — save ~A$${saveStr} vs cash` : "Excellent value",
      };
    case "great":
      return {
        tone: "good",
        headline: save ? `Great deal — save ~A$${saveStr} vs cash` : "Great value",
      };
    case "fair":
      return { tone: "fair", headline: "Fair value — worth a look" };
    default:
      return { tone: "skip", headline: "Only if you're flexible" };
  }
}

export const CABIN_LONG: Record<Cabin, string> = {
  economy: "Economy",
  premium: "Premium Economy",
  business: "Business",
  first: "First",
};

export const CABIN_BLURB: Record<Cabin, string> = {
  economy: "Stretch your points on shorter trips or bring the whole family along.",
  premium: "A little extra comfort on long-haul without going all in.",
  business: "Lie-flat comfort — the sweet spot most travellers dream about.",
  first: "The top of the pyramid — rare, but unforgettable when you find it.",
};

export type DealReason = { label: string; detail: string };

/**
 * Explain why a top pick leads its cabin, by comparing it against peers on the
 * same cabin. Returns 2–4 short bullets suitable for an expandable panel.
 */
export function explainTopPick<T extends RankedItinerary & { isSweetSpot?: boolean; discountPct?: number }>(
  top: T,
  peers: T[],
): DealReason[] {
  const others = peers.filter((p) => p !== top);
  const reasons: DealReason[] = [];

  // 1) Value (cents per point)
  const cppPeers = others.map((p) => p.cpp).filter((n) => Number.isFinite(n));
  const maxPeerCpp = cppPeers.length ? Math.max(...cppPeers) : 0;
  if (top.cpp > 0) {
    if (top.cpp >= maxPeerCpp) {
      reasons.push({
        label: "Best value in this cabin",
        detail: `Each point returns ${top.cpp.toFixed(2)}¢ of airfare${
          maxPeerCpp > 0 ? ` — better than the next option at ${maxPeerCpp.toFixed(2)}¢` : ""
        }.`,
      });
    } else {
      reasons.push({
        label: `Solid value at ${top.cpp.toFixed(2)}¢ / pt`,
        detail: `Ranked ahead on the overall balance of points, taxes, seats and routing.`,
      });
    }
  }

  // 2) Sweet spot vs typical baseline
  if (top.isSweetSpot && top.discountPct && top.baselineMiles) {
    reasons.push({
      label: `Sweet spot — ${Math.round(top.discountPct * 100)}% below typical`,
      detail: `Most ${top.cabin} redemptions on this route cost around ${top.baselineMiles.toLocaleString()} pts. This one prices well below that band.`,
    });
  }

  // 3) Points delta vs cheapest peer
  const cheapestPeer = others.length ? Math.min(...others.map((p) => p.miles)) : 0;
  if (cheapestPeer > 0) {
    if (top.miles <= cheapestPeer) {
      reasons.push({
        label: "Fewest points required",
        detail: `${top.miles.toLocaleString()} pts — the lowest ask across the ${top.cabin} results.`,
      });
    } else {
      const diff = top.miles - cheapestPeer;
      reasons.push({
        label: "Worth the extra points",
        detail: `Costs ${diff.toLocaleString()} more pts than the cheapest option, but wins on value, taxes or routing.`,
      });
    }
  }

  // 4) Cash taxes advantage
  const taxPeers = others.map((p) => p.taxesUsd).filter((n) => Number.isFinite(n));
  const minPeerTax = taxPeers.length ? Math.min(...taxPeers) : Infinity;
  if (top.taxesUsd <= minPeerTax && others.length > 0) {
    reasons.push({
      label: "Lowest cash out-of-pocket",
      detail: `About A$${Math.round(top.taxesUsd * 1.55).toLocaleString()} in taxes and carrier surcharges — the smallest in this cabin.`,
    });
  }

  // 5) Routing / seat perks
  if (top.direct || top.stops === 0) {
    reasons.push({
      label: "Nonstop routing",
      detail: "One flight, no connections — worth a small premium on long-haul.",
    });
  }
  if (top.seats >= 2) {
    reasons.push({
      label: `${top.seats} seats available`,
      detail: "Enough inventory to bring a companion on the same booking.",
    });
  }

  // Cap at 4 reasons so the panel stays scannable.
  return reasons.slice(0, 4);
}