import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import heroWing from "@/assets/hero-wing.jpg";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SearchForm } from "@/components/site/SearchForm";
import { AwardCard } from "@/components/site/AwardCard";
import { ProgramRail } from "@/components/site/ProgramRail";
import { searchAwards, type Cabin, type Award } from "@/lib/awards";
import { PROGRAMS } from "@/lib/programs";

export const Route = createFileRoute("/")({
  component: Index,
});

type Query = { from: string; to: string; date: string; cabin: Cabin; pax: number };

function Index() {
  const [query, setQuery] = useState<Query | null>(null);
  const results: Award[] = useMemo(() => (query ? searchAwards(query) : []), [query]);
  const totalBalance = PROGRAMS.reduce((s, p) => s + p.balance, 0);

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
            <SearchForm onSearch={setQuery} initial={query ?? undefined} />
          </div>

          {/* Balance preview */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
            <Stat label="Linked programs" value={`${PROGRAMS.length}`} />
            <Stat label="Total miles" value={totalBalance.toLocaleString()} />
            <Stat label="Avg. premium redemption" value="118k mi" />
            <Stat label="Booking time" value="< 60s" />
          </div>
        </div>
      </section>

      <ProgramRail />

      {/* RESULTS / MOMENT */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        {query ? (
          <>
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-display text-3xl">
                  {query.from} <span className="text-gold">→</span> {query.to}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {results.length} award itineraries · {query.cabin} · {query.pax} pax · {query.date}
                </p>
              </div>
              <div className="hidden md:block text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Sorted by miles cost
              </div>
            </div>
            <div className="space-y-3">
              {results.map((a) => <AwardCard key={a.id} award={a} />)}
            </div>
          </>
        ) : (
          <Vault />
        )}
      </section>

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
