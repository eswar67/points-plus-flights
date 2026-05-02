export type Cabin = "economy" | "premium" | "business" | "first";

export type AwardItinerary = {
  id: string;
  programId: string;       // our internal program id (qantas, velocity, ...)
  programName: string;     // pretty source label from provider
  carrier: string;         // operating airline name or code
  flightNo: string;        // best-effort, may be empty when provider only gives daily availability
  from: string;
  to: string;
  depart: string;          // ISO datetime when known, else "HH:mm"
  arrive: string;          // ISO datetime when known, else "HH:mm"
  durationMin: number;     // 0 when unknown
  stops: number;           // 0 when unknown
  cabin: Cabin;
  miles: number;
  taxesUsd: number;
  seats: number;
  direct: boolean;
};

export type SearchInput = {
  from: string;            // IATA, comma-allowed
  to: string;              // IATA, comma-allowed
  date: string;            // YYYY-MM-DD
  cabin: Cabin;
  pax: number;
};

export type SearchResult = {
  itineraries: AwardItinerary[];
  source: "seats.aero" | "mock";
  warning?: string;        // surfaced to UI (e.g. fallback reason)
};

export interface AwardProvider {
  name: "seats.aero" | "mock";
  search(input: SearchInput): Promise<AwardItinerary[]>;
}
