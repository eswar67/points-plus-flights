import { MockAwardProvider } from "./mockProvider";
import { SeatsAeroProvider } from "./seatsAeroProvider";
import type { AwardProvider } from "./types";

/**
 * Returns the live provider when SEATS_AERO_API_KEY is configured,
 * otherwise the mock provider. Read inside request handlers — never at
 * module top-level — so the env injection happens at call time.
 */
export function getAwardProvider(): AwardProvider {
  const key = process.env.SEATS_AERO_API_KEY;
  if (key && key.length > 0) {
    return new SeatsAeroProvider(key);
  }
  return new MockAwardProvider();
}
