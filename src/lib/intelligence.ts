import type { AwardItinerary, Cabin } from "@/lib/awards/types";

/**
 * ONE-WAY cash fare benchmarks (AUD) per route-cabin, used as the CPP
 * denominator. Award seats are one-way, so the comparison fare must be too.
 * Curated routes first; anything else is modeled from great-circle distance;
 * regional defaults only when an airport is unknown.
 */
const FARE_AUD: Record<string, Partial<Record<Cabin, number>>> = {
  // Trans-Pacific
  "SYD-LAX": { economy: 1100, premium: 2200, business: 5200, first: 9800 },
  "SYD-SFO": { economy: 1150, premium: 2300, business: 5400, first: 10000 },
  "SYD-JFK": { economy: 1400, premium: 2900, business: 6800, first: 12500 },
  // Asia
  "SYD-SIN": { economy: 600, premium: 1200, business: 3200, first: 6000 },
  "SYD-HKG": { economy: 700, premium: 1500, business: 3600, first: 7000 },
  "SYD-NRT": { economy: 850, premium: 1700, business: 3900, first: 7500 },
  "SYD-HND": { economy: 850, premium: 1700, business: 3900, first: 7500 },
  "SYD-DPS": { economy: 550, premium: 1000, business: 1650, first: 3200 },
  // India
  "SYD-BOM": { economy: 950, premium: 1900, business: 4300, first: 8000 },
  "SYD-DEL": { economy: 950, premium: 1900, business: 4300, first: 8000 },
  "SYD-HYD": { economy: 1000, premium: 2000, business: 4400, first: 8200 },
  "SYD-BLR": { economy: 950, premium: 1900, business: 4300, first: 8000 },
  // Europe
  "SYD-LHR": { economy: 1350, premium: 2900, business: 6800, first: 13000 },
  "SYD-CDG": { economy: 1350, premium: 2900, business: 6800, first: 13000 },
  "SYD-FRA": { economy: 1300, premium: 2800, business: 6500, first: 12500 },
  // Middle East
  "SYD-DXB": { economy: 1200, premium: 2400, business: 5300, first: 10000 },
};

// Last-resort defaults when an airport has no coordinates on file (one-way).
const REGION_DEFAULTS_AUD: Record<string, Partial<Record<Cabin, number>>> = {
  short: { economy: 350, premium: 700, business: 1600, first: 3000 },
  medium: { economy: 850, premium: 1700, business: 3900, first: 7500 },
  long: { economy: 1300, premium: 2800, business: 6500, first: 12500 },
};

function regionFor(from: string, to: string): keyof typeof REGION_DEFAULTS_AUD {
  const aussie = ["SYD", "MEL", "BNE", "PER", "ADL"];
  const isAU = aussie.includes(from) || aussie.includes(to);
  if (!isAU) return "medium";
  const longHaul = ["LHR", "CDG", "FRA", "JFK", "EWR", "JNB", "GRU", "YYZ"];
  if (longHaul.some((c) => c === from || c === to)) return "long";
  return "medium";
}

/** [lat, lon] for fare modeling. Unknown airports fall back to region defaults. */
export const AIRPORT_COORDS: Record<string, [number, number]> = {
  // Australia / NZ / Pacific
  SYD: [-33.95, 151.18],
  MEL: [-37.67, 144.84],
  BNE: [-27.38, 153.12],
  PER: [-31.94, 115.97],
  ADL: [-34.95, 138.53],
  OOL: [-28.16, 153.5],
  CNS: [-16.88, 145.75],
  DRW: [-12.41, 130.88],
  HBA: [-42.84, 147.51],
  CBR: [-35.31, 149.19],
  AKL: [-37.01, 174.79],
  CHC: [-43.49, 172.53],
  WLG: [-41.33, 174.81],
  ZQN: [-45.02, 168.74],
  NAN: [-17.76, 177.44],
  // Asia
  DPS: [-8.75, 115.17],
  CGK: [-6.13, 106.66],
  SIN: [1.36, 103.99],
  KUL: [2.75, 101.71],
  BKK: [13.69, 100.75],
  HKT: [8.11, 98.32],
  HKG: [22.31, 113.91],
  TPE: [25.08, 121.23],
  MNL: [14.51, 121.02],
  NRT: [35.77, 140.39],
  HND: [35.55, 139.78],
  KIX: [34.43, 135.24],
  ICN: [37.46, 126.44],
  PVG: [31.14, 121.81],
  PEK: [40.08, 116.58],
  CAN: [23.39, 113.3],
  SGN: [10.82, 106.65],
  HAN: [21.21, 105.8],
  PNH: [11.55, 104.84],
  DEL: [28.57, 77.1],
  BOM: [19.09, 72.87],
  BLR: [13.2, 77.71],
  HYD: [17.24, 78.43],
  MAA: [12.99, 80.17],
  CMB: [7.18, 79.88],
  KTM: [27.7, 85.36],
  MLE: [4.19, 73.53],
  // Middle East
  DXB: [25.25, 55.36],
  AUH: [24.43, 54.65],
  DOH: [25.27, 51.61],
  JED: [21.68, 39.16],
  RUH: [24.96, 46.7],
  // Europe
  LHR: [51.47, -0.45],
  LGW: [51.15, -0.19],
  CDG: [49.01, 2.55],
  FRA: [50.03, 8.56],
  MUC: [48.35, 11.79],
  AMS: [52.31, 4.76],
  ZRH: [47.46, 8.55],
  VIE: [48.11, 16.57],
  FCO: [41.8, 12.25],
  MAD: [40.47, -3.56],
  BCN: [41.3, 2.08],
  IST: [41.28, 28.75],
  ATH: [37.94, 23.94],
  DUB: [53.42, -6.27],
  MAN: [53.35, -2.28],
  HEL: [60.32, 24.96],
  ARN: [59.65, 17.92],
  CPH: [55.62, 12.66],
  OSL: [60.19, 11.1],
  // Americas
  LAX: [33.94, -118.41],
  SFO: [37.62, -122.38],
  SEA: [47.45, -122.31],
  YVR: [49.19, -123.18],
  YYZ: [43.68, -79.63],
  JFK: [40.64, -73.78],
  EWR: [40.69, -74.17],
  BOS: [42.36, -71.01],
  ORD: [41.97, -87.91],
  DFW: [32.9, -97.04],
  IAH: [29.98, -95.34],
  MIA: [25.79, -80.29],
  ATL: [33.64, -84.43],
  DEN: [39.86, -104.67],
  LAS: [36.08, -115.15],
  HNL: [21.32, -157.92],
  MEX: [19.44, -99.07],
  GRU: [-23.43, -46.47],
  EZE: [-34.82, -58.54],
  SCL: [-33.39, -70.79],
  LIM: [-12.02, -77.11],
  BOG: [4.7, -74.14],
  // Africa
  JNB: [-26.14, 28.25],
  CPT: [-33.96, 18.6],
  NBO: [-1.32, 36.93],
  CAI: [30.12, 31.41],
};

function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const CABIN_FARE_MULT: Record<Cabin, number> = {
  economy: 1,
  premium: 1.95,
  business: 2.9,
  first: 4.8,
};

/** Distance-based one-way fare model: base fee + tiered per-km rate. */
function modeledFareAud(from: string, to: string, cabin: Cabin): number | undefined {
  const a = AIRPORT_COORDS[from];
  const b = AIRPORT_COORDS[to];
  if (!a || !b) return undefined;
  const km = distanceKm(a, b);
  const economy = 80 + Math.min(km, 1500) * 0.16 + Math.max(0, km - 1500) * 0.105;
  return Math.round((economy * CABIN_FARE_MULT[cabin]) / 10) * 10;
}

export function fareEstimateAud(from: string, to: string, cabin: Cabin): number {
  const direct = FARE_AUD[`${from}-${to}`]?.[cabin];
  const reverse = FARE_AUD[`${to}-${from}`]?.[cabin];
  const modeled = modeledFareAud(from, to, cabin);
  const region = REGION_DEFAULTS_AUD[regionFor(from, to)][cabin];
  return direct ?? reverse ?? modeled ?? region ?? 1200;
}

/** Routes with curated fare benchmarks (drives the /awards landing pages). */
export function knownRoutes(): { from: string; to: string }[] {
  return Object.keys(FARE_AUD).map((k) => {
    const [from, to] = k.split("-");
    return { from, to };
  });
}

/** True when both airports are in our supported catalog. */
export function isKnownAirport(code: string): boolean {
  return code.toUpperCase() in AIRPORT_COORDS;
}

/** Curated per-cabin fare benchmarks for a route, if we have them. */
export function fareTableFor(from: string, to: string): Partial<Record<Cabin, number>> | undefined {
  return FARE_AUD[`${from}-${to}`] ?? FARE_AUD[`${to}-${from}`];
}

/**
 * Cents per point/mile (AUD basis).
 * cpp = (cash fare AUD - taxes AUD) / miles  * 100
 * Award taxes come from seats.aero denominated in USD; convert at a flat
 * AUD/USD buffer so every figure the user sees is in AUD.
 */
export const USD_TO_AUD = 1.55;
/** Convert USD taxes (as returned by the awards provider) to AUD dollars. */
export function taxesAudFromUsd(taxesUsd: number): number {
  return taxesUsd * USD_TO_AUD;
}
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
    cabin === "first"
      ? { ex: 6.0, gr: 4.5, fa: 3.0 }
      : cabin === "business"
        ? { ex: 5.0, gr: 3.5, fa: 2.2 }
        : cabin === "premium"
          ? { ex: 3.5, gr: 2.5, fa: 1.5 }
          : { ex: 2.5, gr: 1.8, fa: 1.0 };
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
  if (ageMin > 5) score -= 10;
  if (ageMin > 30) score -= 25;
  if (ageMin > 120) score -= 30;
  if (ageMin > 360) score -= 25;
  if (a.seats <= 1) score -= 10; // single seat = high turnover risk
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
  ratio: string; // e.g. "1:1", "1:1.25"
  etaMin: number; // typical posting time
  etaMaxMin: number; // worst case
  href: string;
};

export const TRANSFER_MATRIX: TransferRoute[] = [
  // Amex (AU + global)
  {
    bank: "Amex MR (AU)",
    programId: "qantas",
    ratio: "1:0.5",
    etaMin: 1440,
    etaMaxMin: 4320,
    href: "https://www.americanexpress.com/au/rewards/membership-rewards/transfer-points",
  },
  {
    bank: "Amex MR (AU)",
    programId: "velocity",
    ratio: "1:1",
    etaMin: 1440,
    etaMaxMin: 4320,
    href: "https://www.americanexpress.com/au/rewards/membership-rewards/transfer-points",
  },
  {
    bank: "Amex MR (AU)",
    programId: "krisflyer",
    ratio: "1:1",
    etaMin: 60,
    etaMaxMin: 1440,
    href: "https://www.americanexpress.com/au/rewards/membership-rewards/transfer-points",
  },
  {
    bank: "Amex MR",
    programId: "krisflyer",
    ratio: "1:1",
    etaMin: 60,
    etaMaxMin: 1440,
    href: "https://global.americanexpress.com/rewards/transfer-points",
  },
  {
    bank: "Amex MR",
    programId: "emirates",
    ratio: "1:1",
    etaMin: 60,
    etaMaxMin: 1440,
    href: "https://global.americanexpress.com/rewards/transfer-points",
  },
  {
    bank: "Amex MR",
    programId: "lifemiles",
    ratio: "1:1",
    etaMin: 1440,
    etaMaxMin: 4320,
    href: "https://global.americanexpress.com/rewards/transfer-points",
  },
];

export function transfersFor(programId: string): TransferRoute[] {
  return TRANSFER_MATRIX.filter((t) => t.programId === programId).sort(
    (a, b) => a.etaMin - b.etaMin,
  );
}

/**
 * Transferable point-currency programs (ids from PROGRAMS) mapped to the
 * TRANSFER_MATRIX bank labels they can transfer out through.
 */
export const TRANSFERABLE_PROGRAM_BANKS: Record<string, string[]> = {
  amex_mr: ["Amex MR (AU)", "Amex MR"],
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
  return TRANSFER_MATRIX.filter((t) => banks.includes(t.bank)).sort((a, b) => a.etaMin - b.etaMin);
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
  direct: number; // points held in the program itself
  viaTransfer: number; // reachable by transferring bank currencies at best ratio
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
  shortfallMiles: number; // extra miles needed after counting transferable reach
  effectiveBalance: number; // direct balance + best-ratio transferable reach
  hasBalance: boolean; // user holds a direct balance in this program
  fastestTransfer?: TransferRoute;
  riskFlag?: "transfer-too-slow" | "single-seat" | "stale-cache";
};

export function rankItineraries(
  items: AwardItinerary[],
  balances: Record<string, number> = {},
): RankedItinerary[] {
  const reach = effectiveBalances(balances);
  return (
    items
      .map((a): RankedItinerary => {
        const balance = balances[a.programId] ?? 0;
        const effectiveBalance = reach[a.programId]?.total ?? balance;
        const cpp = calcCppAud(a);
        const grade = gradeCpp(cpp, a.cabin);
        const confidence = confidenceFor(a);
        const shortfallMiles = Math.max(0, a.miles - effectiveBalance);
        const hasBalance = balance > 0;
        const transfers = transfersFor(a.programId);
        const fastestTransfer =
          shortfallMiles > 0 || (balance < a.miles && effectiveBalance >= a.miles)
            ? transfers[0]
            : undefined;

        let riskFlag: RankedItinerary["riskFlag"];
        if (confidence.label === "stale") riskFlag = "stale-cache";
        else if (a.seats <= 1) riskFlag = "single-seat";
        else if (fastestTransfer && fastestTransfer.etaMin > 60 && confidence.ageMin < 30) {
          riskFlag = "transfer-too-slow";
        }

        return {
          ...a,
          cpp,
          grade,
          confidence,
          shortfallMiles,
          effectiveBalance,
          hasBalance,
          fastestTransfer,
          riskFlag,
        };
      })
      // Sort: best CPP first, then highest confidence, then lowest miles
      .sort((a, b) => {
        if (b.cpp !== a.cpp) return b.cpp - a.cpp;
        if (b.confidence.score !== a.confidence.score)
          return b.confidence.score - a.confidence.score;
        return a.miles - b.miles;
      })
  );
}

export function fmtCpp(cpp: number) {
  return `${cpp.toFixed(1)}¢/pt`;
}

export function fmtAud(n: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtAge(min: number) {
  if (min < 60) return `${min}m ago`;
  if (min < 1440) return `${Math.round(min / 60)}h ago`;
  return `${Math.round(min / 1440)}d ago`;
}

// ---------------------------------------------------------------------------
// Sweet-spot detection: flag itineraries priced meaningfully below the group
// median for the same cabin (route is fixed across a single search).
// ---------------------------------------------------------------------------
export type SweetSpotInfo = {
  /** Median miles across the group this itinerary belongs to (same cabin). */
  baselineMiles: number;
  /** True when miles are >=25% below baselineMiles. */
  isSweetSpot: boolean;
  /** max(0, baselineMiles - miles). */
  savingsMiles: number;
  /** 0..1, how far below the baseline this itinerary sits. */
  discountPct: number;
};

/** Sweet-spot threshold: at least 25% below the cabin baseline. */
export const SWEET_SPOT_THRESHOLD = 0.25;

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Annotate ranked itineraries with sweet-spot info. The baseline is the
 * median miles in the same cabin — a small statistical anchor that surfaces
 * asymmetric-value redemptions (e.g. ANA 75k J to Europe when the group
 * median is 120k).
 */
export function annotateSweetSpots<T extends AwardItinerary>(
  items: T[],
): (T & SweetSpotInfo)[] {
  const groups = new Map<Cabin, number[]>();
  for (const a of items) {
    const arr = groups.get(a.cabin) ?? [];
    arr.push(a.miles);
    groups.set(a.cabin, arr);
  }
  const medianByCabin = new Map<Cabin, number>();
  for (const [cabin, arr] of groups) medianByCabin.set(cabin, median(arr));

  return items.map((a) => {
    const baselineMiles = medianByCabin.get(a.cabin) ?? a.miles;
    const discountPct =
      baselineMiles > 0 ? Math.max(0, (baselineMiles - a.miles) / baselineMiles) : 0;
    const isSweetSpot =
      // Need at least 3 comparable entries in the cabin to trust the median,
      // otherwise a lone cheap fare would always trigger.
      (groups.get(a.cabin)?.length ?? 0) >= 3 && discountPct >= SWEET_SPOT_THRESHOLD;
    return {
      ...a,
      baselineMiles,
      isSweetSpot,
      savingsMiles: Math.max(0, baselineMiles - a.miles),
      discountPct,
    };
  });
}
