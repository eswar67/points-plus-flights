import type { Award } from "@/lib/awards";
import { fmtDuration } from "@/lib/awards";
import { PROGRAMS } from "@/lib/programs";

export function AwardCard({ award }: { award: Award }) {
  const program = PROGRAMS.find((p) => p.id === award.programId)!;
  return (
    <div className="group relative rounded-xl border border-border bg-card hover:border-gold/40 transition overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition" />
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr_auto] gap-6 p-5 items-center">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{award.carrier}</div>
          <div className="font-display text-lg">{award.flightNo}</div>
          <div className="text-xs text-muted-foreground mt-1">{award.seats} seats remaining</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="font-display text-2xl">{award.depart}</div>
            <div className="text-xs text-muted-foreground tracking-widest">{award.from}</div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-center uppercase tracking-[0.18em] text-muted-foreground mb-1">
              {fmtDuration(award.durationMin)} · {award.stops === 0 ? "Nonstop" : `${award.stops} stop${award.stops > 1 ? "s" : ""}`}
            </div>
            <div className="relative h-px bg-gradient-to-r from-border via-gold/50 to-border">
              <span className="absolute -top-[3px] left-0 size-1.5 rounded-full bg-gold" />
              <span className="absolute -top-[3px] right-0 size-1.5 rounded-full bg-gold" />
            </div>
          </div>
          <div className="text-center">
            <div className="font-display text-2xl">{award.arrive}</div>
            <div className="text-xs text-muted-foreground tracking-widest">{award.to}</div>
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Redeem with</div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: program.accent }} />
            <span className="text-sm">{program.name}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">{program.alliance}</div>
        </div>

        <div className="text-right">
          <div className="font-display text-2xl text-gold-gradient">
            {award.miles.toLocaleString()}
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">miles + ${award.taxesUsd}</div>
          <button className="mt-3 text-xs uppercase tracking-[0.18em] px-4 py-2 rounded-full bg-gold text-gold-foreground hover:opacity-90 transition">
            Redeem
          </button>
        </div>
      </div>
    </div>
  );
}
