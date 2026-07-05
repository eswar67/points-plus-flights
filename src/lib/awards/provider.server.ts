import { SeatsAeroProvider } from "./seatsAeroProvider";
import type { AwardProvider } from "./types";

/**
 * Returns the live seats.aero provider. Read inside request handlers — never
 * at module top-level — so the env injection happens at call time.
 * Throws when SEATS_AERO_API_KEY is missing: there is no mock fallback.
 */
export function getAwardProvider(): AwardProvider {
  const key = process.env.SEATS_AERO_API_KEY;
  if (!key) {
    throw new Error("SEATS_AERO_API_KEY is not configured — live award search is unavailable.");
  }
  return new SeatsAeroProvider(key);
}
