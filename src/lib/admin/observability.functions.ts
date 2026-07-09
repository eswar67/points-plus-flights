import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Returns the latest poller_runs rows for the admin observability panel.
 * Access is gated by the table's RLS policy ("Admins view poller runs"),
 * so non-admins get an empty array — never an error message that leaks
 * which roles exist.
 */
export const listPollerRuns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ limit: z.number().int().min(1).max(100).default(20) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("poller_runs")
      .select("id, started_at, finished_at, processed, alerts_sent, errors, duration_ms, ok")
      .order("started_at", { ascending: false })
      .limit(data.limit);
    if (error) return { ok: false as const, error: error.message, runs: [] };
    return { ok: true as const, runs: rows ?? [] };
  });
