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
  {
    id: "qantas",
    name: "Qantas Frequent Flyer",
    short: "QF",
    alliance: "Oneworld",
    accent: "#e60000",
    valueAudCents: 1.9,
  },
  {
    id: "velocity",
    name: "Virgin Velocity",
    short: "VA",
    alliance: "SkyTeam-aff.",
    accent: "#d12d2d",
    valueAudCents: 2.1,
  },
  {
    id: "krisflyer",
    name: "Singapore KrisFlyer",
    short: "SQ",
    alliance: "Star Alliance",
    accent: "#1f3a8a",
    valueAudCents: 2.3,
  },
  {
    id: "emirates",
    name: "Emirates Skywards",
    short: "EK",
    alliance: "Independent",
    accent: "#c8102e",
    valueAudCents: 1.4,
  },
  {
    id: "united",
    name: "United MileagePlus",
    short: "UA",
    alliance: "Star Alliance",
    accent: "#0033a0",
    valueAudCents: 1.8,
  },
  {
    id: "lifemiles",
    name: "Avianca LifeMiles",
    short: "AV",
    alliance: "Star Alliance",
    accent: "#d51f26",
    valueAudCents: 2.0,
  },
  {
    id: "aeroplan",
    name: "Air Canada Aeroplan",
    short: "AC",
    alliance: "Star Alliance",
    accent: "#d8232a",
    valueAudCents: 2.0,
  },
  {
    id: "flyingblue",
    name: "Air France-KLM Flying Blue",
    short: "AF",
    alliance: "SkyTeam",
    accent: "#3b6fb5",
    valueAudCents: 1.8,
  },
  {
    id: "american",
    name: "American AAdvantage",
    short: "AA",
    alliance: "Oneworld",
    accent: "#b61f24",
    valueAudCents: 1.7,
  },
  {
    id: "delta",
    name: "Delta SkyMiles",
    short: "DL",
    alliance: "SkyTeam",
    accent: "#e01933",
    valueAudCents: 1.3,
  },
  {
    id: "alaska",
    name: "Alaska Mileage Plan",
    short: "AS",
    alliance: "Oneworld",
    accent: "#41b6e6",
    valueAudCents: 2.2,
  },
  {
    id: "etihad",
    name: "Etihad Guest",
    short: "EY",
    alliance: "Independent",
    accent: "#bd8b13",
    valueAudCents: 1.5,
  },
  {
    id: "qatar",
    name: "Qatar Privilege Club",
    short: "QR",
    alliance: "Oneworld",
    accent: "#8d1d4f",
    valueAudCents: 1.8,
  },
  {
    id: "turkish",
    name: "Turkish Miles&Smiles",
    short: "TK",
    alliance: "Star Alliance",
    accent: "#c90019",
    valueAudCents: 1.9,
  },
  {
    id: "virginatlantic",
    name: "Virgin Atlantic Flying Club",
    short: "VS",
    alliance: "SkyTeam",
    accent: "#da0530",
    valueAudCents: 2.0,
  },
  {
    id: "jetblue",
    name: "JetBlue TrueBlue",
    short: "B6",
    alliance: "Independent",
    accent: "#2e6bd6",
    valueAudCents: 1.9,
  },
  {
    id: "eurobonus",
    name: "SAS EuroBonus",
    short: "SK",
    alliance: "SkyTeam",
    accent: "#4a5fd0",
    valueAudCents: 1.4,
  },
  {
    id: "aeromexico",
    name: "Aeroméxico Rewards",
    short: "AM",
    alliance: "SkyTeam",
    accent: "#1f4e8c",
    valueAudCents: 1.4,
  },
  {
    id: "smiles",
    name: "GOL Smiles",
    short: "G3",
    alliance: "Independent",
    accent: "#ff7020",
    valueAudCents: 1.2,
  },
  {
    id: "connectmiles",
    name: "Copa ConnectMiles",
    short: "CM",
    alliance: "Star Alliance",
    accent: "#1a75cf",
    valueAudCents: 1.6,
  },
  {
    id: "azul",
    name: "Azul TudoAzul",
    short: "AD",
    alliance: "Independent",
    accent: "#00abc8",
    valueAudCents: 1.3,
  },
  {
    id: "avios_ba",
    name: "British Airways Avios",
    short: "BA",
    alliance: "Oneworld",
    accent: "#1f4e9d",
    valueAudCents: 1.7,
  },
  {
    id: "asia_miles",
    name: "Cathay Asia Miles",
    short: "CX",
    alliance: "Oneworld",
    accent: "#006564",
    valueAudCents: 1.8,
  },
  {
    id: "amex_mr",
    name: "Amex Membership Rewards",
    short: "MR",
    alliance: "Transferable",
    accent: "#016fd0",
    valueAudCents: 1.6,
  },
  {
    id: "anz",
    name: "ANZ Rewards",
    short: "ANZ",
    alliance: "Transferable",
    accent: "#004990",
    valueAudCents: 0.8,
  },
];

export function getProgram(id: string): Program | undefined {
  return PROGRAMS.find((p) => p.id === id);
}
