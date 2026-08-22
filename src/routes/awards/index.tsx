import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { fmtAud } from "@/lib/intelligence";
import {
  REGIONS,
  corridorFor,
  allCorridors,
  getRegion,
  type RegionId,
  type CorridorSpot,
  ADVANCED_PLAYS,
  COMMON_MISTAKES,
  GOLDEN_RULE,
} from "@/lib/awards/corridors";
import { PROGRAMS, getProgram } from "@/lib/programs";

const CABIN_LABEL: Record<CorridorSpot["cabin"], string> = {
  economy: "Economy",
  premium: "Premium",
  business: "Business",
  first: "First",
};

const CABIN_ORDER: CorridorSpot["cabin"][] = ["economy", "premium", "business", "first"];

export const Route = createFileRoute("/awards/")({
  head: () => ({
    meta: [
      { title: "Award Flight Redemption Playbook — Anywhere to Anywhere | Miles Expert" },
      {
        name: "description",
        content:
          "Every corridor, every cabin, every airline program. The complete award-flight redemption playbook — from Australia to Europe, India to North America, and everywhere in between.",
      },
      { property: "og:title", content: "Award Flight Redemption Playbook — Miles Expert" },
      {
        property: "og:description",
        content:
          "Anywhere-to-anywhere award redemption sweet spots across every major loyalty program.",
      },
    ],
  }),
  component: AwardsIndex,
});

function AwardsIndex() {
  const corridors = allCorridors();
  const [fromRegion, setFromRegion] = useState<RegionId>("oceania");
  const [toRegion, setToRegion] = useState<RegionId>("europe");

  const corridor = useMemo(() => corridorFor(fromRegion, toRegion), [fromRegion, toRegion]);

  // Editorial hero — three genuinely cheapest per-mile picks across all corridors.
  const featured = useMemo(() => {
    const picks: (CorridorSpot & { from: RegionId; to: RegionId; headline: string })[] = [];
    for (const c of corridors) {
      for (const s of c.spots) {
        picks.push({ ...s, from: c.from, to: c.to, headline: c.headline });
      }
    }
    // Highlight standout deals — economy under 25k, business under 60k, first-class flagship.
    const eco = picks.find((s) => s.cabin === "economy" && s.miles <= 20000);
    const biz = picks.find((s) => s.cabin === "business" && s.miles <= 50000);
    const prem = picks.find((s) => s.cabin === "premium" && s.miles <= 30000);
    return [eco, prem, biz].filter(Boolean) as typeof picks;
  }, [corridors]);

  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-16">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <span className="text-xs uppercase tracking-widest text-gold">The Redemption Playbook</span>
        <h1 className="font-display text-5xl md:text-6xl mt-4 max-w-4xl leading-[1.05]">
          Every route. <span className="text-gold-gradient">Every program.</span> Everywhere on
          Earth.
        </h1>
        <p className="mt-5 text-muted-foreground max-w-2xl leading-relaxed">
          The complete anywhere-to-anywhere redemption menu. Pick where you're flying from and where
          you're headed — we'll show you the miles, the metal, the taxes and the trade-offs across
          every major loyalty program.
        </p>

        {/* ── Editorial featured picks ─────────────────────────────── */}
        {featured.length > 0 && (
          <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-3">
            {featured.map((s, i) => {
              const p = getProgram(s.programId);
              return (
                <div
                  key={i}
                  className="rounded-lg hairline bg-card p-6 hover:border-gold/60 transition"
                >
                  <div className="flex items-center justify-between">
                    <ProgramChip programId={s.programId} />
                    <span className="text-[10px] uppercase tracking-widest text-gold">
                      {CABIN_LABEL[s.cabin]}
                    </span>
                  </div>
                  <div className="font-display text-xl mt-4 leading-snug">
                    {getRegion(s.from).label} → {getRegion(s.to).label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{s.routing}</div>
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="font-mono tabular-nums text-2xl text-foreground">
                      {s.miles.toLocaleString()}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {p?.short} · + ~{fmtAud(s.taxesAud ?? 0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* ── Corridor picker ──────────────────────────────────────── */}
        <section className="mt-16">
          <div className="flex items-baseline justify-between border-b border-border-soft pb-3">
            <h2 className="font-display text-2xl">
              Anywhere <span className="text-gold">→</span> Anywhere
            </h2>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Pick a corridor
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RegionPicker
              label="From"
              selected={fromRegion}
              onSelect={setFromRegion}
              disabledId={toRegion}
            />
            <RegionPicker
              label="To"
              selected={toRegion}
              onSelect={setToRegion}
              disabledId={fromRegion}
            />
          </div>

          <div className="mt-8">
            {corridor ? (
              <CorridorPanel
                headline={corridor.headline}
                strategy={corridor.strategy}
                bestFor={corridor.bestFor}
                spots={corridor.spots}
                fromLabel={getRegion(fromRegion).label}
                toLabel={getRegion(toRegion).label}
              />
            ) : (
              <div className="rounded-lg border border-border-soft bg-card/40 p-10 text-center">
                <div className="font-display text-xl">
                  {getRegion(fromRegion).label} <span className="text-gold">→</span>{" "}
                  {getRegion(toRegion).label}
                </div>
                <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
                  We're still curating the redemption menu for this corridor. Meanwhile, try one of
                  the corridors shown below — most world regions connect through them.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Best program per corridor (cheat sheet) ──────────────── */}
        <section className="mt-20">
          <div className="flex items-baseline justify-between border-b border-border-soft pb-3">
            <h2 className="font-display text-2xl">Best program per corridor</h2>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              The cheat sheet
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
            If you only remember one program per corridor, make it these. Each is the community's
            go-to first stop — where value density beats loyalty every time.
          </p>
          <div className="mt-6 rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background/40 text-muted-foreground uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="text-left px-4 py-3">Corridor</th>
                  <th className="text-left px-4 py-3">Go-to programs</th>
                  <th className="text-left px-4 py-3">Why</th>
                </tr>
              </thead>
              <tbody>
                {corridors.map((c) => (
                  <tr
                    key={`${c.from}-${c.to}`}
                    className="border-t border-border-soft hover:bg-background/40 transition-colors cursor-pointer"
                    onClick={() => {
                      setFromRegion(c.from);
                      setToRegion(c.to);
                      if (typeof window !== "undefined") {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                  >
                    <td className="px-4 py-3">
                      <span className="font-display text-base">{c.headline}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {c.bestFor.map((id) => (
                          <ProgramChip key={id} programId={id} compact />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-md leading-relaxed">
                      {c.strategy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Golden rule ──────────────────────────────────────────── */}
        <section className="mt-20 rounded-lg bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/30 p-8 md:p-10">
          <span className="text-[10px] uppercase tracking-widest text-gold">The Golden Rule</span>
          <h2 className="font-display text-3xl md:text-4xl mt-3 max-w-3xl leading-tight">
            {GOLDEN_RULE.title}
          </h2>
          <p className="mt-4 text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {GOLDEN_RULE.body}
          </p>
        </section>

        {/* ── Advanced plays ───────────────────────────────────────── */}
        <section className="mt-20">
          <div className="flex items-baseline justify-between border-b border-border-soft pb-3">
            <h2 className="font-display text-2xl">Advanced plays</h2>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Level up
            </span>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ADVANCED_PLAYS.map((p) => (
              <article key={p.title} className="rounded-lg hairline bg-card p-5">
                <span className="text-[10px] uppercase tracking-widest text-gold">{p.tag}</span>
                <h3 className="font-display text-lg mt-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{p.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Common mistakes ──────────────────────────────────────── */}
        <section className="mt-20">
          <div className="flex items-baseline justify-between border-b border-border-soft pb-3">
            <h2 className="font-display text-2xl">Common mistakes to avoid</h2>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              The traps
            </span>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {COMMON_MISTAKES.map((p) => (
              <article
                key={p.title}
                className="rounded-lg border border-destructive/20 bg-card p-5"
              >
                <span className="text-[10px] uppercase tracking-widest text-destructive/80">
                  {p.tag}
                </span>
                <h3 className="font-display text-lg mt-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{p.body}</p>
              </article>
            ))}
          </div>
        </section>

        <p className="mt-20 text-[10px] uppercase tracking-widest text-muted-foreground/60 max-w-2xl leading-relaxed">
          Editorial intelligence synthesised from Point Hacks AU, God Save the Points, One Mile at a
          Time, Frequent Miler, The Points Guy, PointsFly and Australian Frequent Flyer. Confirm
          live in-program before transferring — award pricing changes constantly.
        </p>
      </main>
      <Footer />
    </div>
  );
}

// -----------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------

function ProgramChip({ programId, compact = false }: { programId: string; compact?: boolean }) {
  const p = getProgram(programId);
  const accent = p?.accent ?? "#c9a765";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`${compact ? "size-6 text-[9px]" : "size-8 text-xs"} rounded-full grid place-items-center font-display`}
        style={{
          background: `${accent}22`,
          color: accent,
          border: `1px solid ${accent}55`,
        }}
      >
        {p?.short ?? "?"}
      </span>
      {!compact && <span className="text-sm">{p?.name ?? programId}</span>}
      {compact && (
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {p?.short}
        </span>
      )}
    </span>
  );
}

function RegionPicker({
  label,
  selected,
  onSelect,
  disabledId,
}: {
  label: string;
  selected: RegionId;
  onSelect: (id: RegionId) => void;
  disabledId: RegionId;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
        {label}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {REGIONS.map((r) => {
          const isSelected = r.id === selected;
          const isDisabled = r.id === disabledId;
          return (
            <button
              key={r.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(r.id)}
              className={`text-left rounded-lg px-3 py-3 border transition ${
                isSelected
                  ? "border-gold bg-gold/10 shadow-[0_0_0_1px_hsl(var(--gold)/0.3)]"
                  : isDisabled
                    ? "border-border-soft/50 bg-card/20 opacity-40 cursor-not-allowed"
                    : "border-border bg-card hover:border-gold/50 hover:bg-card/80"
              }`}
            >
              <div
                className={`text-sm font-medium ${isSelected ? "text-gold" : "text-foreground"}`}
              >
                {r.label}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 truncate">
                {r.hubs.slice(0, 4).join(" · ")}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CorridorPanel({
  headline,
  strategy,
  bestFor,
  spots,
  fromLabel,
  toLabel,
}: {
  headline: string;
  strategy: string;
  bestFor: string[];
  spots: CorridorSpot[];
  fromLabel: string;
  toLabel: string;
}) {
  // Group spots by cabin so users scan by the cabin they actually want.
  const byCabin = CABIN_ORDER.map((c) => ({
    cabin: c,
    label: CABIN_LABEL[c],
    list: spots.filter((s) => s.cabin === c),
  })).filter((g) => g.list.length > 0);

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-border-soft">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-gold">
              {fromLabel} <span className="opacity-60">↔</span> {toLabel}
            </div>
            <h3 className="font-display text-2xl md:text-3xl mt-2">{headline}</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {bestFor.map((id) => (
              <ProgramChip key={id} programId={id} compact />
            ))}
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground max-w-3xl leading-relaxed">{strategy}</p>
      </div>

      {/* Redemption menu, grouped by cabin */}
      <div className="p-6 md:p-8 space-y-8">
        {byCabin.map((group) => (
          <div key={group.cabin}>
            <div className="flex items-baseline gap-3 mb-4">
              <h4 className="font-display text-lg">{group.label}</h4>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {group.list.length} option{group.list.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.list.map((s, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-5 bg-background/40 border ${
                    s.cabin === "economy" ? "border-gold/40" : "border-border-soft"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <ProgramChip programId={s.programId} />
                    <div className="text-right">
                      <div className="font-mono tabular-nums text-xl">
                        {s.miles.toLocaleString()}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        miles + ~{fmtAud(s.taxesAud ?? 0)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2 text-xs">
                    <span className="text-gold font-medium">{s.metal}</span>
                    <span className="text-muted-foreground/60">·</span>
                    <span className="text-muted-foreground">{s.routing}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.why}</p>
                  {s.source && (
                    <div className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground/60">
                      Source · {s.source}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
