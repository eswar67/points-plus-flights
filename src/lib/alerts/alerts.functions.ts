import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendTelegramMessage } from "./telegram.server";

/**
 * Send a one-shot test message to the user's saved Telegram chat ID.
 * Used by the Account page so users can verify their setup before going live.
 */
export const sendTestTelegramAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({}).parse(input ?? {}))
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("telegram_chat_id, display_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return { ok: false as const, error: error.message };
    const chatId = profile?.telegram_chat_id?.trim();
    if (!chatId) {
      return { ok: false as const, error: "No Telegram chat ID saved on your profile yet." };
    }
    try {
      await sendTelegramMessage(
        chatId,
        `🛫 <b>Aureum test alert</b>\nHi ${profile?.display_name ?? "there"} — your Telegram alerts are wired up. We'll ping you the moment a watchlist hits its CPP target.`,
      );
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  });
