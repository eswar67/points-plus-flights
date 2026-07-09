import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { getAwardProvider } from "./provider.server";
import type { SearchResult } from "./types";

const MAX_RANGE_DAYS = 31;

const SearchSchema = z
  .object({
    from: z
      .string()
      .trim()
      .min(3)
      .max(400)
      .regex(/^[A-Za-z,]+$/, "IATA codes only"),
    to: z
      .string()
      .trim()
      .min(3)
      .max(400)
      .regex(/^[A-Za-z,]+$/, "IATA codes only"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
    dateTo: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD")
      .optional(),
    cabin: z.enum(["economy", "premium", "business", "first"]),
    pax: z.number().int().min(1).max(9),
  })
  .refine((d) => !d.dateTo || d.dateTo >= d.date, {
    message: "dateTo must be on or after date",
  })
  .refine(
    (d) =>
      !d.dateTo ||
      (new Date(d.dateTo + "T00:00:00Z").getTime() - new Date(d.date + "T00:00:00Z").getTime()) /
        86_400_000 <
        MAX_RANGE_DAYS,
    { message: `Date range cannot exceed ${MAX_RANGE_DAYS} days` },
  );

// --- Per-IP rate limiting (best effort, per isolate) -----------------------
// Protects the seats.aero quota from anonymous hammering. State is in-memory,
// so limits reset when the worker isolate recycles — acceptable for quota
// protection, not a security boundary.
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, number[]>();

function clientIp(): string {
  const request = getRequest();
  return (
    request?.headers?.get("cf-connecting-ip") ||
    request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function assertRateLimit(ip: string) {
  const now = Date.now();
  const hits = (rateBuckets.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_LIMIT) {
    throw new Error("Too many searches — please wait a minute and try again.");
  }
  hits.push(now);
  rateBuckets.set(ip, hits);
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) rateBuckets.delete(k);
    }
  }
}

// --- Result cache -----------------------------------------------------------
// Identical route+date+cabin+pax queries within 5 minutes share one provider
// call. Only live results are cached; mock is free to compute.
const CACHE_TTL_MS = 5 * 60_000;
const liveCache = new Map<string, { at: number; result: SearchResult }>();

function cacheGet(key: string): SearchResult | undefined {
  const hit = liveCache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    liveCache.delete(key);
    return undefined;
  }
  return hit.result;
}

function cacheSet(key: string, result: SearchResult) {
  liveCache.set(key, { at: Date.now(), result });
  if (liveCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of liveCache) {
      if (now - v.at > CACHE_TTL_MS) liveCache.delete(k);
    }
  }
}

export const searchAwards = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SearchSchema.parse(input))
  .handler(async ({ data }): Promise<SearchResult> => {
    assertRateLimit(clientIp());

    const cacheKey = [data.from, data.to, data.date, data.dateTo ?? "", data.cabin, data.pax]
      .join("|")
      .toUpperCase();
    const cached = cacheGet(cacheKey);
    if (cached) return cached;

    const provider = getAwardProvider();
    try {
      const itineraries = await provider.search(data);
      const result: SearchResult = { itineraries, source: provider.name };
      cacheSet(cacheKey, result);
      return result;
    } catch (err) {
      console.error("[searchAwards] provider error:", err);
      throw new Error(
        "Live award search is temporarily unavailable. Please try again in a moment.",
      );
    }
  });
