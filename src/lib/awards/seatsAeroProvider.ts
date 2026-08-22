import type { AwardItinerary, AwardProvider, Cabin, SearchInput } from "./types";
import { getProgram } from "@/lib/programs";

/**
 * seats.aero Partner API adapter.
 * Docs: https://developers.seats.aero/reference/cached-search
 *
 * Endpoint: GET https://seats.aero/partnerapi/search
 * Auth:    Partner-Authorization: <API key>
 *
 * The cached-search endpoint returns daily availability per (origin, destination,
 * date, source). Each result advertises which cabins have award space and the
 * mileage cost for each. We expand each AvailabilityV2 into one itinerary per
 * relevant cabin so the UI can list them as bookable options.
 */

const BASE_URL = "https://seats.aero/partnerapi/search";

// We query ALL seats.aero sources (no `sources` filter). Incoming source
// slugs map to our program-catalog ids; slugs whose id differs are renamed
// here, everything else uses the slug as the id. Unknown slugs still render
// via the fallback (slug as id/name) so new seats.aero sources never vanish.
const SOURCE_TO_PROGRAM: Record<string, string> = {
  // Virgin Australia Velocity — seats.aero has used both slugs across API versions.
  virginaustralia: "velocity",
  velocity: "velocity",
  // Singapore KrisFlyer
  singapore: "krisflyer",
  singaporeairlines: "krisflyer",
  // American AAdvantage
  americanairlines: "american",
  aa: "american",
  // Avianca LifeMiles
  avianca: "lifemiles",
  // British Airways Avios
  britishairways: "avios_ba",
  ba: "avios_ba",
  // Cathay Asia Miles
  cathay: "asia_miles",
  cathaypacific: "asia_miles",
  // Air France / KLM Flying Blue
  airfrance: "flyingblue",
  klm: "flyingblue",
  // Qatar Privilege Club
  qatarairways: "qatar",
  // Aeroplan
  aircanada: "aeroplan",
};

type RawAvailability = {
  ID: string;
  Route?: { OriginAirport?: string; DestinationAirport?: string };
  Date?: string;
  Source?: string;
  UpdatedAt?: string;
  YAvailable?: boolean;
  YMileageCost?: string;
  YRemainingSeats?: number;
  YDirect?: boolean;
  YAirlines?: string;
  WAvailable?: boolean;
  WMileageCost?: string;
  WRemainingSeats?: number;
  WDirect?: boolean;
  WAirlines?: string;
  JAvailable?: boolean;
  JMileageCost?: string;
  JRemainingSeats?: number;
  JDirect?: boolean;
  JAirlines?: string;
  FAvailable?: boolean;
  FMileageCost?: string;
  FRemainingSeats?: number;
  FDirect?: boolean;
  FAirlines?: string;
  YTotalTaxes?: number;
  WTotalTaxes?: number;
  JTotalTaxes?: number;
  FTotalTaxes?: number;
  TaxesCurrency?: string; // usually "USD"
  AvailabilityTrips?: RawTrip[];
};

type RawTrip = {
  ID: string;
  AvailabilityID?: string;
  TotalDuration?: number;
  Stops?: number;
  Carriers?: string;
  RemainingSeats?: number;
  MileageCost?: number;
  TotalTaxes?: number;
  TaxesCurrency?: string;
  OriginAirport?: string;
  DestinationAirport?: string;
  FlightNumbers?: string;
  DepartsAt?: string;
  ArrivesAt?: string;
  Cabin?: string;
  Source?: string;
  UpdatedAt?: string;
};

type SearchResponse = {
  data?: RawAvailability[];
  count?: number;
  hasMore?: boolean;
  cursor?: number;
};

const CABIN_TO_FIELD: Record<Cabin, "Y" | "W" | "J" | "F"> = {
  economy: "Y",
  premium: "W",
  business: "J",
  first: "F",
};

// Approximate FX rates → USD. seats.aero returns TotalTaxes in the smallest
// unit of TaxesCurrency, and our itinerary shape carries taxes as USD (the
// UI converts USD → AUD downstream). Rates only need to be roughly right;
// they're refreshed manually.
const FX_TO_USD: Record<string, number> = {
  USD: 1,
  AUD: 0.65,
  NZD: 0.6,
  EUR: 1.08,
  GBP: 1.27,
  CAD: 0.73,
  SGD: 0.74,
  HKD: 0.128,
  JPY: 0.0067,
  CNY: 0.14,
  KRW: 0.00072,
  INR: 0.012,
  AED: 0.27,
  QAR: 0.27,
  CHF: 1.12,
  THB: 0.028,
  MYR: 0.21,
  IDR: 0.000063,
  TWD: 0.031,
  PHP: 0.017,
  ZAR: 0.055,
  MXN: 0.055,
  BRL: 0.2,
};

export class SeatsAeroProvider implements AwardProvider {
  readonly name = "seats.aero" as const;

  constructor(private readonly apiKey: string) {}

  async search(input: SearchInput): Promise<AwardItinerary[]> {
    const endDate = input.dateTo ?? input.date;
    // No cabin filter and no `sources` filter — every trip for every program
    // seats.aero tracks is returned. The UI renders one row per trip with
    // separate cells for Economy / Premium / Business / First.
    const params = new URLSearchParams({
      origin_airport: input.from.toUpperCase(),
      destination_airport: input.to.toUpperCase(),
      start_date: input.date,
      end_date: endDate,
      take: "1000",
      order_by: "lowest_mileage",
      include_trips: "true",
    });

    const url = `${BASE_URL}?${params.toString()}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Partner-Authorization": this.apiKey,
        accept: "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`seats.aero ${res.status} ${res.statusText}: ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as SearchResponse;
    const rows = json.data ?? [];

    const out: AwardItinerary[] = [];
    for (const row of rows) {
      const trips = (row.AvailabilityTrips ?? []).filter(
        (t) => (t.MileageCost ?? 0) > 0 && isCabin(t.Cabin),
      );
      if (trips.length > 0) {
        for (const trip of trips) {
          const cabin = trip.Cabin as Cabin;
          out.push(this.tripToItinerary(row, trip, cabin, input.pax));
        }
      } else {
        // Fallback: source didn't return trip breakdown — emit one itinerary
        // per cabin the availability row itself advertises.
        for (const cabin of ALL_CABINS) {
          const it = this.rowToItinerary(row, cabin, input.pax);
          if (it) out.push(it);
        }
      }
    }
    return out;
  }

  private tripToItinerary(
    row: RawAvailability,
    trip: RawTrip,
    cabin: Cabin,
    pax: number,
  ): AwardItinerary {
    const sourceSlug = trip.Source ?? row.Source ?? "";
    const programId = SOURCE_TO_PROGRAM[sourceSlug] ?? sourceSlug;
    const program = getProgram(programId);
    const miles = trip.MileageCost ?? 0;
    const currency = (trip.TaxesCurrency ?? row.TaxesCurrency ?? "USD").toUpperCase();
    const fx = FX_TO_USD[currency] ?? 1;
    const taxes = ((trip.TotalTaxes ?? 0) / 100) * fx;
    const stops = trip.Stops ?? 0;
    const carrier = (trip.Carriers ?? "").split(",")[0]?.trim() || "Multiple";
    const tripKey = trip.ID || `${row.ID}-${trip.DepartsAt ?? ""}`;
    return {
      id: `${trip.ID}-${CABIN_TO_FIELD[cabin]}`,
      tripKey,
      programId,
      programName: program?.name ?? sourceSlug,
      carrier,
      flightNo: trip.FlightNumbers ?? "",
      from: trip.OriginAirport ?? row.Route?.OriginAirport ?? "",
      to: trip.DestinationAirport ?? row.Route?.DestinationAirport ?? "",
      depart: trip.DepartsAt ?? row.Date ?? "",
      arrive: trip.ArrivesAt ?? row.Date ?? "",
      durationMin: trip.TotalDuration ?? 0,
      stops,
      cabin,
      miles: miles * pax,
      pax,
      taxesUsd: Math.round(taxes * pax),
      seats: trip.RemainingSeats ?? 0,
      direct: stops === 0,
      updatedAt: trip.UpdatedAt ?? row.UpdatedAt,
    };
  }

  private rowToItinerary(row: RawAvailability, cabin: Cabin, pax: number): AwardItinerary | null {
    const field = CABIN_TO_FIELD[cabin];
    const anyRow = row as unknown as Record<string, unknown>;
    const available = anyRow[`${field}Available`] as boolean | undefined;
    if (!available) return null;

    const mileageStr = anyRow[`${field}MileageCost`] as string | undefined;
    const miles = mileageStr ? parseInt(mileageStr, 10) : 0;
    if (!miles) return null;

    const sourceSlug = row.Source ?? "";
    const programId = SOURCE_TO_PROGRAM[sourceSlug] ?? sourceSlug;
    const program = getProgram(programId);

    // seats.aero returns TotalTaxes in the smallest denomination of
    // TaxesCurrency (i.e. cents). Convert to whole units, then FX to USD so
    // downstream AUD conversion (× ~1.55) produces sane amounts regardless
    // of the source currency (many programs quote AUD, SGD, GBP, etc.).
    const taxesRaw = (anyRow[`${field}TotalTaxes`] as number | undefined) ?? 0;
    const currency = (row.TaxesCurrency ?? "USD").toUpperCase();
    const fx = FX_TO_USD[currency] ?? 1;
    const taxes = (taxesRaw / 100) * fx;
    const seats = (anyRow[`${field}RemainingSeats`] as number | undefined) ?? 0;
    const direct = (anyRow[`${field}Direct`] as boolean | undefined) ?? false;
    const airlines = (anyRow[`${field}Airlines`] as string | undefined) ?? "";
    const carrier = airlines.split(",")[0]?.trim() || "Multiple";

    return {
      id: `${row.ID}-${field}`,
      tripKey: row.ID,
      programId,
      programName: program?.name ?? sourceSlug,
      carrier,
      flightNo: "",
      from: row.Route?.OriginAirport ?? "",
      to: row.Route?.DestinationAirport ?? "",
      depart: row.Date ?? "",
      arrive: row.Date ?? "",
      durationMin: 0,
      stops: direct ? 0 : 1,
      cabin,
      miles: miles * pax,
      pax,
      taxesUsd: Math.round(taxes * pax),
      seats,
      direct,
      updatedAt: row.UpdatedAt,
    };
  }
}

const ALL_CABINS: Cabin[] = ["economy", "premium", "business", "first"];
function isCabin(x: unknown): x is Cabin {
  return x === "economy" || x === "premium" || x === "business" || x === "first";
}
