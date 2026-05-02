import { PROGRAMS } from "./programs";

export type Cabin = "economy" | "premium" | "business" | "first";

export type Award = {
  id: string;
  programId: string;
  carrier: string;
  flightNo: string;
  from: string;
  to: string;
  depart: string;
  arrive: string;
  durationMin: number;
  stops: number;
  cabin: Cabin;
  miles: number;
  taxesUsd: number;
  seats: number;
};

const CARRIERS = [
  { code: "QF", name: "Qantas" },
  { code: "SQ", name: "Singapore Airlines" },
  { code: "EK", name: "Emirates" },
  { code: "UA", name: "United" },
  { code: "AV", name: "Avianca" },
  { code: "VA", name: "Virgin Australia" },
  { code: "NH", name: "ANA" },
  { code: "LH", name: "Lufthansa" },
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function fmtTime(mins: number) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function searchAwards(opts: {
  from: string;
  to: string;
  date: string;
  cabin: Cabin;
  pax: number;
}): Award[] {
  const seed = hash(`${opts.from}-${opts.to}-${opts.date}-${opts.cabin}`);
  const count = 6 + (seed % 4);
  const baseDur = 240 + (seed % 600);

  return Array.from({ length: count }).map((_, i) => {
    const s = seed + i * 7919;
    const carrier = CARRIERS[s % CARRIERS.length];
    const program = PROGRAMS[s % PROGRAMS.length];
    const stops = (s % 7) < 4 ? 0 : (s % 7) < 6 ? 1 : 2;
    const dur = baseDur + stops * 90 + ((s % 60) - 30);
    const departMin = (6 * 60) + ((s * 13) % (16 * 60));
    const arriveMin = departMin + dur;

    const cabinMultiplier: Record<Cabin, number> = {
      economy: 1, premium: 1.6, business: 2.4, first: 4.2,
    };
    const baseMiles = 25000 + ((s % 18000));
    const miles = Math.round((baseMiles * cabinMultiplier[opts.cabin]) / 500) * 500 * opts.pax;

    const taxes = 25 + (s % 280) + (opts.cabin === "first" ? 180 : opts.cabin === "business" ? 90 : 0);

    return {
      id: `${carrier.code}-${i}-${s}`,
      programId: program.id,
      carrier: carrier.name,
      flightNo: `${carrier.code}${100 + (s % 899)}`,
      from: opts.from.toUpperCase(),
      to: opts.to.toUpperCase(),
      depart: fmtTime(departMin),
      arrive: fmtTime(arriveMin),
      durationMin: dur,
      stops,
      cabin: opts.cabin,
      miles,
      taxesUsd: Math.round(taxes),
      seats: 1 + (s % 7),
    };
  }).sort((a, b) => a.miles - b.miles);
}

export function fmtDuration(min: number) {
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}
