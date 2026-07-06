import { useState } from "react";
import type { AwardItinerary } from "@/lib/awards/types";
import { PROGRAMS } from "@/lib/programs";
import { PlaybookDrawer } from "./PlaybookDrawer";
import { calcCppAud, confidenceFor, gradeCpp, fmtCpp, fmtAud, fmtAge, fareEstimateAud, transfersFor } from "@/lib/intelligence";
import { AlertTriangle, Plane, Sparkles, Zap } from "lucide-react";

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
}: {
  award: AwardItinerary;
  balances?: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
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

  const gradeStyles: Record<typeof grade, string> = {
    exceptional: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    great:       "bg-gold/15 text-gold border-gold/40",
    fair:        "bg-muted text-muted-foreground border-border",
    skip:        "bg-destructive/10 text-destructive/80 border-destructive/30",
  };
  const confStyles: Record<typeof confidence.label, string> = {
    live:   "text-emerald-400",
    likely: "text-gold",
    stale:  "text-muted-foreground",
  };

  // Value meter: how far this CPP sits along the road to "exceptional" for the cabin.
  const exceptionalCpp =
    award.cabin === "first" ? 6.0 : award.cabin === "business" ? 5.0 : award.cabin === "premium" ? 3.5 : 2.5;
  const meterPct = Math.max(4, Math.min(100, (cpp / (exceptionalCpp * 1.15)) * 100));
  const meterColor: Record<typeof grade, string> = {
    exceptional: "oklch(0.72 0.17 160)",
    great:       "var(--gold)",
    fair:        "oklch(0.62 0.01 90)",
    skip:        "oklch(0.55 0.16 25)",
  };

  return (
    <div className="group relative rounded-xl border border-border bg-card hover:border-gold/40 transition overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition" />
      {/* Intelligence strip */}
      <div className="px-5 pt-3 pb-2 flex flex-wrap items-center gap-2 border-b border-border/50">
        <span className={`inline-flex items-center gap-1 text-xs uppercase tracking-widest px-2.5 py-1 rounded-full border tabular-nums ${gradeStyles[grade]}`}>
          {grade === "exceptional" && <Sparkles className="size-3" />}
          {grade.toUpperCase()} · {fmtCpp(cpp)}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          vs {fmtAud(fare)} cash
        </span>
        <span className={`inline-flex items-center gap-1 text-xs ml-auto tabular-nums ${confStyles[confidence.label]}`}>
          <span className={`size-1.5 rounded-full ${confidence.label === "live" ? "bg-emerald-400" : confidence.label === "likely" ? "bg-gold" : "bg-muted-foreground"}`} />
          {confidence.label} · {fmtAge(confidence.ageMin)}
        </span>
      </div>

      {/* Value meter */}
      <div className="h-0.5 bg-border/30" aria-hidden="true">
        <div
          className="h-full transition-[width] duration-700 ease-out"
          style={{ width: `${meterPct}%`, background: meterColor[grade], opacity: 0.85 }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr_auto] gap-6 p-5 items-center">
        <div>
          <div className="text-sm text-foreground/90">{award.carrier}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{award.flightNo || "Award seat"}</div>
          <div className="text-xs text-muted-foreground mt-1 tabular-nums">
            {award.seats > 0 ? `${award.seats} seat${award.seats > 1 ? "s" : ""} remaining` : "Availability confirmed"}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="font-display text-xl tabular-nums">{fmtTime(award.depart)}</div>
            <div className="text-xs text-muted-foreground tracking-widest">{award.from}</div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-center text-muted-foreground mb-1">
              {award.durationMin ? `${fmtDuration(award.durationMin)} · ` : ""}
              {award.direct ? "Nonstop" : award.stops === 0 ? "Direct" : `${award.stops} stop${award.stops > 1 ? "s" : ""}`}
            </div>
            <div className="relative h-px bg-gradient-to-r from-border via-gold/50 to-border">
              <span className="absolute -top-[3px] left-0 size-1.5 rounded-full bg-gold" />
              <span className="absolute -top-[3px] right-0 size-1.5 rounded-full bg-gold" />
              <Plane
                className="absolute -top-[8px] size-4 text-gold rotate-45 hidden group-hover:block animate-fly"
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="text-center">
            <div className="font-display text-xl tabular-nums">{fmtTime(award.arrive)}</div>
            <div className="text-xs text-muted-foreground tracking-widest">{award.to}</div>
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-1">Redeem with</div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: accent }} />
            <span className="text-sm">{programName}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">{alliance}</div>
        </div>

        <div className="flex items-center justify-between gap-4 md:block md:text-right">
          <div>
            <div className="font-display text-3xl tabular-nums text-gold-gradient">
              {award.miles.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground tabular-nums">
              miles{award.taxesUsd ? ` + $${award.taxesUsd} taxes` : ""}
            </div>
          </div>
          <button onClick={() => setOpen(true)} className="md:mt-3 btn btn-primary">
            Plan & redeem
          </button>
        </div>
      </div>

      {(transferTooSlow || award.seats <= 1) && (
        <div className="px-5 pb-3 -mt-1">
          <div className="inline-flex items-start gap-2 text-xs text-amber-300/90 bg-amber-500/5 border border-amber-500/20 rounded-md px-2.5 py-1.5">
            <AlertTriangle className="size-3.5 mt-px flex-shrink-0" />
            {transferTooSlow ? (
              <span>
                Risk: {fastest!.bank} → {programName} takes ~{Math.round(fastest!.etaMin / 60)}h. Seat may be gone before points land. Use Bilt or Chase if you have them.
              </span>
            ) : (
              <span>Only {award.seats} seat left — book within minutes once miles arrive.</span>
            )}
          </div>
        </div>
      )}

      {grade === "exceptional" && (
        <div className="px-5 pb-3 -mt-1">
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-300/90">
            <Zap className="size-3.5" /> Top-decile value for this route. Book now.
          </div>
        </div>
      )}

      {open && <PlaybookDrawer award={award} onClose={() => setOpen(false)} />}
    </div>
  );
}
