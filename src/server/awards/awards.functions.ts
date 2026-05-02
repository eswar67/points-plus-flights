import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAwardProvider } from "./provider.server";
import type { SearchResult } from "./types";

const SearchSchema = z.object({
  from: z.string().trim().min(3).max(7).regex(/^[A-Za-z,]+$/, "IATA codes only"),
  to: z.string().trim().min(3).max(7).regex(/^[A-Za-z,]+$/, "IATA codes only"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  cabin: z.enum(["economy", "premium", "business", "first"]),
  pax: z.number().int().min(1).max(9),
});

export const searchAwards = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SearchSchema.parse(input))
  .handler(async ({ data }): Promise<SearchResult> => {
    const provider = getAwardProvider();
    try {
      const itineraries = await provider.search(data);
      return {
        itineraries,
        source: provider.name,
        warning: provider.name === "mock"
          ? "Showing simulated availability. Add SEATS_AERO_API_KEY to enable live award data."
          : undefined,
      };
    } catch (err) {
      console.error("[searchAwards] provider error:", err);
      // Graceful fallback to mock so the UI never goes blank.
      const { MockAwardProvider } = await import("./mockProvider");
      const fallback = new MockAwardProvider();
      const itineraries = await fallback.search(data);
      return {
        itineraries,
        source: "mock",
        warning: `Live provider failed (${(err as Error).message}). Showing simulated results.`,
      };
    }
  });
