import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Fetch recent alerts_sent rows for a single watchlist owned by the caller.
 * RLS on alerts_sent already restricts visibility to the watchlist owner.
 */
export const listWatchlistAlerts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        watchlistId: z.string().uuid(),
        limit: z.number().int().min(1).max(50).default(10),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("alerts_sent")
      .select("id, sent_at, fingerprint, cpp_aud, miles")
      .eq("watchlist_id", data.watchlistId)
      .order("sent_at", { ascending: false })
      .limit(data.limit);
    if (error) return { ok: false as const, error: error.message, alerts: [] };
    return { ok: true as const, alerts: rows ?? [] };
  });
