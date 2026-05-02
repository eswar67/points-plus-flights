import type { AwardItinerary } from "@/server/awards/types";
import { PROGRAMS } from "@/lib/programs";

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
  const program = PROGRAMS.find((p) => p.id === award.programId);
  const accent = program?.accent ?? "#c9a84c";
  const programName = program?.name ?? award.programName;
  const alliance = program?.alliance ?? "Partner program";

  return (
    <div className="group relative rounded-xl border border-border bg-card hover:border-gold/40 transition overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition" />
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
          <button className="mt-3 text-xs uppercase tracking-[0.18em] px-4 py-2 rounded-full bg-gold text-gold-foreground hover:opacity-90 transition">
            Redeem
          </button>
        </div>
      </div>
    </div>
  );
}
