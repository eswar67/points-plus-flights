import { createServerFn } from "@tanstack/react-start";
import { getAwardProvider } from "./provider.server";
import type { Cabin } from "./types";

/**
 * Live deals strip: the cheapest real award finds on popular ex-Australia
 * corridors over the next few weeks. Unlike marketing carousels, every card
 * here is a seat that actually existed at scan time.
 *
 * Calls the provider directly (not searchAwards) so the homepage strip never
 * consumes a visitor's per-IP search allowance, and caches for 30 minutes so
 * a busy homepage costs at most PRESET_ROUTES.length upstream calls per
 * half-hour per isolate.
 */

export type LiveDeal = {
  from: string;
  to: string;
  miles: number;
  taxesUsd: number;
  cabin: Cabin;
  programId: string;
  programName: string;
  date: string; // YYYY-MM-DD of the cheapest find
  seats: number;
};

const PRESET_ROUTES: { from: string; to: string }[] = [
  { from: "SYD", to: "DPS" },
  { from: "SYD", to: "SIN" },
  { from: "SYD", to: "HND" },
  { from: "SYD", to: "LAX" },
  { from: "MEL", to: "SIN" },
  { from: "SYD", to: "LHR" },
];

const CACHE_TTL_MS = 30 * 60_000;
let cache: { at: number; deals: LiveDeal[] } | null = null;
let inFlight: Promise<LiveDeal[]> | null = null;

function addDays(n: number): string {
  return new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
}

async function scanDeals(): Promise<LiveDeal[]> {
  const provider = getAwardProvider();
  const date = addDays(14);
  const dateTo = addDays(44);
  const deals: LiveDeal[] = [];

  for (const route of PRESET_ROUTES) {
    try {
      const items = await provider.search({ from: route.from, to: route.to, date, dateTo, pax: 1 });
      const best = items
        .filter((a) => a.miles > 0 && a.seats > 0)
        .sort((a, b) => a.miles - b.miles)[0];
      if (best) {
        deals.push({
          from: route.from,
          to: route.to,
          miles: best.miles,
          taxesUsd: best.taxesUsd,
          cabin: best.cabin,
          programId: best.programId,
          programName: best.programName,
          date: (best.depart || date).slice(0, 10),
          seats: best.seats,
        });
      }
    } catch (e) {
      console.error(`[deals] ${route.from}-${route.to} scan failed:`, (e as Error).message);
    }
  }
  return deals;
}

export const getLiveDeals = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ deals: LiveDeal[]; generatedAt: string }> => {
    const now = Date.now();
    if (cache && now - cache.at < CACHE_TTL_MS) {
      return { deals: cache.deals, generatedAt: new Date(cache.at).toISOString() };
    }
    // Coalesce concurrent homepage loads into one upstream scan.
    if (!inFlight) {
      inFlight = scanDeals()
        .then((deals) => {
          if (deals.length > 0) cache = { at: Date.now(), deals };
          return deals;
        })
        .finally(() => {
          inFlight = null;
        });
    }
    const deals = await inFlight;
    // Serve stale cache if this scan came back empty (provider hiccup).
    if (deals.length === 0 && cache) {
      return { deals: cache.deals, generatedAt: new Date(cache.at).toISOString() };
    }
    return { deals, generatedAt: new Date().toISOString() };
  },
);
