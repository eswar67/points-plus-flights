export type Program = {
  id: string;
  name: string;
  short: string;
  alliance: string;
  accent: string;
  /**
   * Reasonable point valuation in AUD cents per point, based on average
   * premium-cabin redemption value. Used to compute portfolio worth.
   */
  valueAudCents: number;
};

/**
 * Reference catalog of supported loyalty programs. Members enter their own
 * point balances per program — we never assume a balance for them.
 */
export const PROGRAMS: Program[] = [
  { id: "qantas",     name: "Qantas Frequent Flyer", short: "QF", alliance: "Oneworld",      accent: "#e60000", valueAudCents: 1.9 },
  { id: "velocity",   name: "Virgin Velocity",       short: "VA", alliance: "SkyTeam-aff.",  accent: "#d12d2d", valueAudCents: 2.1 },
  { id: "krisflyer",  name: "Singapore KrisFlyer",   short: "SQ", alliance: "Star Alliance", accent: "#1f3a8a", valueAudCents: 2.3 },
  { id: "emirates",   name: "Emirates Skywards",     short: "EK", alliance: "Independent",   accent: "#c8102e", valueAudCents: 1.4 },
  { id: "united",     name: "United MileagePlus",    short: "UA", alliance: "Star Alliance", accent: "#0033a0", valueAudCents: 1.8 },
  { id: "lifemiles",  name: "Avianca LifeMiles",     short: "AV", alliance: "Star Alliance", accent: "#d51f26", valueAudCents: 2.0 },
  { id: "aeroplan",   name: "Air Canada Aeroplan",   short: "AC", alliance: "Star Alliance", accent: "#d8232a", valueAudCents: 2.0 },
  { id: "avios_ba",   name: "British Airways Avios", short: "BA", alliance: "Oneworld",      accent: "#1f4e9d", valueAudCents: 1.7 },
  { id: "asia_miles", name: "Cathay Asia Miles",     short: "CX", alliance: "Oneworld",      accent: "#006564", valueAudCents: 1.8 },
  { id: "amex_mr",    name: "Amex Membership Rewards", short: "MR", alliance: "Transferable", accent: "#016fd0", valueAudCents: 1.6 },
  { id: "citi",       name: "Citi ThankYou Points",  short: "TY", alliance: "Transferable",  accent: "#003b70", valueAudCents: 1.4 },
  { id: "anz",        name: "ANZ Rewards",           short: "ANZ", alliance: "Transferable", accent: "#004990", valueAudCents: 0.8 },
];

export function getProgram(id: string): Program | undefined {
  return PROGRAMS.find((p) => p.id === id);
}
