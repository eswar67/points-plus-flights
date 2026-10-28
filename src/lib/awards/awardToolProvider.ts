import { getProgram } from "@/lib/programs";
import type { AwardItinerary, AwardProvider, Cabin, SearchInput } from "./types";

const TRIGGER_URL = "https://apisv2.awardtoolapi.com/flight_trigger/search_real_time";
const RESULTS_URL = "https://apisv2.awardtoolapi.com/flight_retrieval/search_result";
const POLL_INTERVAL_MS = 5_000;
const MAX_POLLS = 6;

const CABINS = ["Economy", "Premium Economy", "Business", "First"];
const PROGRAMS = [
  "AA",
  "AC",
  "AM",
  "AS",
  "AV",
  "B6",
  "BA",
  "CX",
  "LH",
  "QR",
  "AY",
  "G3",
  "DL",
  "EK",
  "EY",
  "KL",
  "QF",
  "SQ",
  "SK",
  "TP",
  "TK",
  "UA",
  "VA",
  "VS",
];

const PROGRAM_IDS: Record<string, string> = {
  QF: "qantas",
  AA: "american",
  AM: "aeromexico",
  AS: "alaska",
  B6: "jetblue",
  DL: "delta",
  EY: "etihad",
  G3: "smiles",
  KL: "flyingblue",
  QR: "qatar",
  SK: "eurobonus",
  TK: "turkish",
  VS: "virginatlantic",
  VA: "velocity",
  SQ: "krisflyer",
  EK: "emirates",
  UA: "united",
  AV: "lifemiles",
  AC: "aeroplan",
  BA: "avios_ba",
  CX: "asia_miles",
};

type JsonRecord = Record<string, unknown>;
type TriggerResponse = { task_id?: string; message?: string };
type RetrievalResponse = { result?: unknown[]; finish?: boolean };
type Task = { date: string; taskId: string };

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function asRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : undefined;
}

function readString(row: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function readNumber(row: JsonRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function readBoolean(row: JsonRecord, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "boolean") return value;
    if (value === 1 || value === "1" || value === "true") return true;
    if (value === 0 || value === "0" || value === "false") return false;
  }
  return undefined;
}

function cabinFrom(value: string | undefined): Cabin | undefined {
  const cabin = value?.toLowerCase().replace(/[ _-]/g, " ").trim();
  if (cabin === "economy") return "economy";
  if (cabin === "premium economy" || cabin === "premium") return "premium";
  if (cabin === "business") return "business";
  if (cabin === "first") return "first";
  return undefined;
}

function dateRange(date: string, dateTo?: string): string[] {
  const end = dateTo ?? date;
  const dates: string[] = [];
  const cursor = new Date(date + "T00:00:00Z");
  const last = new Date(end + "T00:00:00Z").getTime();
  while (cursor.getTime() <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function normalizeDateTime(value: string | undefined, fallbackDate: string): string {
  if (!value) return fallbackDate;
  if (/^\d{2}:\d{2}$/.test(value)) return `${fallbackDate}T${value}:00`;
  return value;
}

function normalizeDuration(value: number | undefined): number {
  if (!value || value < 0) return 0;
  return value > 1_440 ? Math.round(value / 60) : Math.round(value);
}

/**
 * AwardTool queues exactly one travel date per trigger. We submit each date in
 * a short range together, then poll every task in parallel for incremental
 * results until the crawler reports completion.
 */
export class AwardToolProvider implements AwardProvider {
  readonly name = "awardtool" as const;
  readonly maxDateRangeDays = 7;

  constructor(private readonly apiKey: string) {}

  async search(input: SearchInput): Promise<AwardItinerary[]> {
    const tasks = await Promise.all(
      dateRange(input.date, input.dateTo).map(async (date): Promise<Task> => {
        const trigger = await this.post<TriggerResponse>(TRIGGER_URL, {
          origin: input.from.toUpperCase(),
          destination: input.to.toUpperCase(),
          programs: PROGRAMS,
          cabins: CABINS,
          date,
          pax: input.pax,
          api_key: this.apiKey,
          exit_early: true,
        });
        if (!trigger.task_id) {
          throw new Error(trigger.message || `AwardTool did not return a task ID for ${date}`);
        }
        return { date, taskId: trigger.task_id };
      }),
    );

    const results = new Map<string, AwardItinerary>();
    const pending = new Map(tasks.map((task) => [task.taskId, task]));
    for (let attempt = 0; attempt < MAX_POLLS && pending.size > 0; attempt += 1) {
      if (attempt > 0) await sleep(POLL_INTERVAL_MS);
      const polls = await Promise.all(
        [...pending.values()].map(async (task) => ({
          task,
          response: await this.post<RetrievalResponse>(RESULTS_URL, {
            task_id: task.taskId,
            api_key: this.apiKey,
          }),
        })),
      );

      for (const { task, response } of polls) {
        for (const raw of response.result ?? []) {
          const itinerary = this.toItinerary(raw, input, task.date);
          if (itinerary) results.set(itinerary.id, itinerary);
        }
        if (response.finish) pending.delete(task.taskId);
      }
    }

    return [...results.values()].sort((a, b) => a.miles - b.miles);
  }

  private async post<T>(url: string, body: JsonRecord): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`AwardTool ${response.status}: ${text.slice(0, 200)}`);
    }
    return (await response.json()) as T;
  }

  private toItinerary(
    raw: unknown,
    input: SearchInput,
    fallbackDate: string,
  ): AwardItinerary | null {
    const row = asRecord(raw);
    if (!row) return null;

    const cabin = cabinFrom(readString(row, "cabin", "cabin_class"));
    const miles = readNumber(
      row,
      "total_miles",
      "miles",
      "mileage",
      "award_miles",
      "points",
      "cost",
    );
    if (!cabin || !miles || miles <= 0) return null;

    const programCode = (readString(row, "program_code", "program", "source") ?? "").toUpperCase();
    const programId = (PROGRAM_IDS[programCode] ?? programCode.toLowerCase()) || "awardtool";
    const program = getProgram(programId);
    const origin = readString(row, "origin", "from", "origin_airport") ?? input.from.toUpperCase();
    const destination =
      readString(row, "destination", "arrival", "to", "destination_airport") ??
      input.to.toUpperCase();
    const stops = Math.max(
      0,
      Math.round(readNumber(row, "stops", "stop_count", "connections") ?? 0),
    );
    const direct = readBoolean(row, "direct", "nonstop", "is_direct") ?? stops === 0;
    const flightNo = readString(row, "flight_number", "flight_no", "flight") ?? "";
    const carrier =
      readString(row, "airline", "carrier", "operating_airline", "airline_name") ?? "Multiple";
    const sourceId = readString(row, "id", "flight_id", "uuid");
    const departure = normalizeDateTime(
      readString(row, "departure_time", "depart_time", "departure"),
      fallbackDate,
    );
    const arrival = normalizeDateTime(
      readString(row, "arrival_time", "arrive_time", "arrival"),
      fallbackDate,
    );
    // AwardTool may use one record ID per cabin. The UI groups cabins by this
    // physical-trip key, so deliberately exclude both cabin and source ID.
    const tripKey = [programCode, origin, destination, carrier, flightNo, departure, arrival]
      .filter(Boolean)
      .join("-");
    const recordId = sourceId ?? tripKey;

    return {
      id: `awardtool-${recordId}-${cabin}`,
      tripKey: `awardtool-${tripKey}`,
      programId,
      programName: (program?.name ?? programCode) || "AwardTool partner",
      carrier,
      flightNo,
      from: origin.toUpperCase(),
      to: destination.toUpperCase(),
      depart: departure,
      arrive: arrival,
      durationMin: normalizeDuration(
        readNumber(row, "duration_minutes", "duration", "flight_duration"),
      ),
      stops,
      cabin,
      miles: Math.round(miles),
      pax: input.pax,
      taxesUsd: Math.round(
        Math.max(0, readNumber(row, "taxes", "total_taxes", "tax_amount", "fees") ?? 0),
      ),
      seats: Math.max(
        0,
        Math.round(readNumber(row, "seats", "available_seats", "remaining_seats") ?? 0),
      ),
      direct,
      updatedAt: readString(row, "updated_at", "last_updated", "created_at"),
    };
  }
}
