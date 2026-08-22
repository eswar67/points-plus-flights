import { Bell, BellRing, Check, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Cabin } from "@/lib/awards/types";
import type { RankedItinerary } from "@/lib/intelligence";
import type { SweetSpotInfo } from "@/lib/intelligence";
import { fareEstimateAud, fmtAud } from "@/lib/intelligence";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Enriched = RankedItinerary & SweetSpotInfo;

export type TopPickBannerRange = {
  from: string;
  to: string;
  cabin: Cabin;
  pax: number;
  dateFrom: string;
  dateTo: string;
};

/**
 * Picks the single most compelling itinerary from the currently visible set
 * and explains, in one sentence, WHY it's the customer's best bet. Also
 * offers a one-click "Alert me on better Top Picks" that upserts a
 * watchlist row using the current pick's CPP as the improvement threshold —
 * so the existing poller only pings the user when a strictly better
 * itinerary appears for this route/cabin.
 */
export function TopPickBanner({
  items,
  pax,
  range,
}: {
  items: Enriched[];
  pax: number;
  range?: TopPickBannerRange;
}) {
  const { user } = useAuth();
  const [alertState, setAlertState] = useState<"idle" | "saving" | "active" | "error">("idle");
  const [existingWatchlistId, setExistingWatchlistId] = useState<string | null>(null);

  // Detect an existing matching watchlist so we can toggle to "Active" state
  // without letting the user create a duplicate.
  useEffect(() => {
    if (!user || !range || !items || items.length === 0) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("watchlists")
        .select("id, min_cpp_aud, active")
        .eq("user_id", user.id)
        .eq("origin", range.from)
        .eq("destination", range.to)
        .eq("cabin", range.cabin)
        .eq("date_from", range.dateFrom)
        .eq("date_to", range.dateTo)
        .eq("active", true)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setExistingWatchlistId(data.id);
        setAlertState("active");
      } else {
        setExistingWatchlistId(null);
        setAlertState("idle");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, range?.from, range?.to, range?.cabin, range?.dateFrom, range?.dateTo]);

  if (!items || items.length === 0) return null;

  // Score: sweet spots first, then CPP, then miles.
  const pick = [...items].sort(
    (a, b) => Number(b.isSweetSpot) - Number(a.isSweetSpot) || b.cpp - a.cpp || a.miles - b.miles,
  )[0];

  const cash = fareEstimateAud(pick.from, pick.to, pick.cabin) * pax;
  const taxesAud = pick.taxesUsd * 1.55; // rough USD→AUD, purely indicative
  const cashSaved = Math.max(0, cash - taxesAud);

  const reason = pick.isSweetSpot
    ? `Sweet spot — ${Math.round(pick.discountPct * 100)}% under the typical ${pick.cabin} rate.`
    : pick.cpp >= 2.5
      ? `Exceptional value at ${pick.cpp.toFixed(1)}¢ per point.`
      : `Best value we found — ${pick.cpp.toFixed(1)}¢ per point.`;

  async function createOrUpdateAlert() {
    if (!user || !range) return;
    setAlertState("saving");
    // Threshold = current pick's CPP → poller only fires when a NEW option
    // strictly beats it (either higher CPP or lower miles for the same seat).
    const threshold = Math.max(0, pick.cpp);
    const payload = {
      user_id: user.id,
      origin: range.from,
      destination: range.to,
      cabin: range.cabin,
      pax: range.pax,
      date_from: range.dateFrom,
      date_to: range.dateTo,
      min_cpp_aud: Number(threshold.toFixed(2)),
      max_miles: pick.miles,
      label: `Beat ${pick.cpp.toFixed(1)}¢/pt · ${range.from}→${range.to}`,
      active: true,
      channel: "app" as const,
    };
    try {
      if (existingWatchlistId) {
        const { error } = await supabase
          .from("watchlists")
          .update({
            min_cpp_aud: payload.min_cpp_aud,
            max_miles: payload.max_miles,
            label: payload.label,
            active: true,
          })
          .eq("id", existingWatchlistId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("watchlists")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        if (data) setExistingWatchlistId(data.id);
      }
      setAlertState("active");
    } catch {
      setAlertState("error");
      setTimeout(() => setAlertState("idle"), 2500);
    }
  }

  return (
    <div className="mb-4 relative overflow-hidden rounded-lg border border-gold/40 bg-gradient-to-br from-gold/10 via-card to-background p-5 animate-fade-in">
      <div className="absolute -top-16 -right-16 size-48 rounded-full bg-gold/20 blur-3xl pointer-events-none" />
      <div className="relative flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 text-gold border border-gold/40 px-2.5 py-1 text-[10px] uppercase tracking-widest">
            <Sparkles className="size-3" />
            Top pick
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg md:text-xl">
            {pick.programName} · <span className="tabular-nums">{pick.miles.toLocaleString()}</span>{" "}
            <span className="text-muted-foreground text-sm">pts</span>
            <span className="text-muted-foreground text-sm"> · </span>
            <span className="text-muted-foreground text-sm tabular-nums">
              +A${Math.round(pick.taxesUsd * 1.55)} taxes
            </span>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {reason}
            {cashSaved > 300 ? (
              <span className="text-foreground">
                {" "}
                Save ~
                <span className="text-gold font-medium tabular-nums">{fmtAud(cashSaved)}</span> vs
                cash.
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2 text-xs uppercase tracking-widest text-gold">
            <TrendingUp className="size-3.5" />
            {pick.cpp.toFixed(1)}¢ / pt
          </div>
          {range && (
            <AlertButton
              state={alertState}
              onClick={createOrUpdateAlert}
              isAuthed={!!user}
              pickCpp={pick.cpp}
            />
          )}
        </div>
      </div>
      {alertState === "active" && (
        <div className="relative mt-3 pt-3 border-t border-gold/20 text-xs text-emerald-300/90 flex items-center gap-2 animate-fade-in">
          <Check className="size-3.5" />
          Alert set — we&apos;ll notify you if a new Top Pick beats {pick.cpp.toFixed(1)}¢/pt on
          this route.{" "}
          <Link
            to="/watchlists"
            className="underline decoration-dotted underline-offset-2 hover:text-gold"
          >
            Manage
          </Link>
        </div>
      )}
      {alertState === "error" && (
        <div className="relative mt-3 pt-3 border-t border-destructive/20 text-xs text-destructive animate-fade-in">
          Couldn&apos;t set the alert. Try again in a moment.
        </div>
      )}
    </div>
  );
}

function AlertButton({
  state,
  onClick,
  isAuthed,
  pickCpp,
}: {
  state: "idle" | "saving" | "active" | "error";
  onClick: () => void;
  isAuthed: boolean;
  pickCpp: number;
}) {
  if (!isAuthed) {
    return (
      <Link
        to="/watchlists"
        className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-card/70 backdrop-blur px-3 py-1.5 text-[10px] uppercase tracking-widest text-gold hover:bg-gold/10 transition"
        title="Create a watchlist for this route"
      >
        <Bell className="size-3" />
        Alert me
      </Link>
    );
  }
  if (state === "active") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-3 py-1.5 text-[10px] uppercase tracking-widest text-emerald-300 animate-scale-in"
        title={`Currently watching improvements past ${pickCpp.toFixed(1)}¢/pt — click to reset threshold`}
      >
        <BellRing className="size-3" />
        Alert active
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === "saving"}
      className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-card/70 backdrop-blur px-3 py-1.5 text-[10px] uppercase tracking-widest text-gold hover:bg-gold/10 transition disabled:opacity-50"
      title={`Notify me if a new itinerary beats ${pickCpp.toFixed(1)}¢/pt`}
    >
      <Bell className="size-3" />
      {state === "saving" ? "Setting…" : "Alert me"}
    </button>
  );
}
