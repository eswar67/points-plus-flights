import type { AwardItinerary, Cabin } from "@/lib/awards/types";

/**
 * Cash fare benchmarks (AUD) per route-class. Used as the denominator for CPP.
 * Conservative midpoints from public flight-fare data; refined per route over time.
 * Format: "FROM-TO" with city codes. Falls back to a regional default.
 */
const FARE_AUD: Record<string, Partial<Record<Cabin, number>>> = {
  // Trans-Pacific
  "SYD-LAX": { economy: 1800, premium: 3800, business: 9500, first: 18000 },
  "SYD-SFO": { economy: 1900, premium: 4000, business: 9800, first: 18500 },
  "SYD-JFK": { economy: 2400, premium: 5200, business: 12000, first: 22000 },
  // Asia
  "SYD-SIN": { economy: 1100, premium: 2200, business: 5800, first: 11000 },
  "SYD-HKG": { economy: 1300, premium: 2600, business: 6500, first: 12500 },
  "SYD-NRT": { economy: 1500, premium: 3000, business: 7000, first: 13500 },
  "SYD-HND": { economy: 1500, premium: 3000, business: 7000, first: 13500 },
  // India
  "SYD-BOM": { economy: 1700, premium: 3400, business: 7800, first: 14500 },
  "SYD-DEL": { economy: 1700, premium: 3400, business: 7800, first: 14500 },
  "SYD-HYD": { economy: 1800, premium: 3600, business: 8000, first: 15000 },
  "SYD-BLR": { economy: 1700, premium: 3400, business: 7800, first: 14500 },
  // Europe
  "SYD-LHR": { economy: 2400, premium: 5400, business: 12500, first: 24000 },
  "SYD-CDG": { economy: 2400, premium: 5400, business: 12500, first: 24000 },
  "SYD-FRA": { economy: 2300, premium: 5200, business: 12000, first: 23000 },
  // Middle East
  "SYD-DXB": { economy: 2100, premium: 4200, business: 9500, first: 18000 },
};

const REGION_DEFAULTS_AUD: Record<string, Partial<Record<Cabin, number>>> = {
  short:  { economy: 600,  premium: 1200, business: 2800, first: 5500 },
  medium: { economy: 1500, premium: 3000, business: 7000, first: 13500 },
  long:   { economy: 2300, premium: 5000, business: 11500, first: 22000 },
};

function regionFor(from: string, to: string): keyof typeof REGION_DEFAULTS_AUD {
  // Crude classification fallback
  const aussie = ["SYD", "MEL", "BNE", "PER", "ADL"];
  const isAU = aussie.includes(from) || aussie.includes(to);
  if (!isAU) return "medium";
  const longHaul = ["LHR", "CDG", "FRA", "JFK", "EWR", "JNB", "GRU", "YYZ"];
  if (longHaul.some((c) => c === from || c === to)) return "long";
  return "medium";
}

export function fareEstimateAud(from: string, to: string, cabin: Cabin): number {
  const direct = FARE_AUD[`${from}-${to}`]?.[cabin];
  const reverse = FARE_AUD[`${to}-${from}`]?.[cabin];
  const region = REGION_DEFAULTS_AUD[regionFor(from, to)][cabin];
  return direct ?? reverse ?? region ?? 2000;
}

/** Routes with curated fare benchmarks (drives the /awards landing pages). */
export function knownRoutes(): { from: string; to: string }[] {
  return Object.keys(FARE_AUD).map((k) => {
    const [from, to] = k.split("-");
    return { from, to };
  });
}

/** Curated per-cabin fare benchmarks for a route, if we have them. */
export function fareTableFor(from: string, to: string): Partial<Record<Cabin, number>> | undefined {
  return FARE_AUD[`${from}-${to}`] ?? FARE_AUD[`${to}-${from}`];
}

/**
 * Cents per point/mile (AUD basis).
 * cpp = (cash fare AUD - taxes AUD) / miles  * 100
 * Taxes returned in USD; convert at a flat 1.50 AUD/USD buffer.
 */
const USD_TO_AUD = 1.55;
export function calcCppAud(a: AwardItinerary): number {
  const pax = a.pax && a.pax > 0 ? a.pax : 1;
  // miles/taxes are totals across all passengers; the fare benchmark is per seat.
  const fare = fareEstimateAud(a.from, a.to, a.cabin) * pax;
  const taxesAud = a.taxesUsd * USD_TO_AUD;
  if (a.miles <= 0) return 0;
  return Math.max(0, ((fare - taxesAud) / a.miles) * 100);
}

export type ValueGrade = "exceptional" | "great" | "fair" | "skip";

export function gradeCpp(cpp: number, cabin: Cabin): ValueGrade {
  // Premium cabins should clear higher CPP bars.
  const t =
    cabin === "first"    ? { ex: 6.0, gr: 4.5, fa: 3.0 } :
    cabin === "business" ? { ex: 5.0, gr: 3.5, fa: 2.2 } :
    cabin === "premium"  ? { ex: 3.5, gr: 2.5, fa: 1.5 } :
                           { ex: 2.5, gr: 1.8, fa: 1.0 };
  if (cpp >= t.ex) return "exceptional";
  if (cpp >= t.gr) return "great";
  if (cpp >= t.fa) return "fair";
  return "skip";
}

/**
 * Confidence score 0-100 based on how stale the cached data is and seat count.
 */
export type Confidence = { score: number; label: "live" | "likely" | "stale"; ageMin: number };

export function confidenceFor(a: AwardItinerary, now: number = Date.now()): Confidence {
  const updated = a.updatedAt ? new Date(a.updatedAt).getTime() : now - 90 * 60_000;
  const ageMin = Math.max(0, Math.round((now - updated) / 60_000));
  let score = 100;
  if (ageMin > 5)   score -= 10;
  if (ageMin > 30)  score -= 25;
  if (ageMin > 120) score -= 30;
  if (ageMin > 360) score -= 25;
  if (a.seats <= 1) score -= 10;     // single seat = high turnover risk
  if (a.seats >= 4) score += 5;
  score = Math.max(0, Math.min(100, score));
  const label = score >= 75 ? "live" : score >= 45 ? "likely" : "stale";
  return { score, label, ageMin };
}

/**
 * Transfer timing matrix. Minutes from initiation to points landing.
 * Used to compute "safe window" warnings.
 */
export type TransferRoute = {
  bank: string;
  programId: string;
  ratio: string;     // e.g. "1:1", "1:1.25"
  etaMin: number;    // typical posting time
  etaMaxMin: number; // worst case
  href: string;
};

export const TRANSFER_MATRIX: TransferRoute[] = [
  // Amex (AU + global)
  { bank: "Amex MR (AU)",  programId: "qantas",    ratio: "1:0.5", etaMin: 1440, etaMaxMin: 4320, href: "https://www.americanexpress.com/au/rewards/membership-rewards/transfer-points" },
  { bank: "Amex MR (AU)",  programId: "velocity",  ratio: "1:1",   etaMin: 1440, etaMaxMin: 4320, href: "https://www.americanexpress.com/au/rewards/membership-rewards/transfer-points" },
  { bank: "Amex MR (AU)",  programId: "krisflyer", ratio: "1:1",   etaMin: 60,   etaMaxMin: 1440, href: "https://www.americanexpress.com/au/rewards/membership-rewards/transfer-points" },
  { bank: "Amex MR",       programId: "krisflyer", ratio: "1:1",   etaMin: 60,   etaMaxMin: 1440, href: "https://global.americanexpress.com/rewards/transfer-points" },
  { bank: "Amex MR",       programId: "emirates",  ratio: "1:1",   etaMin: 60,   etaMaxMin: 1440, href: "https://global.americanexpress.com/rewards/transfer-points" },
  { bank: "Amex MR",       programId: "lifemiles", ratio: "1:1",   etaMin: 1440, etaMaxMin: 4320, href: "https://global.americanexpress.com/rewards/transfer-points" },
  // Chase
  { bank: "Chase UR",      programId: "united",    ratio: "1:1",   etaMin: 1,    etaMaxMin: 60,   href: "https://ultimaterewards.chase.com" },
  { bank: "Chase UR",      programId: "krisflyer", ratio: "1:1",   etaMin: 60,   etaMaxMin: 1440, href: "https://ultimaterewards.chase.com" },
  // Bilt
  { bank: "Bilt",          programId: "united",    ratio: "1:1",   etaMin: 5,    etaMaxMin: 60,   href: "https://www.biltrewards.com" },
  { bank: "Bilt",          programId: "emirates",  ratio: "1:1",   etaMin: 5,    etaMaxMin: 60,   href: "https://www.biltrewards.com" },
  // Citi
  { bank: "Citi TYP",      programId: "krisflyer", ratio: "1:1",   etaMin: 60,   etaMaxMin: 1440, href: "https://www.citi.com/thankyou" },
  { bank: "Citi TYP",      programId: "lifemiles", ratio: "1:1",   etaMin: 60,   etaMaxMin: 1440, href: "https://www.citi.com/thankyou" },
];

export function transfersFor(programId: string): TransferRoute[] {
  return TRANSFER_MATRIX
    .filter((t) => t.programId === programId)
    .sort((a, b) => a.etaMin - b.etaMin);
}

/**
 * Transferable point-currency programs (ids from PROGRAMS) mapped to the
 * TRANSFER_MATRIX bank labels they can transfer out through.
 */
export const TRANSFERABLE_PROGRAM_BANKS: Record<string, string[]> = {
  amex_mr: ["Amex MR (AU)", "Amex MR"],
  citi: ["Citi TYP"],
  anz: [], // no partner routes on file yet
};

/** "1:1.25" -> 1.25, "1:0.5" -> 0.5 */
export function ratioMultiplier(ratio: string): number {
  const [from, to] = ratio.split(":").map(Number);
  if (!from || !to) return 1;
  return to / from;
}

/** Outbound routes available from a transferable program the user holds. */
export function routesFromBankProgram(bankProgramId: string): TransferRoute[] {
  const banks = TRANSFERABLE_PROGRAM_BANKS[bankProgramId] ?? [];
  return TRANSFER_MATRIX
    .filter((t) => banks.includes(t.bank))
    .sort((a, b) => a.etaMin - b.etaMin);
}

/** Best route (highest ratio, then fastest) from one bank program to one airline program. */
export function bestTransferRoute(
  bankProgramId: string,
  airlineProgramId: string,
): TransferRoute | undefined {
  return routesFromBankProgram(bankProgramId)
    .filter((r) => r.programId === airlineProgramId)
    .sort((a, b) => ratioMultiplier(b.ratio) - ratioMultiplier(a.ratio) || a.etaMin - b.etaMin)[0];
}

export type EffectiveBalance = {
  direct: number;       // points held in the program itself
  viaTransfer: number;  // reachable by transferring bank currencies at best ratio
  total: number;
};

/**
 * Per-program reach: direct balance plus what transferable currencies could
 * add at their best ratio. Each program's total is independent "reach" — the
 * same bank points can't fund two programs at once, and the UI says so.
 */
export function effectiveBalances(
  byProgramId: Record<string, number>,
): Record<string, EffectiveBalance> {
  const out: Record<string, EffectiveBalance> = {};
  for (const [pid, bal] of Object.entries(byProgramId)) {
    out[pid] = { direct: bal, viaTransfer: 0, total: bal };
  }
  for (const bankProgramId of Object.keys(TRANSFERABLE_PROGRAM_BANKS)) {
    const bal = byProgramId[bankProgramId] ?? 0;
    if (bal <= 0) continue;
    const targets = new Set(routesFromBankProgram(bankProgramId).map((r) => r.programId));
    for (const target of targets) {
      const route = bestTransferRoute(bankProgramId, target);
      if (!route) continue;
      const gain = Math.floor(bal * ratioMultiplier(route.ratio));
      const cur = out[target] ?? {
        direct: byProgramId[target] ?? 0,
        viaTransfer: 0,
        total: byProgramId[target] ?? 0,
      };
      cur.viaTransfer += gain;
      cur.total = cur.direct + cur.viaTransfer;
      out[target] = cur;
    }
  }
  return out;
}

/**
 * Best-program ranking: given a search cluster (same route + cabin + date),
 * rank itineraries by AUD-effective cost considering held balances.
 */
export type RankedItinerary = AwardItinerary & {
  cpp: number;
  grade: ValueGrade;
  confidence: Confidence;
  shortfallMiles: number;        // extra miles needed after counting transferable reach
  effectiveBalance: number;      // direct balance + best-ratio transferable reach
  hasBalance: boolean;           // user holds a direct balance in this program
  fastestTransfer?: TransferRoute;
  riskFlag?: "transfer-too-slow" | "single-seat" | "stale-cache";
};

export function rankItineraries(
  items: AwardItinerary[],
  balances: Record<string, number> = {},
): RankedItinerary[] {
  const reach = effectiveBalances(balances);
  return items
    .map((a): RankedItinerary => {
      const balance = balances[a.programId] ?? 0;
      const effectiveBalance = reach[a.programId]?.total ?? balance;
      const cpp = calcCppAud(a);
      const grade = gradeCpp(cpp, a.cabin);
      const confidence = confidenceFor(a);
      const shortfallMiles = Math.max(0, a.miles - effectiveBalance);
      const hasBalance = balance > 0;
      const transfers = transfersFor(a.programId);
      const fastestTransfer = shortfallMiles > 0 || (balance < a.miles && effectiveBalance >= a.miles)
        ? transfers[0]
        : undefined;

      let riskFlag: RankedItinerary["riskFlag"];
      if (confidence.label === "stale") riskFlag = "stale-cache";
      else if (a.seats <= 1) riskFlag = "single-seat";
      else if (fastestTransfer && fastestTransfer.etaMin > 60 && confidence.ageMin < 30) {
        riskFlag = "transfer-too-slow";
      }

      return { ...a, cpp, grade, confidence, shortfallMiles, effectiveBalance, hasBalance, fastestTransfer, riskFlag };
    })
    // Sort: best CPP first, then highest confidence, then lowest miles
    .sort((a, b) => {
      if (b.cpp !== a.cpp) return b.cpp - a.cpp;
      if (b.confidence.score !== a.confidence.score) return b.confidence.score - a.confidence.score;
      return a.miles - b.miles;
    });
}

export function fmtCpp(cpp: number) {
  return `${cpp.toFixed(1)}¢/pt`;
}

export function fmtAud(n: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n);
}

export function fmtAge(min: number) {
  if (min < 60) return `${min}m ago`;
  if (min < 1440) return `${Math.round(min / 60)}h ago`;
  return `${Math.round(min / 1440)}d ago`;
}