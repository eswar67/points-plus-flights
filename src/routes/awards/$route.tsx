import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PROGRAMS } from "@/lib/programs";
import { fareEstimateAud, fmtAud, knownRoutes } from "@/lib/intelligence";
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
  return { from: m[1].toUpperCase(), to: m[2].toUpperCase() };
}

export const Route = createFileRoute("/awards/$route")({
  head: ({ params }) => {
    const parsed = parseRoute(params.route);
    const title = parsed
      ? `${parsed.from} to ${parsed.to} Award Flights — miles needed & value | Aureum`
      : "Award route — Aureum";
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
            className="inline-block mt-6 text-xs uppercase tracking-[0.2em] px-5 py-3 rounded-full hairline text-gold hover:bg-gold/10 transition"
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
  const others = knownRoutes().filter((r) => !(r.from === from && r.to === to)).slice(0, 6);

  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <span className="text-[10px] uppercase tracking-[0.3em] text-gold">Route guide</span>
        <h1 className="font-display text-5xl md:text-6xl mt-4">
          {from} <span className="text-gold">→</span> {to}
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Benchmark cash fares and indicative points cost for this route. Figures
          are typical mid-market values used by our CPP engine — live award
          pricing varies by date and program.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/"
            search={{ from, to, cabin: "business" }}
            className="text-xs uppercase tracking-[0.25em] px-6 py-3 rounded-full bg-gold text-gold-foreground hover:bg-gold-soft transition shadow-gold"
          >
            Search award space now
          </Link>
          <Link
            to="/awards"
            className="text-xs uppercase tracking-[0.2em] px-5 py-3 rounded-full hairline text-gold hover:bg-gold/10 transition"
          >
            All routes
          </Link>
        </div>

        <section className="mt-14">
          <h2 className="font-display text-2xl">Benchmark cash fares</h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {CABINS.map((c) => (
              <div key={c.value} className="rounded-xl border border-border bg-card p-5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {c.label}
                </div>
                <div className="font-display text-2xl mt-2 text-gold-gradient">
                  {fmtAud(fareEstimateAud(from, to, c.value))}
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
                  one-way benchmark
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl">Indicative miles per program</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Estimated at each program's typical premium-redemption value — use it
            to gauge which balance goes furthest, then confirm with a live search.
          </p>
          <div className="mt-4 rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background/40 text-muted-foreground uppercase tracking-[0.18em] text-[10px]">
                <tr>
                  <th className="text-left px-4 py-3">Program</th>
                  <th className="text-right px-4 py-3">Business</th>
                  <th className="text-right px-4 py-3">First</th>
                </tr>
              </thead>
              <tbody>
                {airlinePrograms.map((p) => {
                  const milesFor = (cabin: Cabin) =>
                    Math.round(fareEstimateAud(from, to, cabin) * 100 / p.valueAudCents / 1000) * 1000;
                  return (
                    <tr key={p.id} className="border-t border-border/60">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="size-6 rounded-full grid place-items-center font-display text-[9px]"
                            style={{ background: `${p.accent}22`, color: p.accent, border: `1px solid ${p.accent}55` }}
                          >
                            {p.short}
                          </span>
                          {p.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        ~{milesFor("business").toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        ~{milesFor("first").toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
                  className="text-xs uppercase tracking-[0.18em] px-4 py-2 rounded-full border border-border text-muted-foreground hover:text-gold hover:border-gold/40 transition"
                >
                  {r.from} → {r.to}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
