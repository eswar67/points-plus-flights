import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { randomBytes } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Returns metadata about the currently-stored CRON_SECRET.
 * Auth + admin role are enforced inside the SECURITY DEFINER RPC.
 */
export const getCronSecretMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({}).parse(input ?? {}))
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase.rpc("admin_get_cron_secret_meta");
    if (error) return { ok: false as const, error: error.message };
    const row = Array.isArray(data) ? data[0] : data;
    return {
      ok: true as const,
      exists: !!row?.has_secret,
      updatedAt: (row?.updated_at as string | null) ?? null,
    };
  });

/**
 * Generate a new 256-bit CRON_SECRET, persist it via the admin-gated RPC,
 * and return the value ONCE so the admin can paste it into the Lovable Cloud
 * secret prompt. Never logged.
 */
export const rotateCronSecret = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({}).parse(input ?? {}))
  .handler(async ({ context }) => {
    const { supabase } = context;
    const newSecret = randomBytes(32).toString("hex");
    const { data, error } = await supabase.rpc("admin_rotate_cron_secret", {
      _new_value: newSecret,
    });
    if (error) return { ok: false as const, error: error.message };
    return {
      ok: true as const,
      secret: newSecret,
      updatedAt: (data as unknown as string) ?? new Date().toISOString(),
    };
  });
