import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getAwardProvider } from "@/lib/awards/provider.server";
import { calcCppAud, gradeCpp, confidenceFor, fmtCpp, fmtAud, fareEstimateAud } from "@/lib/intelligence";
import { sendTelegramMessage } from "@/lib/alerts/telegram.server";
import type { Cabin, AwardItinerary } from "@/lib/awards/types";

/**
 * Scheduled poller. Called by pg_cron with `Authorization: Bearer <CRON_SECRET>`.
 * For each active watchlist:
 *   1. Probe the award provider for the date range (sampled).
 *   2. Score each itinerary with the intelligence engine (CPP/AUD).
 *   3. If the best result clears the user's min_cpp_aud and seats are bookable,
 *      send a Telegram alert (if chat_id present) and record in alerts_sent.
 * Dedup is by fingerprint = `${watchlistId}|${itineraryId}|YYYY-MM-DD`.
 */

type Watchlist = {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  date_from: string;
  date_to: string;
  cabin: Cabin;
  pax: number;
  max_miles: number | null;
  min_cpp_aud: number | null;
  channel: string;
  active: boolean;
  label: string | null;
};

const MAX_DATES_PER_WATCHLIST = 5; // sample evenly across the range to keep provider load sane

function sampleDates(from: string, to: string, max: number): string[] {
  const start = new Date(from + "T00:00:00Z").getTime();
  const end = new Date(to + "T00:00:00Z").getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return [from];
  const days = Math.floor((end - start) / 86_400_000) + 1;
  if (days <= max) {
    return Array.from({ length: days }, (_, i) =>
      new Date(start + i * 86_400_000).toISOString().slice(0, 10),
    );
  }
  const step = (days - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) =>
    new Date(start + Math.round(i * step) * 86_400_000).toISOString().slice(0, 10),
  );
}

async function processWatchlist(w: Watchlist, telegramChatId: string | null) {
  const provider = getAwardProvider();
  // Never alert users off simulated data — mock results would page people
  // about award seats that don't exist.
  if (provider.name === "mock") return { hits: 0, sent: 0 };
  const dates = sampleDates(w.date_from, w.date_to, MAX_DATES_PER_WATCHLIST);
  const allResults: AwardItinerary[] = [];

  for (const date of dates) {
    try {
      const items = await provider.search({
        from: w.origin,
        to: w.destination,
        date,
        cabin: w.cabin,
        pax: w.pax,
      });
      allResults.push(...items);
    } catch (e) {
      console.error(`[poller] watchlist ${w.id} date ${date} failed:`, (e as Error).message);
    }
  }

  if (allResults.length === 0) return { hits: 0, sent: 0 };

  const minCpp = w.min_cpp_aud ?? 0;
  const candidates = allResults
    .map((a) => ({ a, cpp: calcCppAud(a) }))
    .filter(({ a, cpp }) => {
      if (cpp < minCpp) return false;
      if (w.max_miles != null && a.miles > w.max_miles) return false;
      if (a.seats < w.pax) return false;
      return true;
    })
    .sort((x, y) => y.cpp - x.cpp);

  if (candidates.length === 0) return { hits: 0, sent: 0 };

  // Take top hit per (programId+depart-date) to avoid spamming
  const seen = new Set<string>();
  const top = candidates.filter(({ a }) => {
    const k = `${a.programId}|${a.depart.slice(0, 10)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 3);

  let sent = 0;
  for (const { a, cpp } of top) {
    const fingerprint = `${w.id}|${a.id}|${a.depart.slice(0, 10)}`;
    // Dedup: skip if we've alerted on this in the last 24h
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const { data: existing } = await supabaseAdmin
      .from("alerts_sent")
      .select("id")
      .eq("watchlist_id", w.id)
      .eq("fingerprint", fingerprint)
      .gte("sent_at", since)
      .maybeSingle();
    if (existing) continue;

    if (w.channel === "telegram" && telegramChatId) {
      const grade = gradeCpp(cpp, a.cabin);
      const conf = confidenceFor(a);
      const fare = fareEstimateAud(a.from, a.to, a.cabin);
      const text =
        `🚨 <b>${grade.toUpperCase()} award seat — ${fmtCpp(cpp)}</b>\n` +
        `${w.label ? `<i>${escapeHtml(w.label)}</i>\n` : ""}` +
        `${a.from} → ${a.to} · ${a.depart.slice(0, 10)} · ${a.cabin}\n` +
        `${a.miles.toLocaleString()} ${a.programName} miles${a.taxesUsd ? ` + ~$${a.taxesUsd} taxes` : ""}\n` +
        `${a.seats} seat${a.seats === 1 ? "" : "s"} · ${a.carrier}\n` +
        `<b>Value</b>: vs ${fmtAud(fare)} cash · confidence ${conf.label}\n\n` +
        `Open Aureum to book before this disappears.`;
      try {
        await sendTelegramMessage(telegramChatId, text);
        sent += 1;
      } catch (e) {
        console.error(`[poller] telegram send failed for watchlist ${w.id}:`, (e as Error).message);
        continue;
      }
    }

    await supabaseAdmin.from("alerts_sent").insert({
      watchlist_id: w.id,
      fingerprint,
      cpp_aud: Math.round(cpp * 100) / 100,
      miles: a.miles,
    });
  }

  return { hits: candidates.length, sent };
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const Route = createFileRoute("/api/public/hooks/poll-watchlists")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        const expected = process.env.CRON_SECRET;
        if (!expected || token !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const start = Date.now();
        const startedAt = new Date().toISOString();
        const { data: watchlists, error } = await supabaseAdmin
          .from("watchlists")
          .select("id, user_id, origin, destination, date_from, date_to, cabin, pax, max_miles, min_cpp_aud, channel, active, label")
          .eq("active", true);
        if (error) {
          await supabaseAdmin.from("poller_runs").insert({
            started_at: startedAt,
            finished_at: new Date().toISOString(),
            processed: 0,
            alerts_sent: 0,
            errors: [{ stage: "load-watchlists", message: error.message }],
            duration_ms: Date.now() - start,
            ok: false,
          });
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        // Preload telegram chat IDs in one query
        const userIds = Array.from(new Set((watchlists ?? []).map((w) => w.user_id)));
        const { data: profiles } = userIds.length
          ? await supabaseAdmin.from("profiles").select("user_id, telegram_chat_id").in("user_id", userIds)
          : { data: [] as { user_id: string; telegram_chat_id: string | null }[] };
        const chatById = new Map((profiles ?? []).map((p) => [p.user_id, p.telegram_chat_id]));

        let totalSent = 0;
        let processed = 0;
        const errors: string[] = [];
        for (const w of (watchlists ?? []) as Watchlist[]) {
          try {
            const { sent } = await processWatchlist(w, chatById.get(w.user_id) ?? null);
            totalSent += sent;
            processed += 1;
          } catch (e) {
            errors.push(`${w.id}: ${(e as Error).message}`);
          }
        }

        const duration = Date.now() - start;
        await supabaseAdmin.from("poller_runs").insert({
          started_at: startedAt,
          finished_at: new Date().toISOString(),
          processed,
          alerts_sent: totalSent,
          errors: errors.map((e) => ({ message: e })),
          duration_ms: duration,
          ok: errors.length === 0,
        });

        return Response.json({
          ok: true,
          processed,
          alerts_sent: totalSent,
          errors,
          duration_ms: duration,
        });
      },
    },
  },
});
