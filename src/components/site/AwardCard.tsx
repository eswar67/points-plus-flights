import { useState } from "react";
import type { AwardItinerary } from "@/lib/awards/types";
import { PROGRAMS } from "@/lib/programs";
import { PlaybookDrawer } from "./PlaybookDrawer";
import {
  calcCppAud,
  confidenceFor,
  gradeCpp,
  fmtCpp,
  fmtAud,
  fmtAge,
  fareEstimateAud,
  transfersFor,
  effectiveBalances,
} from "@/lib/intelligence";
import { AlertTriangle, Bookmark, BookmarkCheck, Check, GitCompare, Plane, Sparkles, Zap, ArrowRightLeft } from "lucide-react";
import { useShortlist } from "@/hooks/useShortlist";
import { useCompare } from "@/hooks/useCompare";

function fmtDuration(min: number) {
  if (!min) return "—";
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function fmtTime(value: string) {
  // Accepts ISO datetime, "YYYY-MM-DD", or "HH:mm"
  if (!value) return "—";
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  // Date-only (no time component): showing a clock time would be fabricated.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(value + "T00:00:00");
    return d.toLocaleDateString([], { day: "numeric", month: "short" });
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function AwardCard({
  award,
  balances = {},
  reason,
  isSweetSpot,
  baselineMiles,
  savingsMiles,
  discountPct,
}: {
  award: AwardItinerary;
  balances?: Record<string, number>;
  reason?: string;
  isSweetSpot?: boolean;
  baselineMiles?: number;
  savingsMiles?: number;
  discountPct?: number;
}) {
  const [open, setOpen] = useState(false);
  const { has, toggle } = useShortlist();
  const saved = has(award.id);
  const [flash, setFlash] = useState(false);
  const compare = useCompare();
  const compareSelected = compare.has(award.id);
  const [compareShake, setCompareShake] = useState(false);
  const byProgramId = balances;
  const program = PROGRAMS.find((p) => p.id === award.programId);
  const accent = program?.accent ?? "#c9a84c";
  const programName = program?.name ?? award.programName;
  const alliance = program?.alliance ?? "Partner program";

  const cpp = calcCppAud(award);
  const grade = gradeCpp(cpp, award.cabin);
  const confidence = confidenceFor(award);
  const fare = fareEstimateAud(award.from, award.to, award.cabin);
  const balance = byProgramId[award.programId] ?? 0;
  const shortfall = Math.max(0, award.miles - balance);
  const fastest = shortfall > 0 ? transfersFor(award.programId)[0] : undefined;
  const transferTooSlow = !!fastest && fastest.etaMin > 60 && confidence.ageMin < 30;

  // Bookability against the user's tracked balances (direct + transfer reach)
  const hasAnyBalance = Object.keys(byProgramId).length > 0;
  const reach = hasAnyBalance ? effectiveBalances(byProgramId) : {};
  const effective = reach[award.programId]?.total ?? balance;
  const bookable: "direct" | "transfer" | "short" | null = !hasAnyBalance
    ? null
    : balance >= award.miles
      ? "direct"
      : effective >= award.miles
        ? "transfer"
        : "short";

  const gradeStyles: Record<typeof grade, string> = {
    exceptional: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    great: "bg-gold/15 text-gold border-gold/40",
    fair: "bg-muted text-muted-foreground border-border",
    skip: "bg-destructive/10 text-destructive/80 border-destructive/30",
  };
  const confStyles: Record<typeof confidence.label, string> = {
    live: "text-live",
    likely: "text-gold",
    stale: "text-muted-foreground",
  };

  // Value meter: how far this CPP sits along the road to "exceptional" for the cabin.
  const exceptionalCpp =
    award.cabin === "first"
      ? 6.0
      : award.cabin === "business"
        ? 5.0
        : award.cabin === "premium"
          ? 3.5
          : 2.5;
  const meterPct = Math.max(4, Math.min(100, (cpp / (exceptionalCpp * 1.15)) * 100));
  const meterColor: Record<typeof grade, string> = {
    exceptional: "oklch(0.72 0.17 160)",
    great: "var(--gold)",
    fair: "oklch(0.62 0.01 90)",
    skip: "oklch(0.55 0.16 25)",
  };

  return (
    <div
      className={`group relative border bg-card/60 transition overflow-hidden ${
        isSweetSpot
          ? "border-gold shadow-[0_20px_60px_-30px_color-mix(in_oklab,var(--gold)_45%,transparent)]"
          : "border-border-soft hover:border-gold/40"
      }`}
    >
      {/* Editorial hairline sweep on hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-0 group-hover:opacity-100 transition" />

      {/* Editor's pick tag — only on the sweet-spot / top pick */}
      {isSweetSpot && (
        <div className="absolute top-0 right-0 z-10 bg-gold text-[color:var(--gold-foreground)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]">
          Editor's Best Value Pick
        </div>
      )}

      {/* Save (shortlist) toggle — top-right, shifts left when the pick tag is present */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          const nowSaved = toggle(award);
          if (nowSaved) {
            setFlash(true);
            setTimeout(() => setFlash(false), 700);
          }
        }}
        aria-pressed={saved}
        aria-label={saved ? "Remove from shortlist" : "Save to shortlist"}
        title={saved ? "Saved · click to remove" : "Save for later"}
        className={`absolute top-2 z-20 inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] transition ${
          isSweetSpot ? "right-[190px]" : "right-2"
        } ${
          saved
            ? "border-gold/50 bg-gold/15 text-gold"
            : "border-border-soft bg-card/70 backdrop-blur text-muted-foreground hover:text-gold hover:border-gold/40"
        } ${flash ? "animate-scale-in" : ""}`}
      >
        {saved ? (
          <>
            <BookmarkCheck className="size-3.5" /> Saved
          </>
        ) : (
          <>
            <Bookmark className="size-3.5" /> Save
          </>
        )}
      </button>

      {/* Compare toggle — sits next to Save */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          const result = compare.toggle(award);
          if (result === "full") {
            setCompareShake(true);
            setTimeout(() => setCompareShake(false), 500);
          }
        }}
        aria-pressed={compareSelected}
        aria-label={compareSelected ? "Remove from comparison" : "Add to comparison"}
        title={
          compareSelected
            ? "In comparison"
            : compare.full
              ? "Comparison full (max 3) — remove one first"
              : "Add to comparison"
        }
        className={`absolute top-2 z-20 inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] transition ${
          isSweetSpot ? "right-[290px]" : "right-[92px]"
        } ${
          compareSelected
            ? "border-gold/50 bg-gold/15 text-gold"
            : compare.full
              ? "border-border-soft bg-card/70 backdrop-blur text-muted-foreground/50"
              : "border-border-soft bg-card/70 backdrop-blur text-muted-foreground hover:text-gold hover:border-gold/40"
        } ${compareShake ? "animate-scale-in" : ""}`}
      >
        <GitCompare className="size-3.5" />
        {compareSelected ? "Comparing" : "Compare"}
      </button>

      {/* Editorial masthead: program monogram + name + status */}
      <div className={`flex items-start gap-4 ${isSweetSpot ? "px-8 pt-8" : "px-6 pt-6"}`}>
        <div
          className={`shrink-0 grid place-items-center rounded-full border font-semibold tracking-tight ${
            isSweetSpot ? "size-14 text-lg" : "size-11 text-sm"
          }`}
          style={{
            borderColor: "color-mix(in oklab, " + accent + " 55%, transparent)",
            color: accent,
            background: "color-mix(in oklab, " + accent + " 6%, transparent)",
          }}
          aria-hidden="true"
        >
          {(program?.id ?? award.programId).slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`font-display truncate ${isSweetSpot ? "text-2xl" : "text-lg"}`}>
            {programName}
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5 truncate">
            {alliance} · {award.carrier}
            {award.flightNo ? ` ${award.flightNo}` : ""}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-[10px] tabular-nums shrink-0 ${confStyles[confidence.label]}`}
        >
          <span
            className={`size-1.5 rounded-full ${confidence.label === "live" ? "bg-live" : confidence.label === "likely" ? "bg-gold" : "bg-muted-foreground"}`}
          />
          <span className="uppercase tracking-[0.2em]">
            {confidence.label} · {fmtAge(confidence.ageMin)}
          </span>
        </span>
      </div>

      {/* Sweet-spot savings strapline (only on featured card) */}
      {isSweetSpot && savingsMiles && savingsMiles > 0 && (
        <div className="px-8 mt-4 flex items-center gap-2 text-xs text-gold">
          <Sparkles className="size-3.5" />
          <span className="tabular-nums">
            Saves {savingsMiles.toLocaleString()} pts vs typical{" "}
            {(baselineMiles ?? 0).toLocaleString()}
            {discountPct ? ` · ${Math.round(discountPct * 100)}% off` : ""}
          </span>
        </div>
      )}

      {/* Grade + cash-comparison strip */}
      <div
        className={`flex flex-wrap items-center gap-2 mt-4 ${
          isSweetSpot ? "px-8 pb-4" : "px-6 pb-3"
        }`}
      >
        <span
          className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 border tabular-nums ${gradeStyles[grade]}`}
        >
          {grade === "exceptional" && <Sparkles className="size-3" />}
          {grade} · {fmtCpp(cpp)}
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          vs {fmtAud(fare)} cash
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 tabular-nums ml-auto">
          {award.seats > 0
            ? `${award.seats} seat${award.seats > 1 ? "s" : ""}`
            : "Availability confirmed"}
        </span>
      </div>

      {/* Why this ranks here — reflects the active sort */}
      {reason && (
        <div
          className={`py-2 border-t border-border-soft text-xs text-muted-foreground ${
            isSweetSpot ? "px-8" : "px-6"
          }`}
        >
          <span className="text-gold/80 uppercase tracking-[0.2em] mr-2">Why</span>
          {reason}
        </div>
      )}

      {/* Hairline value meter */}
      <div className="h-px bg-border-soft" aria-hidden="true">
        <div
          className="h-full transition-[width] duration-700 ease-out"
          style={{ width: `${meterPct}%`, background: meterColor[grade], opacity: 0.85 }}
        />
      </div>

      {/* Editorial body: route timeline + tabular numerics */}
      <div
        className={`grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-8 ${
          isSweetSpot ? "px-8 py-8" : "px-6 py-6"
        }`}
      >
        {/* Route timeline */}
        <div className="min-w-0">
          <div className="flex items-center gap-4">
            <div className="text-left">
              <div
                className={`font-display tabular-nums ${isSweetSpot ? "text-4xl" : "text-2xl"}`}
              >
                {fmtTime(award.depart)}
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                {award.from}
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="text-[10px] text-center text-muted-foreground/80 uppercase tracking-[0.2em] mb-2">
                {award.durationMin ? fmtDuration(award.durationMin) : ""}
                {award.durationMin && (award.direct || award.stops === 0 || award.stops) ? " · " : ""}
                {award.direct
                  ? "Nonstop"
                  : award.stops === 0
                    ? "Direct"
                    : `${award.stops} stop${award.stops > 1 ? "s" : ""}`}
              </div>
              <div className="relative h-px bg-gradient-to-r from-gold/20 via-gold/60 to-gold/20">
                <span className="absolute -top-[3px] left-0 size-1.5 rounded-full bg-gold" />
                <span className="absolute -top-[3px] right-0 size-1.5 rounded-full bg-gold" />
                <Plane
                  className="absolute -top-[8px] size-4 text-gold rotate-45 hidden group-hover:block animate-fly"
                  aria-hidden="true"
                />
              </div>
            </div>
            <div className="text-right">
              <div
                className={`font-display tabular-nums ${isSweetSpot ? "text-4xl" : "text-2xl"}`}
              >
                {fmtTime(award.arrive)}
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                {award.to}
              </div>
            </div>
          </div>

          {/* Bookability line */}
          <div className="mt-5">
          {bookable === "direct" && (
            <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 border border-emerald-400/40 bg-emerald-500/10 text-emerald-300">
              <Check className="size-3" /> Book now
            </div>
          )}
          {bookable === "transfer" && fastest && (
            <div className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 border border-gold/40 bg-gold/5 text-gold tabular-nums">
              <ArrowRightLeft className="size-3" />
              Transfer {Math.max(0, award.miles - balance).toLocaleString()} from{" "}
              {fastest.bank}
              <span className="opacity-70">
                · {fastest.etaMin < 60 ? "instant" : `~${Math.round(fastest.etaMin / 60)}h`}
              </span>
            </div>
          )}
          {bookable === "short" && (
            <div className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 border border-border-soft bg-muted/30 text-muted-foreground tabular-nums">
              Short {(award.miles - effective).toLocaleString()} pts
            </div>
          )}
          </div>
        </div>

        {/* Tabular figures: points / taxes / cpp — right-aligned editorial */}
        <div className="min-w-0 md:border-l md:border-border-soft md:pl-8 flex flex-col justify-between gap-6">
          <div className="grid grid-cols-2 gap-6 md:text-right">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                Points
              </div>
              <div
                className={`font-display tabular-nums ${
                  isSweetSpot ? "text-4xl text-gold-gradient" : "text-2xl"
                }`}
              >
                {award.miles.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                Taxes
              </div>
              <div className={`font-display tabular-nums ${isSweetSpot ? "text-4xl" : "text-2xl"}`}>
                {award.taxesUsd ? `$${award.taxesUsd}` : "—"}
                {award.taxesUsd ? (
                  <span className="text-[11px] font-sans align-top ml-1 opacity-40 uppercase tracking-normal">
                    usd
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-4 border-t border-border-soft">
            <div className="min-w-0">
              <div className="text-gold font-display text-xl tabular-nums leading-none">
                {fmtCpp(cpp)}
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                Redemption value
              </div>
            </div>
            <button
              onClick={() => setOpen(true)}
              className={`shrink-0 ${isSweetSpot ? "btn btn-primary" : "btn btn-ghost"}`}
            >
              Plan & redeem
            </button>
          </div>
        </div>
      </div>

      {(transferTooSlow || award.seats <= 1) && (
        <div className={`pb-4 -mt-2 ${isSweetSpot ? "px-8" : "px-6"}`}>
          <div className="inline-flex items-start gap-2 text-xs text-amber-300/90 bg-amber-500/5 border border-amber-500/20 rounded-md px-2.5 py-1.5">
            <AlertTriangle className="size-3.5 mt-px flex-shrink-0" />
            {transferTooSlow ? (
              <span>
                Risk: {fastest!.bank} → {programName} takes ~{Math.round(fastest!.etaMin / 60)}h.
                Seat may be gone before points land. Use Bilt or Chase if you have them.
              </span>
            ) : (
              <span>Only {award.seats} seat left — book within minutes once miles arrive.</span>
            )}
          </div>
        </div>
      )}

      {grade === "exceptional" && (
        <div className={`pb-4 -mt-2 ${isSweetSpot ? "px-8" : "px-6"}`}>
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-300/90">
            <Zap className="size-3.5" /> Top-decile value for this route. Book now.
          </div>
        </div>
      )}

      {open && <PlaybookDrawer award={award} onClose={() => setOpen(false)} />}
    </div>
  );
}
