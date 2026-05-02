import type { AwardItinerary } from "@/server/awards/types";
import { PROGRAMS } from "./programs";

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
};

// Bank transfer partners → program (1:1 unless noted). Used to suggest top-ups.
const TRANSFER_PARTNERS: Record<string, { bank: string; ratio: string; etaMin: number; href: string }[]> = {
  qantas:    [{ bank: "Amex MR (AU)", ratio: "1:1", etaMin: 1440, href: "https://www.americanexpress.com/au/rewards/membership-rewards/transfer-points" }],
  velocity:  [{ bank: "Amex MR (AU)", ratio: "1:1", etaMin: 1440, href: "https://www.americanexpress.com/au/rewards/membership-rewards/transfer-points" }],
  krisflyer: [
    { bank: "Amex MR",   ratio: "1:1", etaMin: 60,   href: "https://global.americanexpress.com/rewards/transfer-points" },
    { bank: "Chase UR",  ratio: "1:1", etaMin: 60,   href: "https://ultimaterewards.chase.com" },
    { bank: "Citi TYP",  ratio: "1:1", etaMin: 60,   href: "https://www.citi.com/thankyou" },
  ],
  emirates:  [
    { bank: "Amex MR",   ratio: "1:1", etaMin: 60,   href: "https://global.americanexpress.com/rewards/transfer-points" },
    { bank: "Bilt",      ratio: "1:1", etaMin: 5,    href: "https://www.biltrewards.com" },
  ],
  united:    [
    { bank: "Chase UR",  ratio: "1:1", etaMin: 1,    href: "https://ultimaterewards.chase.com" },
    { bank: "Bilt",      ratio: "1:1", etaMin: 5,    href: "https://www.biltrewards.com" },
  ],
  lifemiles: [
    { bank: "Amex MR",   ratio: "1:1", etaMin: 1440, href: "https://global.americanexpress.com/rewards/transfer-points" },
    { bank: "Citi TYP",  ratio: "1:1", etaMin: 60,   href: "https://www.citi.com/thankyou" },
  ],
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
    default:
      return { site: "airline website", href: "#" };
  }
}

export function buildPlaybook(a: AwardItinerary): Playbook {
  const program = PROGRAMS.find((p) => p.id === a.programId);
  const balance = program?.balance ?? 0;
  const shortfall = Math.max(0, a.miles - balance);
  const steps: PlaybookStep[] = [];

  if (shortfall > 0) {
    const partners = TRANSFER_PARTNERS[a.programId] ?? [];
    const fastest = partners[0];
    if (fastest) {
      steps.push({
        kind: "transfer",
        title: `Transfer ${shortfall.toLocaleString()} pts from ${fastest.bank}`,
        detail: `${fastest.bank} → ${program?.name ?? a.programId} at ${fastest.ratio}. Log in, choose the program, and confirm the transfer.`,
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
  };
}