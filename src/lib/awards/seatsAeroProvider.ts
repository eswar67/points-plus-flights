import type { AwardItinerary, AwardProvider, Cabin, SearchInput } from "./types";

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

// Map our internal program ids -> seats.aero "source" identifiers.
// (seats.aero source slugs: aeroplan, alaska, american, delta, united, lifemiles,
//  emirates, etihad, virginatlantic, virginaustralia, qantas, singapore, ...)
const PROGRAM_TO_SOURCE: Record<string, string> = {
  qantas: "qantas",
  velocity: "virginaustralia",
  krisflyer: "singapore",
  emirates: "emirates",
  united: "united",
  lifemiles: "lifemiles",
};

const SOURCE_TO_PROGRAM = Object.fromEntries(
  Object.entries(PROGRAM_TO_SOURCE).map(([k, v]) => [v, k]),
);

const PROGRAM_NAMES: Record<string, string> = {
  qantas: "Qantas Frequent Flyer",
  velocity: "Virgin Velocity",
  krisflyer: "Singapore KrisFlyer",
  emirates: "Emirates Skywards",
  united: "United MileagePlus",
  lifemiles: "Avianca LifeMiles",
};

type RawAvailability = {
  ID: string;
  Route?: { OriginAirport?: string; DestinationAirport?: string };
  Date?: string;
  Source?: string;
  UpdatedAt?: string;
  YAvailable?: boolean; YMileageCost?: string; YRemainingSeats?: number; YDirect?: boolean; YAirlines?: string;
  WAvailable?: boolean; WMileageCost?: string; WRemainingSeats?: number; WDirect?: boolean; WAirlines?: string;
  JAvailable?: boolean; JMileageCost?: string; JRemainingSeats?: number; JDirect?: boolean; JAirlines?: string;
  FAvailable?: boolean; FMileageCost?: string; FRemainingSeats?: number; FDirect?: boolean; FAirlines?: string;
  YTotalTaxes?: number; WTotalTaxes?: number; JTotalTaxes?: number; FTotalTaxes?: number;
  TaxesCurrency?: string; // usually "USD"
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

export class SeatsAeroProvider implements AwardProvider {
  readonly name = "seats.aero" as const;

  constructor(private readonly apiKey: string) {}

  async search(input: SearchInput): Promise<AwardItinerary[]> {
    const params = new URLSearchParams({
      origin_airport: input.from.toUpperCase(),
      destination_airport: input.to.toUpperCase(),
      start_date: input.date,
      end_date: input.date,
      cabin: input.cabin,
      take: "200",
      order_by: "lowest_mileage",
      sources: Object.values(PROGRAM_TO_SOURCE).join(","),
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

    return rows
      .map((row) => this.toItinerary(row, input))
      .filter((x): x is AwardItinerary => x !== null);
  }

  private toItinerary(row: RawAvailability, input: SearchInput): AwardItinerary | null {
    const field = CABIN_TO_FIELD[input.cabin];
    const available = row[`${field}Available`] as boolean | undefined;
    if (!available) return null;

    const mileageStr = row[`${field}MileageCost`] as string | undefined;
    const miles = mileageStr ? parseInt(mileageStr, 10) : 0;
    if (!miles) return null;

    const sourceSlug = row.Source ?? "";
    const programId = SOURCE_TO_PROGRAM[sourceSlug] ?? sourceSlug;

    // seats.aero returns TotalTaxes in the smallest denomination of
    // TaxesCurrency (i.e. cents), so always divide by 100.
    const taxesRaw = (row[`${field}TotalTaxes`] as number | undefined) ?? 0;
    const taxes = taxesRaw / 100;
    const seats = (row[`${field}RemainingSeats`] as number | undefined) ?? 0;
    const direct = (row[`${field}Direct`] as boolean | undefined) ?? false;
    const airlines = (row[`${field}Airlines`] as string | undefined) ?? "";
    const carrier = airlines.split(",")[0]?.trim() || "Multiple";

    return {
      id: `${row.ID}-${field}`,
      programId,
      programName: PROGRAM_NAMES[programId] ?? sourceSlug,
      carrier,
      flightNo: "",
      from: row.Route?.OriginAirport ?? input.from.toUpperCase(),
      to: row.Route?.DestinationAirport ?? input.to.toUpperCase(),
      depart: row.Date ?? input.date,
      arrive: row.Date ?? input.date,
      durationMin: 0,
      stops: direct ? 0 : 1,
      cabin: input.cabin,
      miles: miles * input.pax,
      pax: input.pax,
      taxesUsd: Math.round(taxes * input.pax),
      seats,
      direct,
      updatedAt: row.UpdatedAt,
    };
  }
}
