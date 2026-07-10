/** Small curated list of IATA airports used to power search autocomplete. */
export type Airport = { code: string; city: string; country: string };

export const AIRPORTS: Airport[] = [
  // Australia / NZ / Pacific
  { code: "SYD", city: "Sydney", country: "Australia" },
  { code: "MEL", city: "Melbourne", country: "Australia" },
  { code: "BNE", city: "Brisbane", country: "Australia" },
  { code: "PER", city: "Perth", country: "Australia" },
  { code: "ADL", city: "Adelaide", country: "Australia" },
  { code: "OOL", city: "Gold Coast", country: "Australia" },
  { code: "CBR", city: "Canberra", country: "Australia" },
  { code: "HBA", city: "Hobart", country: "Australia" },
  { code: "AKL", city: "Auckland", country: "New Zealand" },
  { code: "CHC", city: "Christchurch", country: "New Zealand" },
  { code: "WLG", city: "Wellington", country: "New Zealand" },
  { code: "NAN", city: "Nadi", country: "Fiji" },
  { code: "PPT", city: "Papeete", country: "French Polynesia" },
  { code: "HNL", city: "Honolulu", country: "United States" },
  // Asia
  { code: "SIN", city: "Singapore", country: "Singapore" },
  { code: "HKG", city: "Hong Kong", country: "Hong Kong" },
  { code: "NRT", city: "Tokyo Narita", country: "Japan" },
  { code: "HND", city: "Tokyo Haneda", country: "Japan" },
  { code: "KIX", city: "Osaka", country: "Japan" },
  { code: "ICN", city: "Seoul Incheon", country: "South Korea" },
  { code: "TPE", city: "Taipei", country: "Taiwan" },
  { code: "BKK", city: "Bangkok", country: "Thailand" },
  { code: "KUL", city: "Kuala Lumpur", country: "Malaysia" },
  { code: "CGK", city: "Jakarta", country: "Indonesia" },
  { code: "DPS", city: "Bali Denpasar", country: "Indonesia" },
  { code: "MNL", city: "Manila", country: "Philippines" },
  { code: "SGN", city: "Ho Chi Minh City", country: "Vietnam" },
  { code: "HAN", city: "Hanoi", country: "Vietnam" },
  { code: "PEK", city: "Beijing Capital", country: "China" },
  { code: "PKX", city: "Beijing Daxing", country: "China" },
  { code: "PVG", city: "Shanghai Pudong", country: "China" },
  { code: "CAN", city: "Guangzhou", country: "China" },
  { code: "DEL", city: "Delhi", country: "India" },
  { code: "BOM", city: "Mumbai", country: "India" },
  { code: "BLR", city: "Bengaluru", country: "India" },
  { code: "MAA", city: "Chennai", country: "India" },
  { code: "CMB", city: "Colombo", country: "Sri Lanka" },
  // Middle East
  { code: "DXB", city: "Dubai", country: "UAE" },
  { code: "AUH", city: "Abu Dhabi", country: "UAE" },
  { code: "DOH", city: "Doha", country: "Qatar" },
  { code: "AMM", city: "Amman", country: "Jordan" },
  { code: "TLV", city: "Tel Aviv", country: "Israel" },
  // Europe
  { code: "LHR", city: "London Heathrow", country: "United Kingdom" },
  { code: "LGW", city: "London Gatwick", country: "United Kingdom" },
  { code: "MAN", city: "Manchester", country: "United Kingdom" },
  { code: "EDI", city: "Edinburgh", country: "United Kingdom" },
  { code: "DUB", city: "Dublin", country: "Ireland" },
  { code: "CDG", city: "Paris CDG", country: "France" },
  { code: "ORY", city: "Paris Orly", country: "France" },
  { code: "NCE", city: "Nice", country: "France" },
  { code: "AMS", city: "Amsterdam", country: "Netherlands" },
  { code: "FRA", city: "Frankfurt", country: "Germany" },
  { code: "MUC", city: "Munich", country: "Germany" },
  { code: "BER", city: "Berlin", country: "Germany" },
  { code: "ZRH", city: "Zurich", country: "Switzerland" },
  { code: "GVA", city: "Geneva", country: "Switzerland" },
  { code: "VIE", city: "Vienna", country: "Austria" },
  { code: "MAD", city: "Madrid", country: "Spain" },
  { code: "BCN", city: "Barcelona", country: "Spain" },
  { code: "LIS", city: "Lisbon", country: "Portugal" },
  { code: "FCO", city: "Rome Fiumicino", country: "Italy" },
  { code: "MXP", city: "Milan Malpensa", country: "Italy" },
  { code: "ATH", city: "Athens", country: "Greece" },
  { code: "IST", city: "Istanbul", country: "Turkey" },
  { code: "CPH", city: "Copenhagen", country: "Denmark" },
  { code: "ARN", city: "Stockholm", country: "Sweden" },
  { code: "OSL", city: "Oslo", country: "Norway" },
  { code: "HEL", city: "Helsinki", country: "Finland" },
  { code: "KEF", city: "Reykjavik", country: "Iceland" },
  { code: "WAW", city: "Warsaw", country: "Poland" },
  { code: "PRG", city: "Prague", country: "Czech Republic" },
  // Americas
  { code: "LAX", city: "Los Angeles", country: "United States" },
  { code: "SFO", city: "San Francisco", country: "United States" },
  { code: "SEA", city: "Seattle", country: "United States" },
  { code: "JFK", city: "New York JFK", country: "United States" },
  { code: "EWR", city: "Newark", country: "United States" },
  { code: "LGA", city: "New York LaGuardia", country: "United States" },
  { code: "BOS", city: "Boston", country: "United States" },
  { code: "IAD", city: "Washington Dulles", country: "United States" },
  { code: "DCA", city: "Washington Reagan", country: "United States" },
  { code: "MIA", city: "Miami", country: "United States" },
  { code: "MCO", city: "Orlando", country: "United States" },
  { code: "ATL", city: "Atlanta", country: "United States" },
  { code: "ORD", city: "Chicago O'Hare", country: "United States" },
  { code: "DFW", city: "Dallas Fort Worth", country: "United States" },
  { code: "IAH", city: "Houston", country: "United States" },
  { code: "DEN", city: "Denver", country: "United States" },
  { code: "PHX", city: "Phoenix", country: "United States" },
  { code: "LAS", city: "Las Vegas", country: "United States" },
  { code: "SAN", city: "San Diego", country: "United States" },
  { code: "YVR", city: "Vancouver", country: "Canada" },
  { code: "YYZ", city: "Toronto", country: "Canada" },
  { code: "YUL", city: "Montreal", country: "Canada" },
  { code: "MEX", city: "Mexico City", country: "Mexico" },
  { code: "CUN", city: "Cancun", country: "Mexico" },
  { code: "GRU", city: "Sao Paulo", country: "Brazil" },
  { code: "GIG", city: "Rio de Janeiro", country: "Brazil" },
  { code: "EZE", city: "Buenos Aires", country: "Argentina" },
  { code: "SCL", city: "Santiago", country: "Chile" },
  { code: "LIM", city: "Lima", country: "Peru" },
  // Africa
  { code: "JNB", city: "Johannesburg", country: "South Africa" },
  { code: "CPT", city: "Cape Town", country: "South Africa" },
  { code: "CAI", city: "Cairo", country: "Egypt" },
  { code: "NBO", city: "Nairobi", country: "Kenya" },
  { code: "ADD", city: "Addis Ababa", country: "Ethiopia" },
  { code: "CMN", city: "Casablanca", country: "Morocco" },
  { code: "MRU", city: "Mauritius", country: "Mauritius" },
];

export const AIRPORT_BY_CODE: Record<string, Airport> = Object.fromEntries(
  AIRPORTS.map((a) => [a.code, a]),
);

/** Continent groupings for one-tap multi-airport searches. */
export type Continent =
  | "oceania"
  | "asia"
  | "middle-east"
  | "europe"
  | "north-america"
  | "south-america"
  | "africa";

export const CONTINENTS: { value: Continent; label: string; codes: string[] }[] = [
  {
    value: "oceania",
    label: "Oceania",
    codes: ["SYD", "MEL", "BNE", "PER", "ADL", "OOL", "CBR", "HBA", "AKL", "CHC", "WLG", "NAN", "PPT"],
  },
  {
    value: "asia",
    label: "Asia",
    codes: [
      "SIN", "HKG", "NRT", "HND", "KIX", "ICN", "TPE", "BKK", "KUL", "CGK", "DPS",
      "MNL", "SGN", "HAN", "PEK", "PKX", "PVG", "CAN", "DEL", "BOM", "BLR", "MAA", "CMB",
    ],
  },
  {
    value: "middle-east",
    label: "Middle East",
    codes: ["DXB", "AUH", "DOH", "AMM", "TLV"],
  },
  {
    value: "europe",
    label: "Europe",
    codes: [
      "LHR", "LGW", "MAN", "EDI", "DUB", "CDG", "ORY", "NCE", "AMS", "FRA", "MUC", "BER",
      "ZRH", "GVA", "VIE", "MAD", "BCN", "LIS", "FCO", "MXP", "ATH", "IST", "CPH", "ARN",
      "OSL", "HEL", "KEF", "WAW", "PRG",
    ],
  },
  {
    value: "north-america",
    label: "North America",
    codes: [
      "LAX", "SFO", "SEA", "JFK", "EWR", "LGA", "BOS", "IAD", "DCA", "MIA", "MCO", "ATL",
      "ORD", "DFW", "IAH", "DEN", "PHX", "LAS", "SAN", "HNL", "YVR", "YYZ", "YUL", "MEX", "CUN",
    ],
  },
  {
    value: "south-america",
    label: "South America",
    codes: ["GRU", "GIG", "EZE", "SCL", "LIM"],
  },
  {
    value: "africa",
    label: "Africa",
    codes: ["JNB", "CPT", "CAI", "NBO", "ADD", "CMN", "MRU"],
  },
];

/** Metro-area IATA codes: one tap expands to every airport in a city. */
export const METROS: { code: string; label: string; airports: string[] }[] = [
  { code: "NYC", label: "New York", airports: ["JFK", "EWR", "LGA"] },
  { code: "LON", label: "London", airports: ["LHR", "LGW", "MAN"] },
  { code: "TYO", label: "Tokyo", airports: ["HND", "NRT"] },
  { code: "PAR", label: "Paris", airports: ["CDG", "ORY"] },
  { code: "MIL", label: "Milan", airports: ["MXP"] },
  { code: "ROM", label: "Rome", airports: ["FCO"] },
  { code: "WAS", label: "Washington", airports: ["IAD", "DCA"] },
  { code: "CHI", label: "Chicago", airports: ["ORD"] },
  { code: "BJS", label: "Beijing", airports: ["PEK", "PKX"] },
  { code: "SHA", label: "Shanghai", airports: ["PVG"] },
  { code: "SEL", label: "Seoul", airports: ["ICN"] },
  { code: "OSA", label: "Osaka", airports: ["KIX"] },
  { code: "BER", label: "Berlin", airports: ["BER"] },
  { code: "STO", label: "Stockholm", airports: ["ARN"] },
];

// ---------------------------------------------------------------------------
// Global airport search (lazy-loaded)
// ---------------------------------------------------------------------------
// The curated `AIRPORTS` list above powers hero autocomplete for the routes
// we know and love. For everything else, we lazy-load a compact worldwide
// IATA index (~260KB gzipped smaller) so users can search by code (HYD) or
// city name ("Hyderabad") without us having to hand-curate every route.

type CompactAirport = { c: string; y: string; n: string };

let fullIndexPromise: Promise<Airport[]> | null = null;

/** 2-letter ISO country codes → human-readable names via the browser's
 *  built-in Intl.DisplayNames (no data cost). Falls back to the code. */
function countryName(iso2: string): string {
  try {
    // eslint-disable-next-line new-cap
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    return dn.of(iso2) ?? iso2;
  } catch {
    return iso2;
  }
}

async function loadFullIndex(): Promise<Airport[]> {
  if (!fullIndexPromise) {
    fullIndexPromise = import("@/data/airports-full.json").then((mod) => {
      const raw = (mod.default ?? mod) as CompactAirport[];
      return raw.map((a) => ({
        code: a.c,
        city: a.y,
        country: countryName(a.n),
      }));
    });
  }
  return fullIndexPromise;
}

/** Warm the global airport index on idle so the first keystroke is instant. */
export function warmAirportIndex(): void {
  if (typeof window === "undefined") return;
  const idle =
    (window as unknown as { requestIdleCallback?: (cb: () => void) => void })
      .requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 400));
  idle(() => {
    void loadFullIndex();
  });
}

/**
 * Fuzzy-ish search across code, city and country. Returns at most `limit`
 * matches, curated list first (so hand-picked "Sydney" beats "Sidney, MT").
 */
export async function searchAirports(query: string, limit = 12): Promise<Airport[]> {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const all = await loadFullIndex();

  // Rank: exact code (0) > code prefix (1) > city startsWith (2) > city
  // contains (3) > country contains (4). Lower score = better.
  const scored: { a: Airport; s: number }[] = [];
  for (const a of all) {
    const code = a.code;
    const cityU = a.city.toUpperCase();
    const countryU = a.country.toUpperCase();
    let s = -1;
    if (code === q) s = 0;
    else if (code.startsWith(q)) s = 1;
    else if (cityU.startsWith(q)) s = 2;
    else if (cityU.includes(q)) s = 3;
    else if (countryU.includes(q)) s = 4;
    if (s >= 0) scored.push({ a, s });
  }
  scored.sort((x, y) => x.s - y.s || x.a.code.localeCompare(y.a.code));
  return scored.slice(0, limit).map((x) => x.a);
}

/** Sync lookup for a single code — checks curated first, then the full
 *  index if it has already been loaded. Returns undefined otherwise. */
export function lookupAirport(code: string): Airport | undefined {
  return AIRPORT_BY_CODE[code.toUpperCase()];
}
