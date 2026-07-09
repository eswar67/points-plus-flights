import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
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
import { ValueProps, FAQ, HowItWorksStrip } from "@/components/site/HomeSections";
import { searchAwards } from "@/lib/awards/awards.functions";
import type { AwardItinerary, Cabin, SearchResult } from "@/lib/awards/types";
import { PROGRAMS, getProgram } from "@/lib/programs";
import {
  rankItineraries,
  fmtAud,
  effectiveBalances,
  knownRoutes,
  fareEstimateAud,
  type RankedItinerary,
  annotateSweetSpots,
  type SweetSpotInfo,
} from "@/lib/intelligence";
import { useUserBalances } from "@/hooks/useUserBalances";
import { useAuth } from "@/hooks/useAuth";

const CABIN_VALUES = ["economy", "premium", "business", "first"] as const;

export const Route = createFileRoute("/")({
  // Pre-filled searches arrive from the /awards landing pages.
  validateSearch: (s: Record<string, unknown>) => ({
    from:
      typeof s.from === "string" && /^[A-Za-z]{3}$/.test(s.from) ? s.from.toUpperCase() : undefined,
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
  if (q.mode === "flex1") {
    const start = addDays(q.date, -1);
    return { date: start < today ? today : start, dateTo: addDays(q.date, 1) };
  }
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
  const [sortBy, setSortBy] = useState<
    | "value"
    | "points"
    | "taxes"
    | "seats"
    | "duration"
    | "stops"
    | "depart"
    | "fresh"
    | "sweet"
  >("points");
  const [programFilter, setProgramFilter] = useState<Set<string> | null>(null);
  const [carrierFilter, setCarrierFilter] = useState<Set<string> | null>(null);
  const [gradeFilter, setGradeFilter] = useState<Set<string> | null>(null);
  const [nonstopOnly, setNonstopOnly] = useState(false);
  const [twoPlusSeats, setTwoPlusSeats] = useState(false);
  const [bookableOnly, setBookableOnly] = useState(false);
  const [sweetOnly, setSweetOnly] = useState(false);

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
    setSortBy("points");
    setProgramFilter(null);
    setCarrierFilter(null);
    setGradeFilter(null);
    setNonstopOnly(false);
    setTwoPlusSeats(false);
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

  // Carrier (operating airline) facets
  const carrierFacets = new Map<string, { count: number }>();
  for (const a of ranked) {
    const key = (a.carrier || "").trim();
    if (!key) continue;
    const cur = carrierFacets.get(key) ?? { count: 0 };
    cur.count += 1;
    carrierFacets.set(key, cur);
  }

  const filtered = ranked.filter(
    (a) =>
      (!nonstopOnly || a.direct || a.stops === 0) &&
      (!twoPlusSeats || a.seats >= 2) &&
      (!gradeFilter || gradeFilter.size === 0 || gradeFilter.has(a.grade)) &&
      (!programFilter || programFilter.size === 0 || programFilter.has(a.programId)) &&
      (!carrierFilter || carrierFilter.size === 0 || carrierFilter.has((a.carrier || "").trim())),
  );
  const sorted =
    sortBy === "points"
      ? [...filtered].sort((a, b) => a.miles - b.miles)
      : sortBy === "taxes"
        ? [...filtered].sort((a, b) => a.taxesUsd - b.taxesUsd || a.miles - b.miles)
        : sortBy === "seats"
          ? [...filtered].sort((a, b) => b.seats - a.seats || b.cpp - a.cpp)
          : sortBy === "duration"
            ? [...filtered].sort(
                (a, b) =>
                  (a.durationMin || Number.POSITIVE_INFINITY) -
                    (b.durationMin || Number.POSITIVE_INFINITY) || a.miles - b.miles,
              )
            : sortBy === "stops"
              ? [...filtered].sort(
                  (a, b) => a.stops - b.stops || a.miles - b.miles,
                )
              : sortBy === "depart"
                ? [...filtered].sort((a, b) => (a.depart < b.depart ? -1 : a.depart > b.depart ? 1 : 0))
                : sortBy === "fresh"
                  ? [...filtered].sort((a, b) => {
                      const ta = a.updatedAt ? Date.parse(a.updatedAt) : 0;
                      const tb = b.updatedAt ? Date.parse(b.updatedAt) : 0;
                      return tb - ta;
                    })
                  : filtered; // "value" keeps the CPP-first ranking

  function toggleGrade(g: string) {
    setGradeFilter((cur) => {
      const next = new Set(cur ?? []);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next.size === 0 ? null : next;
    });
  }

  const minMiles = filtered.length ? Math.min(...filtered.map((a) => a.miles)) : 0;

  function toggleProgram(pid: string) {
    setProgramFilter((cur) => {
      const next = new Set(cur ?? []);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next.size === 0 ? null : next;
    });
  }

  function toggleCarrier(c: string) {
    setCarrierFilter((cur) => {
      const next = new Set(cur ?? []);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next.size === 0 ? null : next;
    });
  }

  // Leader values across the currently sorted set (used to explain each card)
  const leader = {
    miles: sorted.length ? Math.min(...sorted.map((a) => a.miles)) : 0,
    taxes: sorted.length ? Math.min(...sorted.map((a) => a.taxesUsd)) : 0,
    seats: sorted.length ? Math.max(...sorted.map((a) => a.seats)) : 0,
    duration: sorted.length
      ? Math.min(...sorted.map((a) => a.durationMin || Number.POSITIVE_INFINITY))
      : 0,
    stops: sorted.length ? Math.min(...sorted.map((a) => a.stops)) : 0,
    cpp: sorted.length ? Math.max(...sorted.map((a) => a.cpp)) : 0,
  };
  function fmtHrs(min: number) {
    if (!min) return "—";
    return `${Math.floor(min / 60)}h ${min % 60}m`;
  }
  function reasonFor(a: RankedItinerary): string | undefined {
    switch (sortBy) {
      case "points": {
        if (a.miles === leader.miles) return `Cheapest here — ${a.miles.toLocaleString()} pts`;
        const diff = a.miles - leader.miles;
        return `+${diff.toLocaleString()} pts vs cheapest (${leader.miles.toLocaleString()})`;
      }
      case "taxes": {
        if (a.taxesUsd === leader.taxes) return `Lowest taxes here — US$${Math.round(a.taxesUsd)}`;
        return `US$${Math.round(a.taxesUsd - leader.taxes)} more taxes than lowest`;
      }
      case "seats": {
        if (a.seats === leader.seats) return `Most seats here — ${a.seats} available`;
        return `${a.seats} seat${a.seats === 1 ? "" : "s"} · ${leader.seats} available on the top pick`;
      }
      case "duration": {
        if (!a.durationMin) return "Duration not published";
        if (a.durationMin === leader.duration) return `Fastest here — ${fmtHrs(a.durationMin)}`;
        const diff = a.durationMin - leader.duration;
        return `${fmtHrs(diff)} longer than the fastest (${fmtHrs(leader.duration)})`;
      }
      case "stops": {
        if (a.stops === 0 || a.direct) return "Nonstop";
        return `${a.stops} stop${a.stops === 1 ? "" : "s"} · nonstop options above if any`;
      }
      case "depart": {
        const t = (a.depart || "").slice(11, 16);
        return t ? `Departs ${t}` : "Earliest departure on this date";
      }
      case "fresh": {
        if (!a.updatedAt) return "Freshness unknown";
        const ageMin = Math.max(0, Math.round((Date.now() - Date.parse(a.updatedAt)) / 60000));
        if (ageMin < 60) return `Verified ${ageMin}m ago`;
        if (ageMin < 60 * 24) return `Verified ${Math.round(ageMin / 60)}h ago`;
        return `Verified ${Math.round(ageMin / 1440)}d ago`;
      }
      case "value":
      default: {
        if (a.cpp === leader.cpp) return `Best value — ${a.cpp.toFixed(2)}¢ / pt`;
        return `${a.cpp.toFixed(2)}¢ / pt · top pick ${leader.cpp.toFixed(2)}¢`;
      }
    }
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
          <img
            src={heroWing}
            alt=""
            width={1600}
            height={1200}
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
          <FlightScene />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pt-10 pb-10 md:pt-16 md:pb-14">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
              Your miles deserve <span className="text-gold-shimmer">a first-class seat.</span>
            </h1>
            <p className="mt-3 text-base text-muted-foreground max-w-xl">
              Search award space across Qantas, Velocity, KrisFlyer, Flying Blue and 20+ programs —
              ranked by real cents-per-point value.
            </p>
          </div>

          <div className="mt-6 md:mt-8">
            <SearchForm onSearch={runSearch} initial={query ?? undefined} />
          </div>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
            <Stat label="Programs supported" value={`${PROGRAMS.length}`} />
            <Stat
              label="Your total points"
              value={totalBalance ? totalBalance.toLocaleString() : "—"}
            />
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
                          ? new Date(monthStart + "T00:00:00").toLocaleDateString([], {
                              month: "long",
                              year: "numeric",
                            })
                          : query.mode === "flex"
                            ? `${query.date} ± 3 days`
                            : query.mode === "flex1"
                              ? `${query.date} ± 1 day`
                              : query.date,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {result && (
                  <div className="hidden md:flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-live" />
                    Live · {result.source}
                  </div>
                )}
                {!pending && ranked.length > 0 && (
                  <Link
                    to="/watchlists"
                    search={{
                      from: query.from,
                      to: query.to,
                      dateFrom: rangeFor(query).date,
                      dateTo: rangeFor(query).dateTo ?? rangeFor(query).date,
                      cabin: query.cabin,
                      pax: query.pax,
                    }}
                    className="btn btn-ghost whitespace-nowrap"
                  >
                    <Bell className="size-3.5" /> Watch this route
                  </Link>
                )}
              </div>
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
                  {(
                    [
                      ["value", "Best value"],
                      ["points", "Fewest points"],
                      ["taxes", "Lowest taxes"],
                      ["seats", "Most seats"],
                      ["duration", "Shortest"],
                      ["stops", "Fewest stops"],
                      ["depart", "Earliest depart"],
                      ["fresh", "Freshest data"],
                    ] as const
                  ).map(([key, label]) => (
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
                  ))}
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
                    Nonstop
                  </button>
                  <button
                    type="button"
                    aria-pressed={twoPlusSeats}
                    onClick={() => setTwoPlusSeats((v) => !v)}
                    className={`text-xs uppercase tracking-widest px-3.5 py-2.5 min-h-11 rounded-full border transition ${
                      twoPlusSeats
                        ? "bg-gold/15 text-gold border-gold/50"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-border-strong"
                    }`}
                  >
                    2+ seats
                  </button>
                </div>
                <div
                  className="flex flex-wrap items-center gap-2"
                  role="group"
                  aria-label="Filter by value grade"
                >
                  <span className="text-xs text-muted-foreground mr-1">Grade</span>
                  {(["exceptional", "great", "fair", "skip"] as const).map((g) => {
                    const active = gradeFilter?.has(g) ?? false;
                    return (
                      <button
                        key={g}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleGrade(g)}
                        className={`text-xs uppercase tracking-widest px-3.5 py-2.5 min-h-11 rounded-full border transition ${
                          active
                            ? "bg-gold/15 text-gold border-gold/50"
                            : "border-border text-muted-foreground hover:text-foreground hover:border-border-strong"
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
                {programFacets.size > 1 && (
                  <div
                    className="flex gap-2 overflow-x-auto pb-1"
                    role="group"
                    aria-label="Filter by program"
                  >
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
                            <span
                              className="size-1.5 rounded-full"
                              style={{ background: f.accent }}
                            />
                            {f.name}
                            <span className="opacity-60">{f.count}</span>
                          </button>
                        );
                      })}
                  </div>
                )}
                {carrierFacets.size > 1 && (
                  <div
                    className="flex gap-2 overflow-x-auto pb-1"
                    role="group"
                    aria-label="Filter by airline"
                  >
                    <span className="text-xs text-muted-foreground mr-1 self-center shrink-0">
                      Airline
                    </span>
                    {[...carrierFacets.entries()]
                      .sort((a, b) => b[1].count - a[1].count)
                      .map(([carrier, f]) => {
                        const active = carrierFilter?.has(carrier) ?? false;
                        return (
                          <button
                            key={carrier}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggleCarrier(carrier)}
                            className={`shrink-0 inline-flex items-center gap-2 text-xs px-3.5 py-2.5 min-h-11 rounded-full border transition whitespace-nowrap tabular-nums ${
                              active
                                ? "bg-gold/15 text-gold border-gold/50"
                                : "border-border text-muted-foreground hover:text-foreground hover:border-border-strong"
                            }`}
                          >
                            {carrier}
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
                onMonthChange={(delta) =>
                  runSearch({ ...query, date: addMonths(monthStart, delta), mode: "month" })
                }
                canPrev={monthStart > currentMonthStart}
                canNext={monthStart < addMonths(currentMonthStart, 11)}
              />
            ) : itineraries.length === 0 && !error ? (
              <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
                No award space found for this route and date. Try a different cabin or nearby dates.
              </div>
            ) : sorted.length === 0 && !error ? (
              <div className="rounded-lg border border-border bg-card p-10 text-center">
                <p className="text-muted-foreground">No results match your filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setProgramFilter(null);
                    setGradeFilter(null);
                    setNonstopOnly(false);
                    setTwoPlusSeats(false);
                  }}
                  className="mt-4 btn btn-ghost"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                {multiDate && (
                  <div
                    className="mb-6 flex gap-2 overflow-x-auto pb-1"
                    role="tablist"
                    aria-label="Departure dates"
                  >
                    <DateChip
                      active={!selectedDate}
                      onClick={() => setSelectedDate(null)}
                      label="All dates"
                    />
                    {dates.map((d) => {
                      const s = daySummaries[d];
                      const label = new Date(d + "T00:00:00").toLocaleDateString([], {
                        weekday: "short",
                        day: "numeric",
                      });
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
                          {new Date(d + "T00:00:00").toLocaleDateString([], {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </h3>
                      )}
                      <div className="space-y-3">
                        {(byDate.get(d) ?? []).map((a, i) => (
                          <div
                            key={a.id}
                            className="animate-card-in"
                            style={{ "--stagger": Math.min(i, 8) } as React.CSSProperties}
                          >
                            <AwardCard award={a} balances={byProgramId} reason={reasonFor(a)} />
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
          <FAQ limit={4} />
        </>
      )}

      <Footer />
    </div>
  );
}

function DateChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
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
    <div className="rounded-lg border border-border-soft bg-card/40 backdrop-blur px-4 py-3">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-2xl mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function Portfolio({ balances }: { balances: ReturnType<typeof useUserBalances>["balances"] }) {
  const { user, loading: authLoading } = useAuth();

  const totalPoints = useCountUp(balances.reduce((s, b) => s + b.balance, 0));

  // Curated routes where any program's indicative business award is within
  // reach of the member's direct + transferable balance.
  const byId: Record<string, number> = {};
  for (const b of balances) byId[b.program_id] = b.balance;
  const reach = effectiveBalances(byId);
  const airlinePrograms = PROGRAMS.filter((p) => p.alliance !== "Transferable");
  const allRoutes = knownRoutes();
  const routesInReach = allRoutes.filter(({ from, to }) =>
    airlinePrograms.some((p) => {
      const total = reach[p.id]?.total ?? 0;
      if (!total) return false;
      const miles =
        Math.round((fareEstimateAud(from, to, "business") * 100) / p.valueAudCents / 1000) * 1000;
      return total >= miles;
    }),
  ).length;
  const totalValueAud = useCountUp(
    balances.reduce((s, b) => {
      const p = getProgram(b.program_id);
      return s + (p ? (b.balance * p.valueAudCents) / 100 : 0);
    }, 0),
  );

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="rounded-lg border border-gold/30 bg-gradient-to-br from-gold/10 via-card to-background p-10 md:p-14 text-center">
        <span className="text-xs uppercase tracking-widest text-gold">Your points portfolio</span>
        <h2 className="font-display text-3xl md:text-4xl mt-3">
          Track every program in <span className="text-gold-gradient">one place</span>.
        </h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Sign in and add the loyalty programs you hold. We'll rank premium-cabin awards by what you
          can actually book with the points you have.
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
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <h3 className="font-display text-xl">No balances yet.</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Add the loyalty programs you hold and we'll show you how much your stash is worth — and
            which premium redemptions are within reach.
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
          <div className="rounded-lg border border-gold/30 bg-gradient-to-br from-gold/10 via-card to-background p-8 md:p-10 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Total points held
                </div>
                <div className="font-display text-4xl mt-2">{totalPoints.toLocaleString()}</div>
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
                <div className="font-display text-4xl mt-2 tabular-nums">{balances.length}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Routes in reach
                </div>
                <div className="font-display text-4xl mt-2 tabular-nums">
                  {routesInReach}
                  <span className="text-lg text-muted-foreground">/{allRoutes.length}</span>
                </div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                  business, incl. transfers
                </div>
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
                  className="group rounded-lg border border-border bg-card hover:border-border-strong transition p-5"
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
