import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

/**
 * Send a Telegram message via the Lovable connector gateway.
 * Throws on failure with a descriptive error including the upstream status.
 */
export async function sendTelegramMessage(chatId: string, text: string) {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;
  if (!TELEGRAM_API_KEY)
    throw new Error("TELEGRAM_API_KEY is not configured (connect Telegram in Lovable Cloud)");

  const ChatSchema = z
    .string()
    .min(1)
    .max(64)
    .regex(/^-?\d+$/, "Telegram chat ID must be a numeric string");
  ChatSchema.parse(chatId);

  const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TELEGRAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Telegram sendMessage failed [${res.status}]: ${JSON.stringify(data)}`);
  }
  return data;
}
