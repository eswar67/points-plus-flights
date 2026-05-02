import { useState } from "react";
import type { AwardItinerary } from "@/server/awards/types";
import { PROGRAMS } from "@/lib/programs";
import { PlaybookDrawer } from "./PlaybookDrawer";
import { calcCppAud, confidenceFor, gradeCpp, fmtCpp, fmtAud, fmtAge, fareEstimateAud, transfersFor } from "@/lib/intelligence";
import { AlertTriangle, Sparkles, Zap } from "lucide-react";

function fmtDuration(min: number) {
  if (!min) return "—";
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function fmtTime(value: string) {
  // Accepts ISO datetime, "YYYY-MM-DD", or "HH:mm"
  if (!value) return "—";
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function AwardCard({ award }: { award: AwardItinerary }) {
  const [open, setOpen] = useState(false);
  const program = PROGRAMS.find((p) => p.id === award.programId);
  const accent = program?.accent ?? "#c9a84c";
  const programName = program?.name ?? award.programName;
  const alliance = program?.alliance ?? "Partner program";

  const cpp = calcCppAud(award);
  const grade = gradeCpp(cpp, award.cabin);
  const confidence = confidenceFor(award);
  const fare = fareEstimateAud(award.from, award.to, award.cabin);
  const balance = 0;
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

  return (
    <div className="group relative rounded-xl border border-border bg-card hover:border-gold/40 transition overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition" />
      {/* Intelligence strip */}
      <div className="px-5 pt-3 pb-2 flex flex-wrap items-center gap-2 border-b border-border/50">
        <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border ${gradeStyles[grade]}`}>
          {grade === "exceptional" && <Sparkles className="size-3" />}
          {grade.toUpperCase()} · {fmtCpp(cpp)}
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          vs {fmtAud(fare)} cash
        </span>
        <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] ml-auto ${confStyles[confidence.label]}`}>
          <span className={`size-1.5 rounded-full ${confidence.label === "live" ? "bg-emerald-400" : confidence.label === "likely" ? "bg-gold" : "bg-muted-foreground"}`} />
          {confidence.label} · {fmtAge(confidence.ageMin)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr_auto] gap-6 p-5 items-center">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{award.carrier}</div>
          <div className="font-display text-lg">{award.flightNo || "Award seat"}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {award.seats > 0 ? `${award.seats} seat${award.seats > 1 ? "s" : ""} remaining` : "Availability confirmed"}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="font-display text-2xl">{fmtTime(award.depart)}</div>
            <div className="text-xs text-muted-foreground tracking-widest">{award.from}</div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-center uppercase tracking-[0.18em] text-muted-foreground mb-1">
              {fmtDuration(award.durationMin)} · {award.direct ? "Nonstop" : award.stops === 0 ? "Direct" : `${award.stops} stop${award.stops > 1 ? "s" : ""}`}
            </div>
            <div className="relative h-px bg-gradient-to-r from-border via-gold/50 to-border">
              <span className="absolute -top-[3px] left-0 size-1.5 rounded-full bg-gold" />
              <span className="absolute -top-[3px] right-0 size-1.5 rounded-full bg-gold" />
            </div>
          </div>
          <div className="text-center">
            <div className="font-display text-2xl">{fmtTime(award.arrive)}</div>
            <div className="text-xs text-muted-foreground tracking-widest">{award.to}</div>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Redeem with</div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: accent }} />
            <span className="text-sm">{programName}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">{alliance}</div>
        </div>

        <div className="text-right">
          <div className="font-display text-2xl text-gold-gradient">
            {award.miles.toLocaleString()}
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            miles{award.taxesUsd ? ` + $${award.taxesUsd}` : ""}
          </div>
          <button
            onClick={() => setOpen(true)}
            className="mt-3 text-xs uppercase tracking-[0.18em] px-4 py-2 rounded-full bg-gold text-gold-foreground hover:opacity-90 transition"
          >
            Plan & redeem
          </button>
        </div>
      </div>

      {(transferTooSlow || award.seats <= 1) && (
        <div className="px-5 pb-3 -mt-1">
          <div className="inline-flex items-start gap-2 text-[11px] text-amber-300/90 bg-amber-500/5 border border-amber-500/20 rounded-md px-2.5 py-1.5">
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
          <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300/90">
            <Zap className="size-3.5" /> Top-decile value for this route. Book now.
          </div>
        </div>
      )}

      {open && <PlaybookDrawer award={award} onClose={() => setOpen(false)} />}
    </div>
  );
}
