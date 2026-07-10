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