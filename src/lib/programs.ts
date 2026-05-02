export type Program = {
  id: string;
  name: string;
  short: string;
  alliance: string;
  accent: string;
  balance: number;
};

export const PROGRAMS: Program[] = [
  { id: "qantas",     name: "Qantas Frequent Flyer", short: "QF", alliance: "Oneworld",     accent: "#e60000", balance: 142500 },
  { id: "velocity",   name: "Virgin Velocity",       short: "VA", alliance: "SkyTeam-aff.", accent: "#d12d2d", balance: 86400 },
  { id: "krisflyer",  name: "Singapore KrisFlyer",   short: "SQ", alliance: "Star Alliance", accent: "#1f3a8a", balance: 210300 },
  { id: "emirates",   name: "Emirates Skywards",     short: "EK", alliance: "Independent",  accent: "#c8102e", balance: 67800 },
  { id: "united",     name: "United MileagePlus",    short: "UA", alliance: "Star Alliance", accent: "#0033a0", balance: 95200 },
  { id: "lifemiles",  name: "Avianca LifeMiles",     short: "AV", alliance: "Star Alliance", accent: "#d51f26", balance: 54100 },
];
