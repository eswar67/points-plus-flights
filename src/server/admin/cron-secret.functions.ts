import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { randomBytes } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Returns metadata about the currently-stored CRON_SECRET (admin-only). */
export const getCronSecretMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({}).parse(input ?? {}))
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) {
      return { ok: false as const, error: "Admin role required." };
    }
    const { data, error } = await supabaseAdmin
      .schema("private")
      .from("cron_config")
      .select("key, updated_at")
      .eq("key", "CRON_SECRET")
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    return {
      ok: true as const,
      exists: !!data,
      updatedAt: data?.updated_at ?? null,
    };
  });

/**
 * Generate a new 256-bit CRON_SECRET, write it to private.cron_config, and
 * return the value ONCE so the admin can paste it into the Lovable Cloud
 * secret prompt. The secret is never logged.
 */
export const rotateCronSecret = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({}).parse(input ?? {}))
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) {
      return { ok: false as const, error: "Admin role required." };
    }
    const newSecret = randomBytes(32).toString("hex");
    const { error } = await supabaseAdmin
      .schema("private")
      .from("cron_config")
      .upsert(
        { key: "CRON_SECRET", value: newSecret, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, secret: newSecret };
  });