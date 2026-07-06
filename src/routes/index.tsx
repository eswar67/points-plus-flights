import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useTransition } from "react";
import heroWing from "@/assets/hero-wing.jpg";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SearchForm, type SearchFormQuery } from "@/components/site/SearchForm";
import { AwardCard } from "@/components/site/AwardCard";
import { MonthHeatmap, type DaySummary } from "@/components/site/MonthHeatmap";
import { FlightScene } from "@/components/site/FlightScene";
import { SearchingState } from "@/components/site/SearchingState";
import { useCountUp } from "@/hooks/useCountUp";
import { ProgramRail } from "@/components/site/ProgramRail";
import { ValueProps, Testimonials, FAQ, ConciergeCTA, HowItWorksStrip } from "@/components/site/HomeSections";
import { searchAwards } from "@/lib/awards/awards.functions";
import type { AwardItinerary, Cabin, SearchResult } from "@/lib/awards/types";
import { PROGRAMS, getProgram } from "@/lib/programs";
import { rankItineraries, fmtAud, type RankedItinerary } from "@/lib/intelligence";
import { useUserBalances } from "@/hooks/useUserBalances";
import { useAuth } from "@/hooks/useAuth";

const CABIN_VALUES = ["economy", "premium", "business", "first"] as const;

export const Route = createFileRoute("/")({
  // Pre-filled searches arrive from the /awards landing pages.
  validateSearch: (s: Record<string, unknown>) => ({
    from: typeof s.from === "string" && /^[A-Za-z]{3}$/.test(s.from) ? s.from.toUpperCase() : undefined,
    to: typeof s.to === "string" && /^[A-Za-z]{3}$/.test(s.to) ? s.to.toUpperCase() : undefined,
    cabin: CABIN_VALUES.includes(s.cabin as Cabin) ? (s.cabin as Cabin) : undefined,
  }),
  component: Index,
});

type Query = SearchFormQuery;

// --- Date helpers (UTC-safe on YYYY-MM-DD strings) --------------------------
function addDays(d: string, n: number): string {
  const t = new Date(d + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

function endOfMonth(d: string): string {
  const t = new Date(d.slice(0, 8) + "01T00:00:00Z");
  t.setUTCMonth(t.getUTCMonth() + 1);
  t.setUTCDate(0);
  return t.toISOString().slice(0, 10);
}

function addMonths(monthStart: string, n: number): string {
  const t = new Date(monthStart + "T00:00:00Z");
  t.setUTCMonth(t.getUTCMonth() + n);
  return t.toISOString().slice(0, 10);
}

/** Expand a query's mode into the provider date range. */
function rangeFor(q: Query): { date: string; dateTo?: string } {
  const today = new Date().toISOString().slice(0, 10);
  if (q.mode === "flex") {
    const start = addDays(q.date, -3);
    return { date: start < today ? today : start, dateTo: addDays(q.date, 3) };
  }
  if (q.mode === "month") {
    const first = q.date.slice(0, 8) + "01";
    return { date: first < today ? today : first, dateTo: endOfMonth(q.date) };
  }
  return { date: q.date };
}

function Index() {
  const [query, setQuery] = useState<Query | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { balances, byProgramId } = useUserBalances();
  const totalBalance = useCountUp(balances.reduce((s, b) => s + b.balance, 0));

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Results toolbar (point.me-grade result controls)
  const [sortBy, setSortBy] = useState<"value" | "points" | "seats">("value");
  const [programFilter, setProgramFilter] = useState<Set<string> | null>(null);
  const [nonstopOnly, setNonstopOnly] = useState(false);

  // Auto-run a search when arriving from an /awards landing page.
  const urlSearch = Route.useSearch();
  useEffect(() => {
    if (urlSearch.from && urlSearch.to) {
      runSearch({
        from: urlSearch.from,
        to: urlSearch.to,
        date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        cabin: urlSearch.cabin ?? "business",
        pax: 1,
        mode: "flex",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runSearch(q: Query) {
    setQuery(q);
    setError(null);
    setSelectedDate(null);
    setSortBy("value");
    setProgramFilter(null);
    setNonstopOnly(false);
    startTransition(async () => {
      try {
        const range = rangeFor(q);
        const res = await searchAwards({
          data: { from: q.from, to: q.to, ...range, cabin: q.cabin, pax: q.pax },
        });
        setResult(res);
      } catch (e) {
        setError((e as Error).message || "Search failed");
        setResult(null);
      }
    });
  }

  const itineraries: AwardItinerary[] = result?.itineraries ?? [];
  const ranked = rankItineraries(itineraries, byProgramId);

  // Program facets (from unfiltered results, so counts stay stable)
  const programFacets = new Map<string, { name: string; accent: string; count: number }>();
  for (const a of ranked) {
    const p = getProgram(a.programId);
    const cur = programFacets.get(a.programId) ?? {
      name: p?.name ?? a.programName,
      accent: p?.accent ?? "#c9a84c",
      count: 0,
    };
    cur.count += 1;
    programFacets.set(a.programId, cur);
  }

  const filtered = ranked.filter(
    (a) =>
      (!nonstopOnly || a.direct || a.stops === 0) &&
      (!programFilter || programFilter.size === 0 || programFilter.has(a.programId)),
  );
  const sorted =
    sortBy === "points"
      ? [...filtered].sort((a, b) => a.miles - b.miles)
      : sortBy === "seats"
        ? [...filtered].sort((a, b) => b.seats - a.seats || b.cpp - a.cpp)
        : filtered; // "value" keeps the CPP-first ranking

  const minMiles = filtered.length ? Math.min(...filtered.map((a) => a.miles)) : 0;

  function toggleProgram(pid: string) {
    setProgramFilter((cur) => {
      const next = new Set(cur ?? []);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next.size === 0 ? null : next;
    });
  }

  // Group by departure date (each group's first entry is its best by the
  // active sort).
  const byDate = new Map<string, RankedItinerary[]>();
  for (const a of sorted) {
    const d = (a.depart || "").slice(0, 10);
    const list = byDate.get(d) ?? [];
    list.push(a);
    byDate.set(d, list);
  }
  const dates = [...byDate.keys()].sort();
  const multiDate = dates.length > 1;

  const daySummaries: Record<string, DaySummary> = {};
  for (const [d, list] of byDate) {
    daySummaries[d] = { cpp: list[0].cpp, grade: list[0].grade, count: list.length };
  }

  const monthStart = query ? query.date.slice(0, 8) + "01" : "";
  const currentMonthStart = new Date().toISOString().slice(0, 8) + "01";

  const visibleDates = selectedDate ? dates.filter((d) => d === selectedDate) : dates;

  return (
    <div className="min-h-screen bg-noir">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroWing} alt="" width={1600} height={1200}
            className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
          {/* Ambient gold glow */}
          <div className="absolute -top-24 right-[8%] size-96 rounded-full bg-gold/[0.05] blur-3xl animate-float-slow" aria-hidden="true" />
          <div className="absolute top-1/2 -left-24 size-72 rounded-full bg-gold/[0.03] blur-3xl animate-float-slow [animation-delay:-4.5s]" aria-hidden="true" />
          <FlightScene />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-12 md:pt-32 md:pb-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-6">
              <span className="size-1 rounded-full bg-gold" /> Award space, continuously refreshed
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02]">
              Your miles deserve <br />
              <span className="text-gold-shimmer">a first-class seat.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Track Qantas, Velocity, KrisFlyer, Flying Blue and 20+ programs in one vault.
              Search cached award space across every alliance — updated continuously — then
              follow a step-by-step redemption playbook. No phone calls, no agent fees.
            </p>
          </div>

          <div className="mt-10 md:mt-14">
            <SearchForm onSearch={runSearch} initial={query ?? undefined} />
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
            <Stat label="Programs supported" value={`${PROGRAMS.length}`} />
            <Stat label="Your total points" value={totalBalance ? totalBalance.toLocaleString() : "—"} />
            <Stat label="Avg. premium redemption" value="118k mi" />
            <Stat label="Availability checks" value="24/7" />
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
                <p className="text-sm text-muted-foreground mt-1 tabular-nums">
                  {pending
                    ? "Scanning award space across alliances…"
                    : [
                        `${sorted.length} option${sorted.length === 1 ? "" : "s"}`,
                        minMiles ? `from ${minMiles.toLocaleString()} pts` : null,
                        `${programFacets.size} program${programFacets.size === 1 ? "" : "s"}`,
                        `${query.cabin} · ${query.pax} pax`,
                        query.mode === "month"
                          ? new Date(monthStart + "T00:00:00").toLocaleDateString([], { month: "long", year: "numeric" })
                          : query.mode === "flex"
                            ? `${query.date} ± 3 days`
                            : query.date,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                </p>
              </div>
              {result && (
                <div className="hidden md:flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
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
              <div className="mb-4 rounded-lg border border-gold/30 bg-gold/5 text-gold p-4 text-xs uppercase tracking-widest">
                {result.warning}
              </div>
            )}

            {/* Results toolbar: sort, stops, program facets */}
            {!pending && !error && query.mode !== "month" && ranked.length > 0 && (
              <div className="mb-6 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground mr-1">Sort</span>
                  {([["value", "Best value"], ["points", "Fewest points"], ["seats", "Most seats"]] as const).map(
                    ([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={sortBy === key}
                        onClick={() => setSortBy(key)}
                        className={`text-xs uppercase tracking-widest px-3.5 py-2.5 min-h-11 rounded-full border transition ${
                          sortBy === key
                            ? "bg-gold/15 text-gold border-gold/50"
                            : "border-border text-muted-foreground hover:text-foreground hover:border-border-strong"
                        }`}
                      >
                        {label}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    aria-pressed={nonstopOnly}
                    onClick={() => setNonstopOnly((v) => !v)}
                    className={`ml-auto text-xs uppercase tracking-widest px-3.5 py-2.5 min-h-11 rounded-full border transition ${
                      nonstopOnly
                        ? "bg-gold/15 text-gold border-gold/50"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-border-strong"
                    }`}
                  >
                    Nonstop only
                  </button>
                </div>
                {programFacets.size > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by program">
                    {[...programFacets.entries()]
                      .sort((a, b) => b[1].count - a[1].count)
                      .map(([pid, f]) => {
                        const active = programFilter?.has(pid) ?? false;
                        return (
                          <button
                            key={pid}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggleProgram(pid)}
                            className={`shrink-0 inline-flex items-center gap-2 text-xs px-3.5 py-2.5 min-h-11 rounded-full border transition whitespace-nowrap tabular-nums ${
                              active
                                ? "bg-gold/15 text-gold border-gold/50"
                                : "border-border text-muted-foreground hover:text-foreground hover:border-border-strong"
                            }`}
                          >
                            <span className="size-1.5 rounded-full" style={{ background: f.accent }} />
                            {f.name}
                            <span className="opacity-60">{f.count}</span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {pending ? (
              <SearchingState from={query.from} to={query.to} />
            ) : query.mode === "month" ? (
              <MonthHeatmap
                monthStart={monthStart}
                days={daySummaries}
                onPickDate={(d) => runSearch({ ...query, date: d, mode: "exact" })}
                onMonthChange={(delta) => runSearch({ ...query, date: addMonths(monthStart, delta), mode: "month" })}
                canPrev={monthStart > currentMonthStart}
                canNext={monthStart < addMonths(currentMonthStart, 11)}
              />
            ) : itineraries.length === 0 && !error ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
                No award space found for this route and date. Try a different cabin or nearby dates.
              </div>
            ) : sorted.length === 0 && !error ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center">
                <p className="text-muted-foreground">No results match your filters.</p>
                <button
                  type="button"
                  onClick={() => { setProgramFilter(null); setNonstopOnly(false); }}
                  className="mt-4 btn btn-ghost"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                {multiDate && (
                  <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Departure dates">
                    <DateChip active={!selectedDate} onClick={() => setSelectedDate(null)} label="All dates" />
                    {dates.map((d) => {
                      const s = daySummaries[d];
                      const label = new Date(d + "T00:00:00").toLocaleDateString([], { weekday: "short", day: "numeric" });
                      return (
                        <DateChip
                          key={d}
                          active={selectedDate === d}
                          onClick={() => setSelectedDate(d)}
                          label={`${label} · ${s.cpp.toFixed(1)}¢`}
                        />
                      );
                    })}
                  </div>
                )}
                <div className="space-y-8">
                  {visibleDates.map((d) => (
                    <div key={d}>
                      {multiDate && !selectedDate && (
                        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                          {new Date(d + "T00:00:00").toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}
                        </h3>
                      )}
                      <div className="space-y-3">
                        {(byDate.get(d) ?? []).map((a, i) => (
                          <div
                            key={a.id}
                            className="animate-card-in"
                            style={{ "--stagger": Math.min(i, 8) } as React.CSSProperties}
                          >
                            <AwardCard award={a} balances={byProgramId} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <Portfolio balances={balances} />
        )}
      </section>

      {!query && (
        <>
          <HowItWorksStrip />
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

function DateChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`shrink-0 text-xs uppercase tracking-widest px-3.5 py-2.5 min-h-11 rounded-full border transition whitespace-nowrap tabular-nums ${
        active
          ? "bg-gold/15 text-gold border-gold/50"
          : "border-border text-muted-foreground hover:text-foreground hover:border-border-strong"
      }`}
    >
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-soft bg-card/40 backdrop-blur px-4 py-3">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-2xl mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function Portfolio({ balances }: { balances: ReturnType<typeof useUserBalances>["balances"] }) {
  const { user, loading: authLoading } = useAuth();

  const totalPoints = useCountUp(balances.reduce((s, b) => s + b.balance, 0));
  const totalValueAud = useCountUp(
    balances.reduce((s, b) => {
      const p = getProgram(b.program_id);
      return s + (p ? (b.balance * p.valueAudCents) / 100 : 0);
    }, 0),
  );

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 via-card to-background p-10 md:p-14 text-center">
        <span className="text-xs uppercase tracking-widest text-gold">Your points portfolio</span>
        <h2 className="font-display text-3xl md:text-4xl mt-3">
          Track every program in <span className="text-gold-gradient">one place</span>.
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Sign in and add the loyalty programs you hold. We'll rank premium-cabin awards
          by what you can actually book with the points you have.
        </p>
        <Link
          to="/auth"
          className="inline-block mt-7 text-xs uppercase tracking-widest px-6 py-3 rounded-full bg-gold text-gold-foreground hover:opacity-90 transition"
        >
          Sign in to start
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-gold">Your portfolio</span>
          <h2 className="font-display text-3xl mt-2">Your points, valued in AUD.</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add or update balances on the Account page — values are benchmark estimates per
            premium-cabin redemption.
          </p>
        </div>
        <Link
          to="/account"
          className="text-xs uppercase tracking-widest px-4 py-2 rounded-full hairline text-gold hover:bg-gold/10 transition"
        >
          + Add / edit balances
        </Link>
      </div>

      {balances.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <h3 className="font-display text-xl">No balances yet.</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Add the loyalty programs you hold and we'll show you how much your stash is worth —
            and which premium redemptions are within reach.
          </p>
          <Link
            to="/account"
            className="inline-block mt-5 text-xs uppercase tracking-widest px-5 py-2.5 rounded-full bg-gold text-gold-foreground hover:opacity-90 transition"
          >
            Add your first program
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 via-card to-background p-8 md:p-10 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Total points held
                </div>
                <div className="font-display text-4xl mt-2">
                  {totalPoints.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Estimated value
                </div>
                <div className="font-display text-4xl mt-2 text-gold-gradient">
                  {fmtAud(totalValueAud)}
                </div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                  at premium-cabin rates
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Programs tracked
                </div>
                <div className="font-display text-4xl mt-2">{balances.length}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {balances.map((b) => {
              const p = getProgram(b.program_id);
              const accent = p?.accent ?? "#c9a84c";
              return (
                <div
                  key={b.id}
                  className="group rounded-xl border border-border bg-card hover:border-border-strong transition p-5"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">
                        {p?.alliance ?? "Loyalty program"}
                      </div>
                      <div className="font-display text-lg mt-1">{b.program_name}</div>
                    </div>
                    <span
                      className="size-8 rounded-full grid place-items-center font-display text-xs"
                      style={{
                        background: `${accent}22`,
                        color: accent,
                        border: `1px solid ${accent}55`,
                      }}
                    >
                      {p?.short ?? "•"}
                    </span>
                  </div>
                  <div className="font-display text-3xl text-gold-gradient">
                    {b.balance.toLocaleString()}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                    points{p ? ` · ≈ ${fmtAud((b.balance * p.valueAudCents) / 100)}` : ""}
                  </div>
                  <div className="mt-5 flex items-center justify-end">
                    <Link
                      to="/account"
                      className="text-xs uppercase tracking-widest text-gold hover:underline"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
