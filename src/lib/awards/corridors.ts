import type { Cabin } from "./types";

/**
 * Anywhere-to-anywhere redemption playbook.
 *
 * Airports and airline programs are global. Sweet spots are curated per
 * "corridor" — a pair of world regions — because that's the level at which
 * program pricing behaviour is consistent (Aeroplan's distance chart, Avios'
 * short-haul band, LifeMiles' no-fuel-surcharge partner awards, etc.).
 *
 * Distilled from Point Hacks, One Mile at a Time, Frequent Miler, The Points
 * Guy, God Save the Points, Australian Frequent Flyer and PointsFly.
 */

export type RegionId =
  | "oceania"
  | "se_asia"
  | "n_asia"
  | "s_asia"
  | "middle_east"
  | "europe"
  | "n_america"
  | "s_america"
  | "africa";

export type Region = {
  id: RegionId;
  label: string;
  short: string;   // 2–3 letters for chips
  hubs: string[];  // representative IATA codes shown in UI
};

export const REGIONS: Region[] = [
  { id: "oceania",     label: "Oceania",         short: "OC",  hubs: ["SYD", "MEL", "BNE", "PER", "AKL"] },
  { id: "se_asia",     label: "Southeast Asia",  short: "SEA", hubs: ["SIN", "BKK", "KUL", "DPS", "HAN", "SGN", "MNL"] },
  { id: "n_asia",      label: "North Asia",      short: "NA",  hubs: ["HND", "NRT", "ICN", "PVG", "PEK", "HKG", "TPE"] },
  { id: "s_asia",      label: "South Asia",      short: "SA",  hubs: ["DEL", "BOM", "BLR", "HYD", "MAA", "CMB"] },
  { id: "middle_east", label: "Middle East",     short: "ME",  hubs: ["DXB", "DOH", "AUH", "IST"] },
  { id: "europe",      label: "Europe / UK",     short: "EU",  hubs: ["LHR", "CDG", "FRA", "AMS", "MAD", "FCO", "ZRH"] },
  { id: "n_america",   label: "North America",   short: "NAM", hubs: ["JFK", "LAX", "SFO", "ORD", "YYZ", "YVR"] },
  { id: "s_america",   label: "South America",   short: "SAM", hubs: ["GRU", "SCL", "EZE", "BOG", "LIM"] },
  { id: "africa",      label: "Africa",          short: "AF",  hubs: ["JNB", "CPT", "NBO", "CAI"] },
];

/** IATA → region for the region-corridor lookup (representative hubs). */
const AIRPORT_REGION: Record<string, RegionId> = {};
for (const r of REGIONS) for (const h of r.hubs) AIRPORT_REGION[h] = r.id;

export function regionOf(iata: string): RegionId | null {
  return AIRPORT_REGION[iata.toUpperCase()] ?? null;
}

export function getRegion(id: RegionId): Region {
  return REGIONS.find((r) => r.id === id)!;
}

// -----------------------------------------------------------------------
// Corridor sweet spots — the redemption matrix
// -----------------------------------------------------------------------

export type CorridorSpot = {
  programId: string;    // matches PROGRAMS.id
  cabin: Cabin;
  miles: number;        // indicative one-way per seat
  taxesAud?: number;    // rough AUD taxes/surcharges one-way
  metal: string;        // operating carrier(s), e.g. "SQ" or "ANA / LH"
  routing: string;      // short human routing hint
  why: string;          // one-line rationale
  source?: string;
};

export type Corridor = {
  from: RegionId;
  to: RegionId;
  headline: string;
  strategy: string;      // 1–2 sentence corridor-level plain-English strategy
  bestFor: string[];     // program IDs — the corridor's default winners
  spots: CorridorSpot[]; // full redemption menu
};

const CORRIDORS: Corridor[] = [
  // ─── Oceania outbound ───────────────────────────────────────────────
  {
    from: "oceania", to: "n_america",
    headline: "Australia ↔ North America",
    strategy: "Skip QFF+EK's fuel-surcharge trap. United and Aeroplan on partner *A metal, or Velocity to Delta One, dominate.",
    bestFor: ["united", "aeroplan", "velocity"],
    spots: [
      { programId: "velocity",   cabin: "economy",  miles: 41500, taxesAud: 220, metal: "DL",         routing: "SYD–LAX nonstop",         why: "Delta releases genuine SYD–LAX economy to Velocity at 41.5k — cheapest cash-equivalent economy ex-AU.", source: "Point Hacks AU" },
      { programId: "united",     cabin: "business", miles: 88000, taxesAud: 120, metal: "NZ / NH / SQ", routing: "via AKL / NRT / SIN",    why: "88k in J on Star partners with no fuel surcharges — the surcharge-escape play.", source: "One Mile at a Time" },
      { programId: "aeroplan",   cabin: "business", miles: 110000,taxesAud: 180, metal: "AC / UA",     routing: "SYD–LAX/SFO–JFK",         why: "Distance chart puts SYD–JFK in J under 110k with low cash." , source: "Frequent Miler" },
      { programId: "krisflyer",  cabin: "business", miles: 92000, taxesAud: 260, metal: "SQ",          routing: "SYD–SIN–LAX",             why: "SQ Saver J at 92k beats QF once cabin quality is factored in.", source: "God Save the Points" },
      { programId: "velocity",   cabin: "premium",  miles: 62000, taxesAud: 280, metal: "DL A350",     routing: "SYD/BNE–LAX",             why: "Delta Premium Select for 62k — perennial when J is closed.", source: "Point Hacks AU" },
    ],
  },
  {
    from: "oceania", to: "europe",
    headline: "Australia ↔ Europe / UK",
    strategy: "LifeMiles and Aeroplan on *A avoid the £1,000+ fuel surcharges QFF piles onto Emirates awards. KrisFlyer on SQ is the sensible mid-tier.",
    bestFor: ["lifemiles", "aeroplan", "krisflyer"],
    spots: [
      { programId: "lifemiles",  cabin: "business", miles: 87000, taxesAud: 130, metal: "LH / LX / TK", routing: "SYD–SIN/BKK–FRA/ZRH/IST", why: "No fuel surcharges + 25–30% mileage sales monthly.", source: "One Mile at a Time" },
      { programId: "krisflyer",  cabin: "business", miles: 110500,taxesAud: 340, metal: "SQ",           routing: "SYD–SIN–LHR/CDG/FRA",     why: "Default sensible option — SQ metal, no partner-award premium.", source: "Point Hacks AU" },
      { programId: "flyingblue", cabin: "premium",  miles: 65000, taxesAud: 220, metal: "AF / KL",      routing: "via SIN/BKK–CDG/AMS",     why: "Promo Awards drop monthly at 25–50% off PE.", source: "The Points Guy" },
      { programId: "aeroplan",   cabin: "business", miles: 140000,taxesAud: 260, metal: "*A partners",  routing: "SYD–SIN/HKG–FRA",         why: "Aeroplan distance chart holds even after devaluations.", source: "Frequent Miler" },
      { programId: "qatar",      cabin: "business", miles: 95000, taxesAud: 300, metal: "QR Qsuite",    routing: "SYD/MEL–DOH–LHR/CDG",     why: "Qsuite is the world's best J — direct QR pricing avoids Avios stopover math.", source: "One Mile at a Time" },
      { programId: "virginatlantic", cabin: "business", miles: 95000, taxesAud: 420, metal: "VS",       routing: "via HKG/JNB–LHR",         why: "Flying Club sweet spot when connecting via Asia/Africa on partner metal.", source: "The Points Guy" },
    ],
  },
  {
    from: "oceania", to: "se_asia",
    headline: "Australia ↔ Southeast Asia",
    strategy: "Velocity to Bali is the classic short-haul redemption. KrisFlyer prices SIN awards at genuine value — SQ metal, low taxes.",
    bestFor: ["velocity", "krisflyer", "qantas"],
    spots: [
      { programId: "velocity",   cabin: "economy",  miles: 19500, taxesAud: 90,  metal: "VA",           routing: "SYD/MEL/BNE–DPS",         why: "The 10-year Point Hacks staple — 19.5k to Bali.", source: "Point Hacks AU" },
      { programId: "krisflyer",  cabin: "economy",  miles: 25500, taxesAud: 120, metal: "SQ",           routing: "SYD–SIN nonstop",         why: "25.5k in Y on SQ metal, plentiful outside school holidays.", source: "Point Hacks AU" },
      { programId: "velocity",   cabin: "business", miles: 78000, taxesAud: 160, metal: "SQ",           routing: "SYD–SIN",                 why: "Partner sweet spot — SQ J for 78k with friendly taxes.", source: "Australian Frequent Flyer" },
      { programId: "krisflyer",  cabin: "business", miles: 51000, taxesAud: 130, metal: "SQ",           routing: "SYD–SIN–DPS",             why: "SQ J to Bali via SIN — stopover-eligible on the return.", source: "Point Hacks AU" },
      { programId: "qantas",     cabin: "business", miles: 68400, taxesAud: 180, metal: "QF / CX",      routing: "SYD/MEL–SIN/BKK/HKG",     why: "Classic Reward on QF metal or CX partner — reliable J space.", source: "Point Hacks AU" },
    ],
  },
  {
    from: "oceania", to: "n_asia",
    headline: "Australia ↔ North Asia",
    strategy: "United on ANA is the surcharge escape; Qantas on JAL is the reliable book. Alaska on Cathay is a hidden long-haul deal.",
    bestFor: ["united", "qantas", "alaska"],
    spots: [
      { programId: "united",     cabin: "business", miles: 88000, taxesAud: 90,  metal: "NH",           routing: "SYD–NRT/HND",             why: "ANA J at 88k with no ANA-program YQ.", source: "One Mile at a Time" },
      { programId: "qantas",     cabin: "business", miles: 96400, taxesAud: 210, metal: "QF / JL",      routing: "SYD–HND / MEL–NRT",       why: "JAL and QF release genuine J to QFF at 96.4k.", source: "Point Hacks AU" },
      { programId: "alaska",     cabin: "business", miles: 60000, taxesAud: 90,  metal: "CX",           routing: "SYD–HKG",                 why: "Legacy AS→CX pricing at 60k J — a hidden long-haul deal.", source: "The Points Guy" },
      { programId: "krisflyer",  cabin: "economy",  miles: 30500, taxesAud: 130, metal: "SQ",           routing: "SYD–SIN–HKG/PVG",         why: "SQ Y one-way at 30.5k beats cash easily in peak season.", source: "Point Hacks AU" },
      { programId: "asia_miles", cabin: "business", miles: 85000, taxesAud: 220, metal: "CX",           routing: "SYD/MEL–HKG–TPE/ICN",     why: "Multi-carrier award chart makes CX metal + region-hop clean.", source: "God Save the Points" },
    ],
  },
  {
    from: "oceania", to: "s_asia",
    headline: "Australia ↔ India / South Asia",
    strategy: "KrisFlyer on SQ via SIN is the premium default. Velocity to SQ economy is best for cash-equivalent Y.",
    bestFor: ["krisflyer", "velocity", "qatar"],
    spots: [
      { programId: "krisflyer",  cabin: "business", miles: 95500, taxesAud: 210, metal: "SQ",           routing: "SYD–SIN–BOM/DEL/BLR",     why: "SQ J to India for 95.5k — best premium redemption to India ex-AU.", source: "Point Hacks AU" },
      { programId: "velocity",   cabin: "economy",  miles: 43500, taxesAud: 180, metal: "SQ",           routing: "SYD–SIN–BOM",             why: "43.5k Velocity for SQ Y to Mumbai, avoiding QF's Asia Y premium.", source: "Australian Frequent Flyer" },
      { programId: "qatar",      cabin: "business", miles: 90000, taxesAud: 260, metal: "QR Qsuite",    routing: "MEL–DOH–DEL",             why: "Qsuite for 90k — QR flies MEL–DOH nonstop.", source: "The Points Guy" },
    ],
  },
  {
    from: "oceania", to: "middle_east",
    headline: "Australia ↔ Middle East",
    strategy: "Emirates awards to DXB are showcase-only — great cabin, brutal taxes. United on *A partners routes around EK's surcharges.",
    bestFor: ["united", "qatar", "emirates"],
    spots: [
      { programId: "emirates",   cabin: "first",    miles: 156500,taxesAud: 900, metal: "EK A380",      routing: "SYD/MEL–DXB",             why: "The showcase First product — only worth it if you value the experience.", source: "One Mile at a Time" },
      { programId: "united",     cabin: "business", miles: 80000, taxesAud: 110, metal: "*A partners",  routing: "SYD–SIN/BKK–DXB",         why: "Skip EK surcharges — J under 80k with taxes near $100.", source: "Frequent Miler" },
      { programId: "qatar",      cabin: "business", miles: 70000, taxesAud: 260, metal: "QR",           routing: "MEL/SYD–DOH",             why: "QR Privilege Club Qsuite for 70k — cabin sold you the redemption.", source: "The Points Guy" },
    ],
  },

  // ─── South Asia (India) outbound ────────────────────────────────────
  {
    from: "s_asia", to: "europe",
    headline: "India ↔ Europe / UK",
    strategy: "Air India direct is the cleanest redemption. Aeroplan opens Star Alliance across Europe; KrisFlyer via SIN is the premium option.",
    bestFor: ["aeroplan", "krisflyer", "avios_ba"],
    spots: [
      { programId: "aeroplan",   cabin: "economy",  miles: 30000, taxesAud: 120, metal: "AI / LH / LX", routing: "DEL/BOM–LHR/FRA/ZRH",     why: "AI direct or *A partners at 30k Y — the simplest EU redemption from India.", source: "PointsFly" },
      { programId: "aeroplan",   cabin: "business", miles: 55000, taxesAud: 220, metal: "AI / LH",      routing: "DEL/BOM–FRA–everywhere",  why: "55k J to Europe — the go-to card-point spend for Indian issuers.", source: "PointsFly" },
      { programId: "krisflyer",  cabin: "business", miles: 68000, taxesAud: 260, metal: "SQ",           routing: "BOM/DEL–SIN–LHR/CDG",     why: "SQ J via SIN for 68k — premium cabin, long route.", source: "The Points Guy" },
      { programId: "avios_ba",   cabin: "business", miles: 75000, taxesAud: 420, metal: "BA",           routing: "DEL/BOM–LHR direct",      why: "BA direct — Avios Reward Flight Saver caps cash portion.", source: "God Save the Points" },
      { programId: "flyingblue", cabin: "premium",  miles: 50000, taxesAud: 220, metal: "AF / KL",      routing: "DEL/BOM–CDG/AMS",         why: "Flying Blue Promo Awards drop DEL/BOM–CDG PE monthly.", source: "The Points Guy" },
    ],
  },
  {
    from: "s_asia", to: "n_america",
    headline: "India ↔ USA / Canada",
    strategy: "Air India nonstop is the clean play — 40k Y / 130k J. Qatar Qsuite via DOH is the premium cabin king.",
    bestFor: ["aeroplan", "qatar", "krisflyer"],
    spots: [
      { programId: "aeroplan",   cabin: "economy",  miles: 40000, taxesAud: 140, metal: "AI direct",    routing: "DEL/BOM–EWR/JFK/ORD/YYZ", why: "AI nonstop at 40k Y — the cleanest long-haul Y from India.", source: "PointsFly" },
      { programId: "aeroplan",   cabin: "business", miles: 130000,taxesAud: 260, metal: "AI direct",    routing: "DEL/BOM–EWR/SFO/ORD",     why: "AI nonstop J at 130k — no partner surcharge premium.", source: "PointsFly" },
      { programId: "qatar",      cabin: "business", miles: 130000,taxesAud: 320, metal: "QR Qsuite",    routing: "DEL/BOM–DOH–ORD/JFK",     why: "Qsuite via DOH — best J seat in the sky.", source: "One Mile at a Time" },
      { programId: "krisflyer",  cabin: "business", miles: 132000,taxesAud: 240, metal: "SQ",           routing: "BOM/DEL–SIN–JFK/LAX/SFO", why: "SQ ultra-long-haul J via SIN.", source: "The Points Guy" },
      { programId: "avios_ba",   cabin: "business", miles: 160000,taxesAud: 480, metal: "AA / BA",      routing: "DEL–LHR–NYC",             why: "Avios AA partner J when saving surcharges via off-peak.", source: "God Save the Points" },
    ],
  },
  {
    from: "s_asia", to: "se_asia",
    headline: "India ↔ Southeast Asia",
    strategy: "The cheapest region in the whole guide. Air India direct at ~12k Y is a near-free hop; Atlas 1:2 halves that from Indian cards.",
    bestFor: ["aeroplan", "krisflyer", "avios_ba"],
    spots: [
      { programId: "aeroplan",   cabin: "economy",  miles: 12000, taxesAud: 60,  metal: "AI / SQ / TG", routing: "DEL/BOM–BKK/SIN/KUL/DPS", why: "Sub-12k Y to SEA — some of the lowest awards you'll ever book.", source: "PointsFly" },
      { programId: "aeroplan",   cabin: "business", miles: 50000, taxesAud: 120, metal: "AI / TG / SQ", routing: "DEL/BOM–SIN/BKK",         why: "50k J to SEA on AI or Thai/SQ partner metal.", source: "PointsFly" },
      { programId: "krisflyer",  cabin: "economy",  miles: 20000, taxesAud: 80,  metal: "SQ",           routing: "DEL/BOM–SIN",             why: "SQ Y for 20k — premium cabin experience on a short hop.", source: "The Points Guy" },
      { programId: "avios_ba",   cabin: "economy",  miles: 13000, taxesAud: 60,  metal: "QR",           routing: "DEL/BOM–DOH–BKK",         why: "Avios short-haul band via DOH — under-radar cheap.", source: "God Save the Points" },
    ],
  },
  {
    from: "s_asia", to: "n_asia",
    headline: "India ↔ North Asia",
    strategy: "Tokyo on JAL via Aeroplan or KrisFlyer; Seoul via AI direct or SQ via SIN.",
    bestFor: ["aeroplan", "krisflyer", "asia_miles"],
    spots: [
      { programId: "aeroplan",   cabin: "economy",  miles: 20000, taxesAud: 80,  metal: "JL / NH",      routing: "DEL/BOM–HND/NRT",         why: "JAL Y at 20k via Aeroplan — clean partner redemption.", source: "PointsFly" },
      { programId: "aeroplan",   cabin: "business", miles: 50000, taxesAud: 180, metal: "JL",           routing: "DEL/BOM–NRT/HND",         why: "JAL J at 50k — superb business product.", source: "PointsFly" },
      { programId: "krisflyer",  cabin: "business", miles: 62000, taxesAud: 180, metal: "SQ",           routing: "BOM/DEL–SIN–ICN/HND",     why: "SQ J via SIN — long but premium.", source: "The Points Guy" },
      { programId: "asia_miles", cabin: "business", miles: 70000, taxesAud: 180, metal: "CX",           routing: "DEL/BOM–HKG–NRT/ICN",     why: "Cathay J with a HKG stopover option.", source: "One Mile at a Time" },
    ],
  },
  {
    from: "s_asia", to: "oceania",
    headline: "India ↔ Australia / NZ",
    strategy: "Ultra-long-haul with brutal cash fares. Split cabins: economy on Air India, business on Aeroplan — 80k J beats AI's 130k.",
    bestFor: ["aeroplan", "krisflyer", "qantas"],
    spots: [
      { programId: "aeroplan",   cabin: "business", miles: 80000, taxesAud: 220, metal: "AI / *A",      routing: "DEL/BOM–SYD/MEL/BNE",     why: "80k Aeroplan J to Australia — the guide's biggest single win.", source: "PointsFly" },
      { programId: "aeroplan",   cabin: "economy",  miles: 40000, taxesAud: 160, metal: "AI",           routing: "DEL/BOM–SYD/MEL",         why: "Cheapest Y ex-India to AU on AI direct.", source: "PointsFly" },
      { programId: "krisflyer",  cabin: "business", miles: 108000,taxesAud: 300, metal: "SQ",           routing: "BOM/DEL–SIN–SYD/MEL",     why: "SQ J via SIN when AI space is gone.", source: "The Points Guy" },
    ],
  },

  // ─── Europe outbound ────────────────────────────────────────────────
  {
    from: "europe", to: "n_america",
    headline: "Europe ↔ North America",
    strategy: "Virgin Atlantic to Delta One is a legendary sweet spot. Avios off-peak on AA is the second play; LifeMiles on *A the third.",
    bestFor: ["virginatlantic", "avios_ba", "aeroplan"],
    spots: [
      { programId: "virginatlantic", cabin: "business", miles: 47500, taxesAud: 300, metal: "DL One", routing: "LHR/CDG–JFK/BOS/SEA",     why: "47.5k VS points on Delta One — the community's favourite TATL J.", source: "The Points Guy" },
      { programId: "avios_ba",   cabin: "business", miles: 70000, taxesAud: 380, metal: "AA off-peak", routing: "LHR–DFW/JFK/MIA",         why: "AA off-peak J from LHR — Avios caps surcharges better than BA metal.", source: "God Save the Points" },
      { programId: "aeroplan",   cabin: "business", miles: 70000, taxesAud: 140, metal: "LH / LX / AC", routing: "FRA/ZRH/GVA–YYZ/YUL",     why: "Aeroplan on *A carriers — no fuel surcharges out of Europe.", source: "Frequent Miler" },
      { programId: "flyingblue", cabin: "premium",  miles: 55000, taxesAud: 200, metal: "AF / KL / DL", routing: "CDG/AMS–JFK/ATL",         why: "Flying Blue PE Promo Awards — 50% off every month.", source: "The Points Guy" },
      { programId: "united",     cabin: "business", miles: 60000, taxesAud: 120, metal: "*A partners", routing: "FRA/MUC–EWR/IAD/ORD",     why: "60k J on *A — UA's Excursionist stopover can add a leg free.", source: "One Mile at a Time" },
    ],
  },
  {
    from: "europe", to: "n_asia",
    headline: "Europe ↔ North Asia",
    strategy: "ANA J via *A is the premium play. Turkish flies to almost every North Asia city on cheap Miles&Smiles pricing.",
    bestFor: ["united", "turkish", "flyingblue"],
    spots: [
      { programId: "united",     cabin: "business", miles: 88000, taxesAud: 180, metal: "NH",           routing: "FRA/LHR–NRT/HND",         why: "ANA J at 88k via UA — flagship *A redemption.", source: "One Mile at a Time" },
      { programId: "turkish",    cabin: "business", miles: 45000, taxesAud: 260, metal: "TK",           routing: "IST connections–HND/PVG", why: "TK Miles&Smiles J at 45k — the best-kept secret in *A.", source: "Frequent Miler" },
      { programId: "flyingblue", cabin: "business", miles: 80000, taxesAud: 280, metal: "AF / KL",      routing: "CDG/AMS–HND/PVG/ICN",     why: "AF/KL direct with Promo Awards knocking off 25%.", source: "The Points Guy" },
      { programId: "asia_miles", cabin: "business", miles: 75000, taxesAud: 200, metal: "CX",           routing: "LHR/CDG–HKG–TPE",         why: "CX J via HKG with region-hop bundled in.", source: "God Save the Points" },
    ],
  },
  {
    from: "europe", to: "se_asia",
    headline: "Europe ↔ Southeast Asia",
    strategy: "Turkish and LifeMiles are the surcharge-free plays. Flying Blue Promo Awards drop Bangkok/Singapore routes almost every month.",
    bestFor: ["turkish", "lifemiles", "flyingblue"],
    spots: [
      { programId: "turkish",    cabin: "business", miles: 45000, taxesAud: 260, metal: "TK",           routing: "IST–BKK/SIN/KUL",         why: "TK J at 45k — routinely open at Saver.", source: "One Mile at a Time" },
      { programId: "lifemiles",  cabin: "business", miles: 78000, taxesAud: 120, metal: "LH / SQ / TG", routing: "FRA/ZRH–SIN/BKK",         why: "*A on LH or SQ metal, no fuel surcharges, 25% sales.", source: "The Points Guy" },
      { programId: "flyingblue", cabin: "business", miles: 90000, taxesAud: 320, metal: "AF / KL",      routing: "CDG/AMS–SGN/BKK/SIN",     why: "Direct AF/KL — Promo Awards knock this to ~65k regularly.", source: "The Points Guy" },
    ],
  },
  {
    from: "europe", to: "s_asia",
    headline: "Europe ↔ India / South Asia",
    strategy: "Direct AI redemptions via Aeroplan are cleanest; Qatar Qsuite via DOH beats them on cabin.",
    bestFor: ["aeroplan", "qatar", "avios_ba"],
    spots: [
      { programId: "aeroplan",   cabin: "business", miles: 55000, taxesAud: 200, metal: "AI / LH",      routing: "LHR/FRA–DEL/BOM",         why: "AI or LH J at 55k — the default premium play.", source: "PointsFly" },
      { programId: "qatar",      cabin: "business", miles: 70000, taxesAud: 220, metal: "QR Qsuite",    routing: "LHR/CDG–DOH–DEL/BOM",     why: "Qsuite via DOH — usually the same as direct on cabin.", source: "One Mile at a Time" },
      { programId: "avios_ba",   cabin: "economy",  miles: 20000, taxesAud: 140, metal: "BA",           routing: "LHR–BOM/DEL/BLR",         why: "BA short-band Y — often cheaper than paid discount fares.", source: "God Save the Points" },
    ],
  },
  {
    from: "europe", to: "africa",
    headline: "Europe ↔ Africa",
    strategy: "Ethiopian, Kenya Airways and RwandAir via *A/SkyTeam partners are the value plays.",
    bestFor: ["united", "turkish", "flyingblue"],
    spots: [
      { programId: "united",     cabin: "business", miles: 80000, taxesAud: 180, metal: "ET / LH",      routing: "FRA/AMS–ADD/JNB/NBO",     why: "80k *A J to Africa — Ethiopian & LH have space.", source: "Frequent Miler" },
      { programId: "flyingblue", cabin: "business", miles: 75000, taxesAud: 300, metal: "AF / KL / KQ", routing: "CDG/AMS–NBO/JNB/CPT",     why: "AF/KL direct plus Kenya Airways partner metal.", source: "The Points Guy" },
      { programId: "turkish",    cabin: "business", miles: 52500, taxesAud: 220, metal: "TK",           routing: "IST–JNB/CPT/NBO",         why: "TK J at 52.5k — one of *A's best redemptions to Africa.", source: "One Mile at a Time" },
    ],
  },
  {
    from: "europe", to: "s_america",
    headline: "Europe ↔ South America",
    strategy: "Air France and Iberia fly it direct; LifeMiles on Avianca / Copa opens the connections.",
    bestFor: ["flyingblue", "lifemiles", "avios_ba"],
    spots: [
      { programId: "flyingblue", cabin: "business", miles: 100000,taxesAud: 340, metal: "AF / KL",      routing: "CDG/AMS–GRU/EZE/SCL",     why: "Direct AF/KL J; Promo Awards can drop to 70k.", source: "The Points Guy" },
      { programId: "lifemiles",  cabin: "business", miles: 78000, taxesAud: 160, metal: "AV / CM",      routing: "MAD/FRA–BOG–LIM/SCL",     why: "AV metal via BOG — 78k J with no fuel surcharges.", source: "Frequent Miler" },
      { programId: "avios_ba",   cabin: "business", miles: 85000, taxesAud: 320, metal: "IB / BA",      routing: "MAD/LHR–GRU/EZE",         why: "Iberia off-peak J at 85k from MAD.", source: "God Save the Points" },
    ],
  },

  // ─── North America outbound ─────────────────────────────────────────
  {
    from: "n_america", to: "s_america",
    headline: "North America ↔ South America",
    strategy: "Copa ConnectMiles on its own metal is unbeatable; LifeMiles opens the rest of Latin America without surcharges.",
    bestFor: ["connectmiles", "lifemiles", "aeroplan"],
    spots: [
      { programId: "connectmiles", cabin: "business", miles: 65000, taxesAud: 100, metal: "CM",         routing: "JFK/MIA/LAX–PTY–EZE/GRU/LIM", why: "CM on its own metal — 65k J with tiny taxes.", source: "Frequent Miler" },
      { programId: "lifemiles",  cabin: "business", miles: 63000, taxesAud: 90,  metal: "AV / CM",      routing: "IAD/MIA–BOG/PTY–deep SAM", why: "63k J on AV — legacy sweet spot, still open.", source: "One Mile at a Time" },
      { programId: "aeroplan",   cabin: "business", miles: 65000, taxesAud: 140, metal: "AC / CM",      routing: "YUL/YYZ–GRU/EZE/BOG",     why: "AC direct to GRU/EZE at Saver 65k.", source: "The Points Guy" },
      { programId: "smiles",     cabin: "business", miles: 90000, taxesAud: 300, metal: "G3 / partners", routing: "MIA/JFK–GRU domestic hop", why: "Smiles' own metal to BR is cheap on peso-devalued sales.", source: "The Points Guy" },
    ],
  },
  {
    from: "n_america", to: "n_asia",
    headline: "North America ↔ North Asia",
    strategy: "ANA on UA/Virgin Atlantic is the flagship. Alaska on JAL still holds legacy pricing.",
    bestFor: ["united", "virginatlantic", "alaska"],
    spots: [
      { programId: "united",     cabin: "business", miles: 88000, taxesAud: 90,  metal: "NH",           routing: "LAX/SFO/JFK–HND/NRT",     why: "ANA J at 88k — the flagship TPAC redemption.", source: "One Mile at a Time" },
      { programId: "virginatlantic", cabin: "business", miles: 60000, taxesAud: 140, metal: "NH / ANA", routing: "LAX/SFO–HND/NRT",         why: "60k VS on ANA — leverage every VS transfer partner.", source: "The Points Guy" },
      { programId: "alaska",     cabin: "business", miles: 60000, taxesAud: 90,  metal: "JL",           routing: "LAX/SFO/BOS–HND/NRT",     why: "AS→JL at 60k — legacy chart, community-adored.", source: "The Points Guy" },
      { programId: "aeroplan",   cabin: "business", miles: 75000, taxesAud: 160, metal: "AC / NH",      routing: "YVR/YYZ–NRT/ICN",         why: "AC direct + partners at 75k.", source: "Frequent Miler" },
    ],
  },
  {
    from: "n_america", to: "se_asia",
    headline: "North America ↔ Southeast Asia",
    strategy: "The longest routes in the sky. Turkish's 45k J is absurdly cheap; ANA and SQ are the premium picks.",
    bestFor: ["turkish", "united", "krisflyer"],
    spots: [
      { programId: "turkish",    cabin: "business", miles: 45000, taxesAud: 260, metal: "TK",           routing: "IAD/JFK/LAX–IST–SIN/BKK", why: "TK J at 45k — best value long-haul in existence.", source: "One Mile at a Time" },
      { programId: "united",     cabin: "business", miles: 92500, taxesAud: 120, metal: "NH / SQ / TG", routing: "LAX/EWR–NRT/SIN–BKK",     why: "UA on *A partners — Excursionist Perk adds a free segment.", source: "Frequent Miler" },
      { programId: "krisflyer",  cabin: "business", miles: 99000, taxesAud: 200, metal: "SQ",           routing: "JFK/LAX/EWR–SIN direct",  why: "SQ Ultra-Long-Haul J via SIN — flagship redemption.", source: "The Points Guy" },
      { programId: "aeroplan",   cabin: "business", miles: 87500, taxesAud: 220, metal: "*A",           routing: "YVR/YYZ–HKG/SIN",         why: "AC distance chart at ~87.5k J.", source: "The Points Guy" },
    ],
  },
  {
    from: "n_america", to: "europe",
    headline: "North America ↔ Europe",
    strategy: "This is the classic sweet-spot corridor. Virgin Atlantic to Delta One, LifeMiles to *A, Avios off-peak on AA — pick your flavour.",
    bestFor: ["virginatlantic", "lifemiles", "flyingblue"],
    spots: [
      { programId: "virginatlantic", cabin: "business", miles: 47500, taxesAud: 200, metal: "DL One", routing: "JFK/BOS/SEA–LHR/CDG",       why: "47.5k on DL One — the community-adored TATL play.", source: "The Points Guy" },
      { programId: "lifemiles",  cabin: "business", miles: 63000, taxesAud: 130, metal: "LH / LX / TK", routing: "east coast–FRA/ZRH/IST", why: "63k *A J from US east coast with no YQ.", source: "One Mile at a Time" },
      { programId: "avios_ba",   cabin: "business", miles: 60000, taxesAud: 380, metal: "AA off-peak", routing: "DFW/JFK/MIA–LHR/MAD",     why: "Off-peak AA J at 60k — surcharges via Iberia are lower.", source: "God Save the Points" },
      { programId: "flyingblue", cabin: "premium",  miles: 25000, taxesAud: 180, metal: "AF / KL",     routing: "JFK/ORD/ATL–CDG/AMS",     why: "PE Promo Award at 25k — the single cheapest TATL award.", source: "The Points Guy" },
      { programId: "aeroplan",   cabin: "business", miles: 70000, taxesAud: 140, metal: "AC / *A",     routing: "YYZ/YUL–LHR/FRA/ZRH",     why: "AC direct or *A partners — no fuel surcharges outbound.", source: "Frequent Miler" },
    ],
  },
  {
    from: "n_america", to: "middle_east",
    headline: "North America ↔ Middle East",
    strategy: "Qatar Qsuite via DOH is the target; Etihad Guest on its own metal is a strong alternative.",
    bestFor: ["qatar", "avios_ba", "etihad"],
    spots: [
      { programId: "qatar",      cabin: "business", miles: 130000,taxesAud: 300, metal: "QR Qsuite",    routing: "US hubs–DOH",             why: "Qsuite direct — the world's best J seat.", source: "One Mile at a Time" },
      { programId: "avios_ba",   cabin: "business", miles: 140000,taxesAud: 340, metal: "QR",           routing: "US hubs–DOH",             why: "Avios on QR — same cabin, different chart.", source: "The Points Guy" },
      { programId: "etihad",     cabin: "business", miles: 90000, taxesAud: 240, metal: "EY",           routing: "JFK/ORD/YYZ–AUH",         why: "EY Guest on own metal — 90k J and lounge access.", source: "Frequent Miler" },
    ],
  },

  // ─── Intra-region highlights ────────────────────────────────────────
  {
    from: "se_asia", to: "n_asia",
    headline: "Southeast Asia ↔ North Asia",
    strategy: "Cathay, ANA and SQ all price cheaply on Avios / Asia Miles / KrisFlyer for intra-Asia hops.",
    bestFor: ["asia_miles", "avios_ba", "krisflyer"],
    spots: [
      { programId: "asia_miles", cabin: "business", miles: 45000, taxesAud: 80,  metal: "CX",           routing: "SIN/BKK/KUL–HKG–NRT/ICN", why: "CX J on distance chart — 45k with HKG stopover.", source: "God Save the Points" },
      { programId: "avios_ba",   cabin: "economy",  miles: 11000, taxesAud: 60,  metal: "CX / MH",      routing: "SIN/BKK–HKG",             why: "BA short-haul band on CX — 11k Y each way.", source: "Point Hacks AU" },
      { programId: "krisflyer",  cabin: "business", miles: 43000, taxesAud: 120, metal: "SQ",           routing: "SIN–HND/ICN/HKG",         why: "SQ J on regional widebody for 43k.", source: "The Points Guy" },
    ],
  },
  {
    from: "africa", to: "n_america",
    headline: "Africa ↔ North America",
    strategy: "Ethiopian and Kenya Airways open up otherwise-brutal cash fares. Aeroplan and Flying Blue are the tools.",
    bestFor: ["aeroplan", "flyingblue", "united"],
    spots: [
      { programId: "aeroplan",   cabin: "business", miles: 100000,taxesAud: 200, metal: "ET",           routing: "JNB/NBO–ADD–IAD/EWR",     why: "Ethiopian J via ADD on Aeroplan — 100k with low YQ.", source: "Frequent Miler" },
      { programId: "flyingblue", cabin: "business", miles: 120000,taxesAud: 320, metal: "KQ / AF",      routing: "NBO/CPT/JNB–CDG–US",      why: "Kenya Airways partner metal on Flying Blue.", source: "The Points Guy" },
      { programId: "united",     cabin: "business", miles: 88000, taxesAud: 140, metal: "*A",           routing: "JNB–FRA–US hubs",         why: "UA on *A with no surcharges — the reliable option.", source: "One Mile at a Time" },
    ],
  },
];

export function corridorFor(from: RegionId, to: RegionId): Corridor | null {
  return (
    CORRIDORS.find((c) => c.from === from && c.to === to) ??
    // Symmetric — the redemption menu applies in both directions.
    CORRIDORS.find((c) => c.from === to && c.to === from) ??
    null
  );
}

export function allCorridors(): Corridor[] {
  return CORRIDORS;
}

// -----------------------------------------------------------------------
// Editorial cards
// -----------------------------------------------------------------------

export type Play = { title: string; body: string; tag: string };

export const ADVANCED_PLAYS: Play[] = [
  { tag: "Split", title: "Split the cabin",
    body: "Book economy through the cheapest program and business through another — e.g. Air India economy + Aeroplan business to Australia. Mix and match programs on the same trip for the lowest total." },
  { tag: "Ratio", title: "Chase the 1:2 transfer",
    body: "A card at 1:2 effectively halves every award. Concentrate spend where the ratio is best, hold points in the card, transfer only after you've found space." },
  { tag: "Partners", title: "Use partners for access, not just metal",
    body: "Aeroplan, LifeMiles and Avios open airlines you can't reach directly — sometimes with better award space than the operating airline's own program." },
  { tag: "Timing", title: "Book outbound early, return later",
    body: "Award seats release in waves — 331 days out, then again inside 14 days. Lock what you can now, add segments as space opens." },
  { tag: "Custody", title: "Hold points in the card, not the airline",
    body: "Transfer only after you've confirmed space. It keeps your options open and protects against airline devaluations, which happen with little notice." },
  { tag: "Stopover", title: "Stopover rules quietly double the trip value",
    body: "KrisFlyer, Aeroplan and ANA allow a stopover on award tickets — turning one-way redemption into a two-city trip for the same points. Plan the stopover before you book, not after." },
];

export const COMMON_MISTAKES: Play[] = [
  { tag: "Order", title: "Transferring before finding space",
    body: "The #1 error. Points are one-way and non-refundable. A seat that isn't there won't appear because you transferred — search first, transfer second, book immediately." },
  { tag: "Cash", title: "Ignoring surcharges",
    body: "A 'cheap' award with heavy carrier surcharges can cost more than a sale fare. Always price the cash portion — Qantas-Emirates to Europe stacks $1,200+ in surcharges." },
  { tag: "Cabin", title: "Wrong card for the cabin",
    body: "A 5:4 card for economy, or an Air India-only card for a route where Aeroplan is half the price. Read the corridor before you transfer." },
  { tag: "Hoard", title: "Hoarding points forever",
    body: "Programs devalue. Earn with a plan and redeem within a reasonable horizon — 12–18 months from earn is a healthy target." },
  { tag: "Compare", title: "Booking cash when an award exists",
    body: "Especially in business — always price the award first. Even at 1c/point, a $10,000 J fare against 100,000 points is a no-brainer." },
];

export const GOLDEN_RULE = {
  title: "Seat first. Math second. Transfer third. Book immediately.",
  body: "That single discipline prevents almost every expensive mistake in points travel. Points are one-way — a transfer you can't use is a transfer you've lost.",
};