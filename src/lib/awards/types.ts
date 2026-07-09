export type Cabin = "economy" | "premium" | "business" | "first";

export type AwardItinerary = {
  id: string;
  programId: string; // our internal program id (qantas, velocity, ...)
  programName: string; // pretty source label from provider
  carrier: string; // operating airline name or code
  flightNo: string; // best-effort, may be empty when provider only gives daily availability
  from: string;
  to: string;
  depart: string; // ISO datetime when known, else "HH:mm"
  arrive: string; // ISO datetime when known, else "HH:mm"
  durationMin: number; // 0 when unknown
  stops: number; // 0 when unknown
  cabin: Cabin;
  miles: number; // total for all passengers
  pax?: number; // passenger count the miles/taxes cover (default 1)
  taxesUsd: number; // total for all passengers
  seats: number;
  direct: boolean;
  updatedAt?: string; // ISO timestamp from provider; drives confidence score
};

export type SearchInput = {
  from: string; // IATA, comma-allowed
  to: string; // IATA, comma-allowed
  date: string; // YYYY-MM-DD (range start)
  dateTo?: string; // YYYY-MM-DD inclusive range end; defaults to `date`
  cabin: Cabin;
  pax: number;
};

export type SearchResult = {
  itineraries: AwardItinerary[];
  source: "seats.aero";
  warning?: string; // surfaced to UI
};

export interface AwardProvider {
  name: "seats.aero";
  search(input: SearchInput): Promise<AwardItinerary[]>;
}
