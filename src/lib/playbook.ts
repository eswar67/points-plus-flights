import type { AwardItinerary } from "@/lib/awards/types";
import { PROGRAMS } from "./programs";
import { confidenceFor, transfersFor } from "./intelligence";

export type PlaybookStep = {
  kind: "transfer" | "book" | "wait" | "verify";
  title: string;
  detail: string;
  href?: string;
  cta?: string;
  etaMinutes?: number;
};

export type Playbook = {
  feasible: boolean;
  shortfall: number;            // miles missing in the chosen program (0 = covered)
  totalMiles: number;
  bookingProgramId: string;
  steps: PlaybookStep[];
  riskNote?: string;
};

// Best-effort airline booking deep links (program site, prefilled where possible).
function airlineBookingUrl(programId: string, a: AwardItinerary): { href: string; site: string } {
  const dep = a.depart?.slice(0, 10) || "";
  switch (programId) {
    case "qantas":
      return { site: "qantas.com", href: `https://www.qantas.com/au/en/book-a-trip/flights.html?from=${a.from}&to=${a.to}&departingDate=${dep}&useClassicRewards=true` };
    case "velocity":
      return { site: "virginaustralia.com", href: `https://book.virginaustralia.com/dx/VADX/#/flight-selection?journeyType=oneway&class=${a.cabin}&origin=${a.from}&destination=${a.to}&date=${dep}&awardBooking=true` };
    case "krisflyer":
      return { site: "singaporeair.com", href: `https://www.singaporeair.com/en_UK/plan-and-book/our-fares-and-deals/krisflyer-redemption/` };
    case "emirates":
      return { site: "emirates.com", href: `https://www.emirates.com/english/skywards/use-miles/` };
    case "united":
      return { site: "united.com", href: `https://www.united.com/en/us/fsr/choose-flights?f=${a.from}&t=${a.to}&d=${dep}&tt=1&at=1&sc=7&px=1&taxng=1&newHP=True&clm=7&st=bestmatches` };
    case "lifemiles":
      return { site: "lifemiles.com", href: `https://www.lifemiles.com/fly/redeem` };
    case "flyingblue":
      return { site: "flyingblue.com", href: `https://www.flyingblue.com/en/spend/flights` };
    case "american":
      return { site: "aa.com", href: `https://www.aa.com/booking/find-flights?from=${a.from}&to=${a.to}&departDate=${dep}&redeemMiles=true` };
    case "delta":
      return { site: "delta.com", href: `https://www.delta.com/flight-search/book-a-flight` };
    case "alaska":
      return { site: "alaskaair.com", href: `https://www.alaskaair.com/planbook` };
    case "aeroplan":
      return { site: "aircanada.com", href: `https://www.aircanada.com/aeroplan/redeem` };
    case "etihad":
      return { site: "etihadguest.com", href: `https://www.etihadguest.com/en/spend-miles.html` };
    case "qatar":
      return { site: "qatarairways.com", href: `https://www.qatarairways.com/en/Privilege-Club/redeem-avios.html` };
    case "turkish":
      return { site: "turkishairlines.com", href: `https://www.turkishairlines.com/en-int/miles-and-smiles/` };
    case "virginatlantic":
      return { site: "virginatlantic.com", href: `https://www.virginatlantic.com/flyingclub` };
    default: {
      // Program site unknown — hand off to a targeted search rather than a dead link.
      const q = encodeURIComponent(`${programId} award booking ${a.from} ${a.to}`);
      return { site: "program website", href: `https://www.google.com/search?q=${q}` };
    }
  }
}

export function buildPlaybook(a: AwardItinerary, balances: Record<string, number> = {}): Playbook {
  const program = PROGRAMS.find((p) => p.id === a.programId);
  const balance = balances[a.programId] ?? 0;
  const shortfall = Math.max(0, a.miles - balance);
  const steps: PlaybookStep[] = [];
  const conf = confidenceFor(a);
  const partners = transfersFor(a.programId);
  const fastest = partners[0];
  let riskNote: string | undefined;

  if (shortfall > 0) {
    if (fastest) {
      const safeWindowMin = Math.max(0, 240 - conf.ageMin); // assume seat lifespan ~4h on a fresh cache
      if (fastest.etaMin > safeWindowMin && conf.label !== "stale") {
        riskNote = `Transfer ETA (~${Math.round(fastest.etaMin / 60)}h) likely exceeds remaining seat lifespan. Consider a faster bank or a different program.`;
      }
      steps.push({
        kind: "transfer",
        title: `Transfer ${shortfall.toLocaleString()} pts from ${fastest.bank} (${fastest.ratio})`,
        detail: `${fastest.bank} → ${program?.name ?? a.programId}. Typical ${fastest.etaMin < 60 ? `${fastest.etaMin}m` : `${Math.round(fastest.etaMin / 60)}h`}, worst case ${Math.round(fastest.etaMaxMin / 60)}h. Log in and confirm immediately.`,
        href: fastest.href,
        cta: `Open ${fastest.bank}`,
        etaMinutes: fastest.etaMin,
      });
      steps.push({
        kind: "wait",
        title: `Wait ~${fastest.etaMin < 60 ? `${fastest.etaMin}m` : `${Math.round(fastest.etaMin / 60)}h`} for points to land`,
        detail: "Refresh your loyalty account and confirm the new balance before booking.",
        etaMinutes: fastest.etaMin,
      });
    } else {
      steps.push({
        kind: "transfer",
        title: `You need ${shortfall.toLocaleString()} more ${program?.name ?? "miles"}`,
        detail: "No bank transfer partner in your linked accounts. Consider buying miles or another program.",
      });
    }
  }

  const link = airlineBookingUrl(a.programId, a);
  steps.push({
    kind: "book",
    title: `Book on ${link.site}`,
    detail: `${a.from} → ${a.to} · ${a.depart?.slice(0, 10) ?? ""} · ${a.cabin} · ${a.carrier}${a.flightNo ? ` ${a.flightNo}` : ""}. Search award space and ticket immediately — seats can vanish in minutes.`,
    href: link.href,
    cta: `Open ${link.site}`,
  });
  steps.push({
    kind: "verify",
    title: "Confirm e-ticket & seat assignment",
    detail: "Once ticketed, save your PNR and select seats. Add the trip to your calendar.",
  });

  return {
    feasible: shortfall === 0,
    shortfall,
    totalMiles: a.miles,
    bookingProgramId: a.programId,
    steps,
    riskNote,
  };
}