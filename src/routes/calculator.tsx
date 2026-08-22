import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calculator as CalcIcon, Plane, Gift } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PROGRAMS, getProgram } from "@/lib/programs";
import { fmtAud } from "@/lib/intelligence";
import { allCorridors, getRegion, type CorridorSpot, type RegionId } from "@/lib/awards/corridors";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Points Value Calculator — What Are Your Points Worth? | Miles Expert" },
      {
        name: "description",
        content:
          "Enter your airline or credit card points balance and see its real AUD value, what a gift voucher would waste, and which flights your points already unlock.",
      },
      { property: "og:title", content: "Points Value Calculator — Miles Expert" },
      {
        property: "og:description",
        content: "See the real AUD value of your points and the flights they already unlock.",
      },
    ],
  }),
  component: CalculatorPage,
});

/** Typical bank-portal / gift-voucher redemption rate, in AUD cents per point. */
const VOUCHER_CPP = 0.5;

type UnlockedSpot = CorridorSpot & { fromRegion: RegionId; toRegion: RegionId };

const CABIN_LABEL: Record<string, string> = {
  economy: "Economy",
  premium: "Premium economy",
  business: "Business",
  first: "First",
};

const CABIN_RANK: Record<string, number> = { first: 4, business: 3, premium: 2, economy: 1 };

const STORAGE_KEY = "mx-calculator";

function CalculatorPage() {
  const [programId, setProgramId] = useState<string>("qantas");
  const [balanceRaw, setBalanceRaw] = useState<string>("100000");

  // Remember the last calculation on this device — no account needed.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (saved?.programId && getProgram(saved.programId)) setProgramId(saved.programId);
      if (typeof saved?.balanceRaw === "string") setBalanceRaw(saved.balanceRaw);
    } catch {
      /* fresh visit */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ programId, balanceRaw }));
    } catch {
      /* storage unavailable */
    }
  }, [programId, balanceRaw]);

  const balance = Math.max(
    0,
    Math.min(50_000_000, parseInt(balanceRaw.replace(/[^\d]/g, ""), 10) || 0),
  );
  const program = getProgram(programId);

  const audValue = program ? (balance * program.valueAudCents) / 100 : 0;
  const voucherValue = (balance * VOUCHER_CPP) / 100;

  const { unlocked, almost } = useMemo(() => {
    const spots: UnlockedSpot[] = [];
    for (const c of allCorridors()) {
      for (const s of c.spots) {
        if (s.programId === programId) spots.push({ ...s, fromRegion: c.from, toRegion: c.to });
      }
    }
    const dedupe = new Map<string, UnlockedSpot>();
    for (const s of spots) {
      const key = `${s.fromRegion}-${s.toRegion}-${s.cabin}`;
      const cur = dedupe.get(key);
      if (!cur || s.miles < cur.miles) dedupe.set(key, s);
    }
    const all = [...dedupe.values()];
    const unlocked = all
      .filter((s) => s.miles <= balance && balance > 0)
      .sort((a, b) => CABIN_RANK[b.cabin] - CABIN_RANK[a.cabin] || b.miles - a.miles)
      .slice(0, 8);
    const almost = all
      .filter((s) => s.miles > balance && s.miles <= balance * 1.35)
      .sort((a, b) => a.miles - b.miles)
      .slice(0, 3);
    return { unlocked, almost };
  }, [programId, balance]);

  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-14">
        <span className="text-xs uppercase tracking-widest text-gold inline-flex items-center gap-1.5">
          <CalcIcon className="size-3.5" aria-hidden="true" /> Free tool
        </span>
        <h1 className="font-display text-4xl md:text-5xl mt-4 max-w-2xl leading-[1.08]">
          What are your points <span className="text-gold-gradient">actually worth?</span>
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Points are money you already earned. Enter a balance to see its real value in AUD — and
          the flights it already unlocks.
        </p>

        {/* ── Inputs ─────────────────────────────────────────────── */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Program</span>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="mt-1.5 w-full rounded-lg bg-card border border-border px-3 py-3 text-sm focus:outline-none focus:border-gold/60"
            >
              {PROGRAMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              Points balance
            </span>
            <input
              inputMode="numeric"
              value={balanceRaw}
              onChange={(e) => setBalanceRaw(e.target.value.replace(/[^\d,]/g, ""))}
              placeholder="e.g. 100,000"
              className="mt-1.5 w-full rounded-lg bg-card border border-border px-3 py-3 text-sm font-mono tabular-nums focus:outline-none focus:border-gold/60"
            />
          </label>
        </div>

        {/* ── Value verdict ──────────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
          <div className="rounded-lg border border-gold/40 bg-gold/5 p-6">
            <div className="text-xs uppercase tracking-widest text-gold inline-flex items-center gap-1.5">
              <Plane className="size-3.5" aria-hidden="true" /> Spent on flights
            </div>
            <div className="mt-3 font-display text-3xl tabular-nums">{fmtAud(audValue)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              at {program?.valueAudCents.toFixed(1)}¢/pt — {program?.name} typical premium-cabin
              redemption
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5">
              <Gift className="size-3.5" aria-hidden="true" /> Spent on gift vouchers
            </div>
            <div className="mt-3 font-display text-3xl tabular-nums text-muted-foreground">
              {fmtAud(voucherValue)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              at ~{VOUCHER_CPP.toFixed(1)}¢/pt — typical bank portal / voucher rate
            </div>
          </div>
        </div>
        {balance > 0 && audValue > voucherValue && (
          <p className="mt-3 text-sm text-gold max-w-2xl">
            Redeeming for flights makes these points worth{" "}
            <span className="font-semibold tabular-nums">
              {(audValue / Math.max(1, voucherValue)).toFixed(1)}×
            </span>{" "}
            more than a voucher.
          </p>
        )}

        {/* ── Unlocked flights ───────────────────────────────────── */}
        <section className="mt-14">
          <div className="flex items-baseline justify-between border-b border-border-soft pb-3">
            <h2 className="font-display text-2xl">Your points already unlock</h2>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              indicative one-way, per seat
            </span>
          </div>
          {unlocked.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground max-w-xl">
              {balance === 0
                ? "Enter a balance above to see what it unlocks."
                : `No ${program?.name} sweet spots inside ${balance.toLocaleString()} points yet — the nearest targets are below.`}
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {unlocked.map((s, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-card/60 p-5 hover:border-border-strong transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-gold">
                      {CABIN_LABEL[s.cabin]}
                    </span>
                    <span className="font-mono tabular-nums text-sm text-foreground">
                      {s.miles.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="font-display text-lg mt-2">
                    {getRegion(s.fromRegion).label} → {getRegion(s.toRegion).label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {s.routing} · {s.metal}
                    {s.taxesAud ? ` · + ~${fmtAud(s.taxesAud)} taxes` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}

          {almost.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
                Almost in reach
              </h3>
              <div className="mt-3 space-y-2">
                {almost.map((s, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm border-b border-border-soft pb-2"
                  >
                    <span className="text-foreground">
                      {getRegion(s.fromRegion).label} → {getRegion(s.toRegion).label}
                    </span>
                    <span className="text-muted-foreground text-xs">{CABIN_LABEL[s.cabin]}</span>
                    <span className="ml-auto font-mono tabular-nums text-xs text-gold">
                      {(s.miles - balance).toLocaleString()} more pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <div className="mt-14 rounded-lg border border-gold/30 bg-gold/5 p-8 text-center">
          <div className="font-display text-2xl">Ready to spend them well?</div>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Search live award space and get a step-by-step redemption guide for any seat you find.
          </p>
          <Link
            to="/"
            className="inline-block mt-5 text-xs uppercase tracking-widest px-6 py-3 rounded-full bg-gold text-gold-foreground hover:bg-gold-soft transition shadow-gold"
          >
            Search award flights
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
