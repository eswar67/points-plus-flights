import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PROGRAMS } from "@/lib/programs";
import { fareEstimateAud, fmtAud, knownRoutes, isKnownAirport } from "@/lib/intelligence";
import { sweetSpotsFor } from "@/lib/awards/sweetSpots";
import type { Cabin } from "@/lib/awards/types";

const CABINS: { value: Cabin; label: string }[] = [
  { value: "economy", label: "Economy" },
  { value: "premium", label: "Premium economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

function parseRoute(param: string): { from: string; to: string } | null {
  const m = /^([a-z]{3})-([a-z]{3})$/i.exec(param);
  if (!m) return null;
  const from = m[1].toUpperCase();
  const to = m[2].toUpperCase();
  if (from === to) return null;
  if (!isKnownAirport(from) || !isKnownAirport(to)) return null;
  return { from, to };
}

export const Route = createFileRoute("/awards/$route")({
  beforeLoad: ({ params }) => {
    // Canonicalize URL casing: /awards/syd-nrt → /awards/SYD-NRT
    if (params.route && params.route !== params.route.toUpperCase()) {
      const canonical = params.route.toUpperCase();
      // Only redirect when the canonical form is a valid, known route pair.
      if (parseRoute(canonical)) {
        throw redirect({ to: "/awards/$route", params: { route: canonical } });
      }
    }
  },
  head: ({ params }) => {
    const parsed = parseRoute(params.route);
    const title = parsed
      ? `${parsed.from} to ${parsed.to} Award Flights — miles needed & value | Miles Expert`
      : "Award route — Miles Expert";
    const description = parsed
      ? `How many points a ${parsed.from} → ${parsed.to} award costs across Qantas, Velocity, KrisFlyer, Emirates, United and LifeMiles, benchmark cash fares per cabin, and cached award-space search.`
      : "Award route guide.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: AwardRoutePage,
});

function AwardRoutePage() {
  const { route } = Route.useParams();
  const parsed = parseRoute(route);

  if (!parsed) {
    return (
      <div className="min-h-screen bg-noir">
        <Header />
        <main className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="font-display text-3xl">Route not found.</h1>
          <p className="text-sm text-muted-foreground mt-3">
            Route guides use the form <span className="font-mono">syd-lhr</span>.
          </p>
          <Link
            to="/awards"
            className="inline-block mt-6 text-xs uppercase tracking-widest px-5 py-3 rounded-full hairline text-gold hover:bg-gold/10 transition"
          >
            Browse all routes
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const { from, to } = parsed;
  // Airline programs only (transferable currencies aren't redeemed directly).
  const airlinePrograms = PROGRAMS.filter((p) => p.alliance !== "Transferable");
  const others = knownRoutes()
    .filter((r) => !(r.from === from && r.to === to))
    .slice(0, 6);
  const spots = sweetSpotsFor(from, to);

  // Best cents-per-point per cabin, across airline programs — highlights the smart choice.
  const bestByCabin = CABINS.reduce<Record<Cabin, { id: string; miles: number; cpp: number } | null>>(
    (acc, c) => {
      let best: { id: string; miles: number; cpp: number } | null = null;
      airlinePrograms.forEach((p) => {
        const fare = fareEstimateAud(from, to, c.value);
        const miles = Math.max(
          1000,
          Math.round((fare * 100) / p.valueAudCents / 1000) * 1000,
        );
        const cpp = (fare * 100) / miles;
        if (!best || cpp > best.cpp) best = { id: p.id, miles, cpp };
      });
      acc[c.value] = best;
      return acc;
    },
    { economy: null, premium: null, business: null, first: null },
  );

  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-baseline gap-3">
          <span className="text-xs uppercase tracking-widest text-gold">Route guide</span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            All cabins · Economy included
          </span>
        </div>
        <h1 className="font-display text-5xl md:text-6xl mt-4">
          {from} <span className="text-gold">→</span> {to}
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Benchmark cash fares, indicative miles across every cabin, and the community-verified
          sweet spots that actually get booked. Live space varies — always confirm before
          transferring points.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/"
            search={{ from, to, cabin: "economy" }}
            className="text-xs uppercase tracking-widest px-6 py-3 rounded-full bg-gold text-gold-foreground hover:bg-gold-soft transition shadow-gold"
          >
            Search economy award space
          </Link>
          <Link
            to="/"
            search={{ from, to, cabin: "business" }}
            className="text-xs uppercase tracking-widest px-5 py-3 rounded-full hairline text-gold hover:bg-gold/10 transition"
          >
            Business
          </Link>
          <Link
            to="/awards"
            className="text-xs uppercase tracking-widest px-5 py-3 rounded-full hairline text-gold hover:bg-gold/10 transition"
          >
            All routes
          </Link>
        </div>

        {spots.length > 0 && (
          <section className="mt-14">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl">Sweet spots on this route</h2>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Community-verified
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              Redemptions the points community keeps returning to — the miles, the taxes, and
              why they beat the alternatives.
            </p>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {spots.map((s, i) => {
                const p = PROGRAMS.find((x) => x.id === s.programId);
                const cabinLabel = CABINS.find((c) => c.value === s.cabin)?.label ?? s.cabin;
                return (
                  <article
                    key={i}
                    className={`relative rounded-lg p-6 bg-card ${
                      s.cabin === "economy"
                        ? "border border-gold/50 shadow-[0_0_0_1px_hsl(var(--gold)/0.2)]"
                        : "hairline"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="inline-flex items-center gap-2"
                      >
                        <span
                          className="size-8 rounded-full grid place-items-center font-display text-xs"
                          style={{
                            background: `${p?.accent}22`,
                            color: p?.accent,
                            border: `1px solid ${p?.accent}55`,
                          }}
                        >
                          {p?.short}
                        </span>
                        <span className="text-sm">{p?.name}</span>
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-gold">
                        {cabinLabel}
                      </span>
                    </div>
                    <h3 className="font-display text-xl mt-4">{s.headline}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.why}</p>
                    <div className="mt-4 flex items-baseline gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Miles
                        </div>
                        <div className="font-mono tabular-nums text-lg text-foreground">
                          {s.miles.toLocaleString()}
                        </div>
                      </div>
                      {s.taxesAud !== undefined && (
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Taxes
                          </div>
                          <div className="font-mono tabular-nums text-lg text-foreground">
                            {fmtAud(s.taxesAud)}
                          </div>
                        </div>
                      )}
                    </div>
                    {s.source && (
                      <div className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground">
                        Source · {s.source}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-14">
          <h2 className="font-display text-2xl">Benchmark cash fares</h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {CABINS.map((c) => (
              <div key={c.value} className="rounded-lg border border-border bg-card p-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {c.label}
                </div>
                <div className="font-display text-2xl mt-2 text-gold-gradient">
                  {fmtAud(fareEstimateAud(from, to, c.value))}
                </div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                  one-way benchmark
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl">Indicative miles — every cabin, every program</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Modeled at each program's typical redemption value. Gold rows mark the smartest
            balance for that cabin. Economy is included — it's often the true value pick.
          </p>
          <div className="mt-4 rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background/40 text-muted-foreground uppercase tracking-widest text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Program</th>
                  {CABINS.map((c) => (
                    <th key={c.value} className="text-right px-4 py-3">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {airlinePrograms.map((p) => {
                  const milesFor = (cabin: Cabin) =>
                    Math.max(
                      1000,
                      Math.round((fareEstimateAud(from, to, cabin) * 100) / p.valueAudCents / 1000) *
                        1000,
                    );
                  return (
                    <tr
                      key={p.id}
                      className="border-t border-border-soft hover:bg-background/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="size-7 rounded-full grid place-items-center font-display text-xs"
                            style={{
                              background: `${p.accent}22`,
                              color: p.accent,
                              border: `1px solid ${p.accent}55`,
                            }}
                          >
                            {p.short}
                          </span>
                          {p.name}
                        </span>
                      </td>
                      {CABINS.map((c) => {
                        const m = milesFor(c.value);
                        const isBest = bestByCabin[c.value]?.id === p.id;
                        return (
                          <td
                            key={c.value}
                            className={`px-4 py-3 text-right font-mono text-xs tabular-nums ${
                              isBest ? "text-gold" : ""
                            }`}
                          >
                            {isBest && (
                              <span className="mr-1 text-[9px] uppercase tracking-widest">
                                best
                              </span>
                            )}
                            ~{m.toLocaleString()}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground/70">
            "Best" marks the program that delivers the highest cents-per-point value at our
            benchmark fare — not necessarily the lowest miles. Actual award pricing varies.
          </p>
        </section>

        <section className="mt-14 rounded-lg hairline bg-card/50 p-6">
          <span className="text-[10px] uppercase tracking-widest text-gold">Taxes reality check</span>
          <h2 className="font-display text-2xl mt-2">You'll pay cash on top. Plan for it.</h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl leading-relaxed">
            Award tickets aren't free — expect airport taxes, government charges, and (on some
            programs) fuel surcharges. Long-haul economy typically runs $100–$300 in taxes,
            business $150–$500, and Qantas–Emirates business to Europe can exceed $1,200 in
            surcharges alone. Compare taxes as carefully as miles.
          </p>
        </section>

        {others.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl">More route guides</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {others.map((r) => (
                <Link
                  key={`${r.from}-${r.to}`}
                  to="/awards/$route"
                  params={{ route: `${r.from.toLowerCase()}-${r.to.toLowerCase()}` }}
                  className="text-xs uppercase tracking-widest px-4 py-2 rounded-full border border-border text-muted-foreground hover:text-gold hover:border-border-strong transition"
                >
                  {r.from} → {r.to}
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="mt-16 text-[10px] uppercase tracking-widest text-muted-foreground/60 max-w-2xl">
          Editorial intelligence synthesised from Point Hacks AU, God Save the Points, One Mile
          at a Time, Frequent Miler, The Points Guy and Australian Frequent Flyer. Confirm live
          in-program before transferring.
        </p>
      </main>
      <Footer />
    </div>
  );
}
