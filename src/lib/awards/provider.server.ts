import { AwardToolProvider } from "./awardToolProvider";
import { SeatsAeroProvider } from "./seatsAeroProvider";
import type { AwardProvider } from "./types";

/**
 * Returns the preferred configured live provider. AwardTool is selected first
 * because it runs an on-demand crawler; seats.aero remains a live fallback.
 * Read inside request handlers — never at module top-level — so env injection
 * happens at call time.
 */
export function getAwardProvider(): AwardProvider {
  const awardToolKey = process.env.AWARDTOOL_API_KEY;
  if (awardToolKey) return new AwardToolProvider(awardToolKey);

  const key = process.env.SEATS_AERO_API_KEY;
  if (!key) {
    throw new Error(
      "AWARDTOOL_API_KEY or SEATS_AERO_API_KEY must be configured — live award search is unavailable.",
    );
  }
  return new SeatsAeroProvider(key);
}
