import { createFileRoute } from "@tanstack/react-router";
import { useState, useTransition } from "react";
import heroWing from "@/assets/hero-wing.jpg";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SearchForm } from "@/components/site/SearchForm";
import { AwardCard } from "@/components/site/AwardCard";
import { ProgramRail } from "@/components/site/ProgramRail";
import { ValueProps, Testimonials, FAQ, ConciergeCTA } from "@/components/site/HomeSections";
import { searchAwards } from "@/server/awards/awards.functions";
import type { Cabin, AwardItinerary, SearchResult } from "@/server/awards/types";
import { PROGRAMS } from "@/lib/programs";
import { rankItineraries } from "@/lib/intelligence";

export const Route = createFileRoute("/")({
  component: Index,
});

type Query = { from: string; to: string; date: string; cabin: Cabin; pax: number };

function Index() {
  const [query, setQuery] = useState<Query | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [forceMock, setForceMock] = useState<boolean>(true);
  const totalBalance = PROGRAMS.reduce((s, p) => s + p.balance, 0);

  function runSearch(q: Query) {
    setQuery(q);
    setError(null);
    startTransition(async () => {
      try {
        const res = await searchAwards({ data: { ...q, forceMock } });
        setResult(res);
      } catch (e) {
        setError((e as Error).message || "Search failed");
        setResult(null);
      }
    });
  }

  const itineraries: AwardItinerary[] = result?.itineraries ?? [];
  const ranked = rankItineraries(itineraries);

  return (
    <div className="min-h-screen bg-noir">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroWing} alt="" width={1600} height={1200}
            className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-12 md:pt-32 md:pb-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold mb-6">
              <span className="size-1 rounded-full bg-gold" /> Real-time award availability
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02]">
              Your miles deserve <br />
              <span className="text-gold-gradient">a first-class seat.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Connect Qantas, Velocity, KrisFlyer, Emirates, United and LifeMiles in one vault.
              Search live award space and redeem in seconds — no phone calls, no agent fees.
            </p>
          </div>

          <div className="mt-10 md:mt-14">
            <SearchForm onSearch={runSearch} initial={query ?? undefined} />
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 max-w-3xl rounded-xl border border-border/60 bg-card/40 backdrop-blur px-4 py-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Data source</div>
              <div className="font-display text-sm mt-0.5">
                {forceMock ? "Simulated availability (mock)" : "Live seats.aero"}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!forceMock}
              onClick={() => setForceMock((v) => !v)}
              className={`relative h-7 w-12 rounded-full transition border ${
                forceMock ? "bg-muted border-border" : "bg-gold/80 border-gold"
              }`}
            >
              <span
                className={`absolute top-0.5 size-6 rounded-full bg-background shadow transition-all ${
                  forceMock ? "left-0.5" : "left-[22px]"
                }`}
              />
              <span className="sr-only">Toggle live data</span>
            </button>
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
            <Stat label="Linked programs" value={`${PROGRAMS.length}`} />
            <Stat label="Total miles" value={totalBalance.toLocaleString()} />
            <Stat label="Avg. premium redemption" value="118k mi" />
            <Stat label="Booking time" value="< 60s" />
          </div>
        </div>
      </section>

      <ProgramRail />

      <section className="mx-auto max-w-7xl px-6 py-16">
        {query ? (
          <>
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-display text-3xl">
                  {query.from} <span className="text-gold">→</span> {query.to}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {pending
                    ? "Scanning award space across alliances…"
                    : `${itineraries.length} award itineraries · ${query.cabin} · ${query.pax} pax · ${query.date}`}
                </p>
              </div>
              {result && (
                <div className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <span className={`size-1.5 rounded-full ${result.source === "seats.aero" ? "bg-emerald-400" : "bg-gold"}`} />
                  Source: {result.source}
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive-foreground p-4 text-sm">
                {error}
              </div>
            )}
            {result?.warning && !error && (
              <div className="mb-4 rounded-lg border border-gold/30 bg-gold/5 text-gold p-4 text-xs uppercase tracking-[0.18em]">
                {result.warning}
              </div>
            )}

            {pending ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-xl border border-border bg-card animate-pulse" />
                ))}
              </div>
            ) : itineraries.length === 0 && !error ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
                No award space found for this route and date. Try a different cabin or nearby dates.
              </div>
            ) : (
              <div className="space-y-3">
                {ranked.map((a) => <AwardCard key={a.id} award={a} />)}
              </div>
            )}
          </>
        ) : (
          <Vault />
        )}
      </section>

      {!query && (
        <>
          <ValueProps />
          <Testimonials />
          <FAQ limit={4} />
          <ConciergeCTA />
        </>
      )}

      <Footer />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="font-display text-xl mt-1">{value}</div>
    </div>
  );
}

function Vault() {
  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="font-display text-3xl">Your points vault</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Aggregate balances from every program you've linked.
          </p>
        </div>
        <button className="text-xs uppercase tracking-[0.2em] px-4 py-2 rounded-full hairline text-gold hover:bg-gold/10 transition">
          + Link program
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {PROGRAMS.map((p) => (
          <div key={p.id} className="group rounded-xl border border-border bg-card hover:border-gold/40 transition p-5">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{p.alliance}</div>
                <div className="font-display text-lg mt-1">{p.name}</div>
              </div>
              <span className="size-8 rounded-full grid place-items-center font-display text-xs"
                style={{ background: `${p.accent}22`, color: p.accent, border: `1px solid ${p.accent}55` }}>
                {p.short}
              </span>
            </div>
            <div className="font-display text-3xl text-gold-gradient">
              {p.balance.toLocaleString()}
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
              points available
            </div>
            <div className="mt-5 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400/90">
                <span className="size-1.5 rounded-full bg-emerald-400" /> Connected
              </span>
              <button className="text-xs uppercase tracking-[0.18em] text-gold hover:underline">
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
