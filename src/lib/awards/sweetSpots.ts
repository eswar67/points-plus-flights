import type { Cabin } from "./types";

/**
 * Curated redemption intelligence, distilled from long-running community
 * knowledge (Point Hacks AU, God Save the Points, One Mile at a Time,
 * The Points Guy, Frequent Miler, Australian Frequent Flyer). These are
 * durable "sweet spots" that hold across award-chart resets — not live
 * pricing. Live pricing comes from the search engine; this drives editorial.
 */

export type SweetSpot = {
  programId: string; // matches PROGRAMS.id
  cabin: Cabin;
  miles: number; // indicative one-way, per seat
  taxesAud?: number; // rough one-way surcharges/taxes in AUD
  headline: string; // short editorial title
  why: string; // 1–2 sentence rationale
  source?: string; // community reference (name only, not a link)
};

/** Key: "FROM-TO" (one direction; helper looks up reverse too). */
const SWEET_SPOTS: Record<string, SweetSpot[]> = {
  "SYD-LAX": [
    {
      programId: "velocity",
      cabin: "economy",
      miles: 41500,
      taxesAud: 220,
      headline: "Velocity → Delta One economy",
      why: "Delta releases genuine SYD–LAX economy space to Velocity at fixed 41.5k one-way with modest taxes — the cheapest cash-equivalent economy redemption ex-Australia.",
      source: "Point Hacks AU",
    },
    {
      programId: "united",
      cabin: "business",
      miles: 88000,
      taxesAud: 120,
      headline: "United MileagePlus on partner *A metal",
      why: "United charges 88k one-way in business on Air NZ / ANA / Singapore Suites operated partners — no fuel surcharges, taxes under $150.",
      source: "One Mile at a Time",
    },
    {
      programId: "krisflyer",
      cabin: "business",
      miles: 92000,
      taxesAud: 260,
      headline: "KrisFlyer Saver on SQ metal",
      why: "Saver-level SQ business SYD–SIN–LAX at 92k + ~$260 is stronger than routing on QF for a Sydney departure once you factor cabin quality.",
      source: "God Save the Points",
    },
  ],
  "SYD-JFK": [
    {
      programId: "aeroplan",
      cabin: "business",
      miles: 110000,
      taxesAud: 180,
      headline: "Aeroplan via LAX/SFO connection",
      why: "Aeroplan distance-based pricing gets you SYD–JFK in business under 110k with low carrier charges — one of the best long-haul deals with a US endpoint.",
      source: "Frequent Miler",
    },
    {
      programId: "velocity",
      cabin: "premium",
      miles: 62000,
      taxesAud: 280,
      headline: "Velocity → Delta premium select",
      why: "Premium economy on Delta A350 for ~62k Velocity points is a Point Hacks perennial when business is unavailable.",
      source: "Point Hacks AU",
    },
  ],
  "SYD-SIN": [
    {
      programId: "krisflyer",
      cabin: "economy",
      miles: 25500,
      taxesAud: 120,
      headline: "KrisFlyer economy Saver on SQ",
      why: "25.5k one-way in economy is the cheapest way to Singapore on quality metal — space is routinely open outside school holidays.",
      source: "Point Hacks AU",
    },
    {
      programId: "velocity",
      cabin: "business",
      miles: 78000,
      taxesAud: 160,
      headline: "Velocity → SQ business (partner)",
      why: "Transfer partner sweet spot — 78k one-way in SQ business, with far friendlier taxes than the equivalent Qantas Emirates routing.",
      source: "Australian Frequent Flyer",
    },
  ],
  "SYD-HND": [
    {
      programId: "qantas",
      cabin: "business",
      miles: 96400,
      taxesAud: 210,
      headline: "Qantas Classic on JAL/QF",
      why: "Qantas prices SYD–HND in business at 96.4k, and JAL/QF release genuine premium space for the route — one of the best QFF long-haul values.",
      source: "Point Hacks AU",
    },
    {
      programId: "united",
      cabin: "business",
      miles: 88000,
      taxesAud: 90,
      headline: "United on ANA — the surcharge escape",
      why: "ANA business at 88k one-way with UA miles, and none of ANA's own program's Y-Q fuel surcharges (which push ANA-issued awards past $700 in taxes).",
      source: "One Mile at a Time",
    },
  ],
  "SYD-LHR": [
    {
      programId: "krisflyer",
      cabin: "business",
      miles: 110500,
      taxesAud: 340,
      headline: "KrisFlyer via SIN on SQ",
      why: "110.5k business SYD–SIN–LHR on Singapore metal, and no partner-award surcharge madness. The default 'sensible' way to London on points.",
      source: "Point Hacks AU",
    },
    {
      programId: "lifemiles",
      cabin: "business",
      miles: 87000,
      taxesAud: 130,
      headline: "LifeMiles on partner *A to Europe",
      why: "LifeMiles doesn't pass fuel surcharges. 87k in business on Lufthansa/SWISS/Turkish metal, plus watch for their frequent 25–30% mileage sales.",
      source: "One Mile at a Time",
    },
    {
      programId: "flyingblue",
      cabin: "premium",
      miles: 65000,
      taxesAud: 220,
      headline: "Flying Blue Promo Awards (PE)",
      why: "Flying Blue runs monthly Promo Awards with 25–50% off — premium economy to Paris/Amsterdam regularly lands under 65k. Transfer partner of Amex/Citi.",
      source: "The Points Guy",
    },
  ],
  "SYD-CDG": [
    {
      programId: "flyingblue",
      cabin: "business",
      miles: 145000,
      taxesAud: 320,
      headline: "Flying Blue on AF/KL",
      why: "Direct redemption on the operating carrier avoids partner premiums, and Amex/Citi transfer bonuses can push effective cost lower.",
      source: "The Points Guy",
    },
  ],
  "SYD-DXB": [
    {
      programId: "emirates",
      cabin: "first",
      miles: 156500,
      taxesAud: 900,
      headline: "Emirates Skywards A380 First",
      why: "The showcase EK product — but taxes are steep. Only worth it if you value the F experience over another 60k points elsewhere.",
      source: "One Mile at a Time",
    },
    {
      programId: "united",
      cabin: "business",
      miles: 80000,
      taxesAud: 110,
      headline: "United on partners avoiding EK",
      why: "Skip Emirates surcharges by using UA miles on other *A carriers routing SYD–SIN/BKK–DXB — business under 80k with taxes near $100.",
      source: "Frequent Miler",
    },
  ],
  "SYD-DPS": [
    {
      programId: "velocity",
      cabin: "economy",
      miles: 19500,
      taxesAud: 90,
      headline: "Velocity Reward Seat to Bali",
      why: "19.5k economy one-way on Virgin Australia — the classic short-haul sweet spot Point Hacks has recommended for a decade.",
      source: "Point Hacks AU",
    },
    {
      programId: "krisflyer",
      cabin: "business",
      miles: 51000,
      taxesAud: 130,
      headline: "KrisFlyer on SQ via SIN",
      why: "Business to Bali via Singapore for 51k — great use of KrisFlyer with a stopover option in SIN on the way back.",
      source: "Point Hacks AU",
    },
  ],
  "SYD-HKG": [
    {
      programId: "qantas",
      cabin: "business",
      miles: 78400,
      taxesAud: 180,
      headline: "Qantas Classic on Cathay",
      why: "Cathay releases solid business space to QFF at 78.4k — one of the reliably bookable Asia sweet spots from Sydney.",
      source: "Point Hacks AU",
    },
    {
      programId: "krisflyer",
      cabin: "economy",
      miles: 30500,
      taxesAud: 130,
      headline: "KrisFlyer economy on SQ",
      why: "30.5k one-way in economy via Singapore — beats cash easily during peak season.",
      source: "Point Hacks AU",
    },
  ],
  "SYD-BOM": [
    {
      programId: "krisflyer",
      cabin: "business",
      miles: 95500,
      taxesAud: 210,
      headline: "KrisFlyer on SQ via SIN",
      why: "SQ business SYD–SIN–BOM for 95.5k is one of the best premium redemptions to India from Australia.",
      source: "Point Hacks AU",
    },
    {
      programId: "velocity",
      cabin: "economy",
      miles: 43500,
      taxesAud: 180,
      headline: "Velocity → SQ economy",
      why: "Transfer partner path: 43.5k Velocity for economy to Mumbai on SQ, avoiding QF's higher Asia economy pricing.",
      source: "Australian Frequent Flyer",
    },
  ],
};

export function sweetSpotsFor(from: string, to: string): SweetSpot[] {
  return SWEET_SPOTS[`${from}-${to}`] ?? SWEET_SPOTS[`${to}-${from}`] ?? [];
}

// -----------------------------------------------------------------------
// General strategy content
// -----------------------------------------------------------------------

export type Tip = {
  title: string;
  body: string;
  tag: "Economy" | "Premium" | "Strategy" | "Taxes" | "Transfers";
};

export const EXPERT_TIPS: Tip[] = [
  {
    tag: "Economy",
    title: "Economy is where the cents-per-point actually shines",
    body: "Premium cabins get the headlines, but a 25k-mile economy hop that would have cost $900 cash is often 3.6c/pt — better value than a 6.8c/pt business seat. If your points balance is modest, redeem economy on short-haul first.",
  },
  {
    tag: "Taxes",
    title: "Avoid Qantas–Emirates for London awards",
    body: "QFF prices SYD–LHR on EK at ~144k business one-way but stacks $1,200+ of fuel surcharges. KrisFlyer on SQ, or LifeMiles / Aeroplan on Star Alliance carriers, cut cash outlay by 60–80%.",
  },
  {
    tag: "Strategy",
    title: "LifeMiles for Star Alliance business to Europe",
    body: "Avianca LifeMiles doesn't pass fuel surcharges on partner awards and runs mileage sales roughly monthly. 87k one-way in business to Europe on Lufthansa/SWISS/Turkish is the community's most-cited sweet spot.",
  },
  {
    tag: "Transfers",
    title: "Amex Membership Rewards → Velocity or KrisFlyer",
    body: "Amex 1:1 transfer partners include Velocity, KrisFlyer, and Flying Blue. Don't transfer speculatively — confirm award space in the partner program first, then transfer within minutes.",
  },
  {
    tag: "Premium",
    title: "Flying Blue Promo Awards drop monthly",
    body: "Air France-KLM discount specific routes 25–50% every month. Sign up for the alert email, then transfer Amex points at 1:1 only after you've located the promo seat.",
  },
  {
    tag: "Strategy",
    title: "Stopover rules quietly change the value",
    body: "KrisFlyer, Aeroplan and ANA all allow a stopover on award tickets — turning a one-way redemption into a two-city trip for the same points. Plan the stopover before you book, not after.",
  },
];

// -----------------------------------------------------------------------
// Region grouping for the landing page
// -----------------------------------------------------------------------

export type Region = "Trans-Pacific" | "Asia" | "India" | "Europe" | "Middle East";

const ROUTE_REGION: Record<string, Region> = {
  "SYD-LAX": "Trans-Pacific",
  "SYD-SFO": "Trans-Pacific",
  "SYD-JFK": "Trans-Pacific",
  "SYD-SIN": "Asia",
  "SYD-HKG": "Asia",
  "SYD-NRT": "Asia",
  "SYD-HND": "Asia",
  "SYD-DPS": "Asia",
  "SYD-BOM": "India",
  "SYD-DEL": "India",
  "SYD-HYD": "India",
  "SYD-BLR": "India",
  "SYD-LHR": "Europe",
  "SYD-CDG": "Europe",
  "SYD-FRA": "Europe",
  "SYD-DXB": "Middle East",
};

export function regionForRoute(from: string, to: string): Region {
  return ROUTE_REGION[`${from}-${to}`] ?? ROUTE_REGION[`${to}-${from}`] ?? "Asia";
}
