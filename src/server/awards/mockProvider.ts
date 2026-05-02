import type { AwardItinerary, AwardProvider, Cabin, SearchInput } from "./types";

const CARRIERS = [
  "Qantas", "Singapore Airlines", "Emirates", "United",
  "Avianca", "Virgin Australia", "ANA", "Lufthansa",
];

const PROGRAM_IDS = ["qantas", "velocity", "krisflyer", "emirates", "united", "lifemiles"];
const PROGRAM_NAMES: Record<string, string> = {
  qantas: "Qantas Frequent Flyer",
  velocity: "Virgin Velocity",
  krisflyer: "Singapore KrisFlyer",
  emirates: "Emirates Skywards",
  united: "United MileagePlus",
  lifemiles: "Avianca LifeMiles",
};

const CABIN_MULT: Record<Cabin, number> = {
  economy: 1, premium: 1.6, business: 2.4, first: 4.2,
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function fmt(mins: number) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export class MockAwardProvider implements AwardProvider {
  readonly name = "mock" as const;

  async search(input: SearchInput): Promise<AwardItinerary[]> {
    const seed = hash(`${input.from}-${input.to}-${input.date}-${input.cabin}`);
    const count = 6 + (seed % 4);
    const baseDur = 240 + (seed % 600);

    return Array.from({ length: count })
      .map((_, i) => {
        const s = seed + i * 7919;
        const carrier = CARRIERS[s % CARRIERS.length];
        const programId = PROGRAM_IDS[s % PROGRAM_IDS.length];
        const stops = (s % 7) < 4 ? 0 : (s % 7) < 6 ? 1 : 2;
        const dur = baseDur + stops * 90 + ((s % 60) - 30);
        const departMin = (6 * 60) + ((s * 13) % (16 * 60));
        const arriveMin = departMin + dur;
        const baseMiles = 25000 + (s % 18000);
        const miles = Math.round((baseMiles * CABIN_MULT[input.cabin]) / 500) * 500 * input.pax;
        const taxes = 25 + (s % 280) + (input.cabin === "first" ? 180 : input.cabin === "business" ? 90 : 0);

        const it: AwardItinerary = {
          id: `mock-${i}-${s}`,
          programId,
          programName: PROGRAM_NAMES[programId],
          carrier,
          flightNo: `${carrier.slice(0, 2).toUpperCase()}${100 + (s % 899)}`,
          from: input.from.toUpperCase(),
          to: input.to.toUpperCase(),
          depart: fmt(departMin),
          arrive: fmt(arriveMin),
          durationMin: dur,
          stops,
          cabin: input.cabin,
          miles,
          taxesUsd: Math.round(taxes),
          seats: 1 + (s % 7),
          direct: stops === 0,
        };
        return it;
      })
      .sort((a, b) => a.miles - b.miles);
  }
}
