import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { knownRoutes, fareTableFor, fmtAud } from "@/lib/intelligence";
import {
  sweetSpotsFor,
  regionForRoute,
  EXPERT_TIPS,
  type Region,
} from "@/lib/awards/sweetSpots";
import { PROGRAMS } from "@/lib/programs";

export const Route = createFileRoute("/awards/")({
  head: () => ({
    meta: [
      { title: "Award Flight Guide — Economy & Premium Sweet Spots | Miles Expert" },
      {
        name: "description",
        content:
          "The Australian award-redemption playbook: economy, premium economy, business and first sweet spots per route, distilled from Point Hacks, God Save the Points and One Mile at a Time.",
      },
      { property: "og:title", content: "Award Flight Guide — Miles Expert" },
    ],
  }),
  component: AwardsIndex,
});

function AwardsIndex() {
  const routes = knownRoutes();
  const grouped = routes.reduce<Record<Region, typeof routes>>((acc, r) => {
    const region = regionForRoute(r.from, r.to);
    (acc[region] ||= []).push(r);
    return acc;
  }, {} as Record<Region, typeof routes>);
  const regionOrder: Region[] = ["Trans-Pacific", "Asia", "India", "Europe", "Middle East"];

  // Editorial hero picks: 3 best economy + premium sweet spots surfaced up top.
  const featured = routes
    .flatMap((r) => sweetSpotsFor(r.from, r.to).map((s) => ({ ...s, ...r })))
    .filter((s) => s.cabin === "economy" || s.cabin === "premium")
    .slice(0, 3);

  const programName = (id: string) => PROGRAMS.find((p) => p.id === id)?.name ?? id;
  const programAccent = (id: string) => PROGRAMS.find((p) => p.id === id)?.accent ?? "#c9a765";
  const programShort = (id: string) => PROGRAMS.find((p) => p.id === id)?.short ?? "?";

  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <span className="text-xs uppercase tracking-widest text-gold">The Redemption Playbook</span>
        <h1 className="font-display text-5xl md:text-6xl mt-4 max-w-4xl">
          Where your points{" "}
          <span className="text-gold-gradient">actually go furthest.</span>
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Every cabin, every major program. Economy sweet spots included — because a 25k
          Bali seat is often better value than 140k in business. Intelligence curated from
          Point Hacks, God Save the Points, One Mile at a Time and Australian Frequent Flyer.
        </p>

        {/* Featured economy/premium sweet spots */}
        {featured.length > 0 && (
          <section className="mt-14">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl">This month's economy & premium sweet spots</h2>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Curated
              </span>
            </div>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
              {featured.map((s, i) => (
                <Link
                  key={i}
                  to="/awards/$route"
                  params={{ route: `${s.from.toLowerCase()}-${s.to.toLowerCase()}` }}
                  className="group relative rounded-lg hairline bg-card p-6 hover:border-gold/60 transition"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="size-9 rounded-full grid place-items-center font-display text-xs"
                      style={{
                        background: `${programAccent(s.programId)}22`,
                        color: programAccent(s.programId),
                        border: `1px solid ${programAccent(s.programId)}55`,
                      }}
                    >
                      {programShort(s.programId)}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-gold">
                      {s.cabin === "economy" ? "Economy" : "Premium Economy"}
                    </span>
                  </div>
                  <div className="font-display text-2xl mt-4">
                    {s.from} <span className="text-gold">→</span> {s.to}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{s.headline}</div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-mono tabular-nums text-lg text-foreground">
                      {s.miles.toLocaleString()}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      pts + ~{fmtAud(s.taxesAud ?? 0)}
                    </span>
                  </div>
                  {s.source && (
                    <div className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                      Source · {s.source}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Routes grouped by region */}
        <section className="mt-16">
          <h2 className="font-display text-2xl">Route guides by region</h2>
          <div className="mt-6 space-y-10">
            {regionOrder.map((region) => {
              const list = grouped[region];
              if (!list?.length) return null;
              return (
                <div key={region}>
                  <div className="flex items-baseline gap-4 border-b border-border-soft pb-2">
                    <h3 className="font-display text-xl text-gold-gradient">{region}</h3>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {list.length} routes
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {list.map(({ from, to }) => {
                      const fares = fareTableFor(from, to);
                      const eco = fares?.economy;
                      const biz = fares?.business;
                      const spots = sweetSpotsFor(from, to);
                      return (
                        <Link
                          key={`${from}-${to}`}
                          to="/awards/$route"
                          params={{ route: `${from.toLowerCase()}-${to.toLowerCase()}` }}
                          className="group rounded-lg border border-border bg-card p-5 hover:border-gold/60 transition"
                        >
                          <div className="flex items-baseline justify-between">
                            <div className="font-display text-2xl">
                              {from} <span className="text-gold">→</span> {to}
                            </div>
                            {spots.length > 0 && (
                              <span className="text-[9px] uppercase tracking-widest text-gold border border-gold/40 rounded-full px-2 py-0.5">
                                {spots.length} sweet spot{spots.length > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            {eco && (
                              <div>
                                <dt className="uppercase tracking-widest text-muted-foreground">
                                  Economy cash
                                </dt>
                                <dd className="font-mono tabular-nums text-foreground">
                                  {fmtAud(eco)}
                                </dd>
                              </div>
                            )}
                            {biz && (
                              <div>
                                <dt className="uppercase tracking-widest text-muted-foreground">
                                  Business cash
                                </dt>
                                <dd className="font-mono tabular-nums text-foreground">
                                  {fmtAud(biz)}
                                </dd>
                              </div>
                            )}
                          </dl>
                          <div className="mt-4 text-[10px] uppercase tracking-widest text-gold opacity-0 group-hover:opacity-100 transition">
                            Read the guide →
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Expert playbook */}
        <section className="mt-20">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-3xl">The expert playbook</h2>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              6 principles
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
            The durable rules the points community keeps rediscovering. Read these before you
            transfer a single point.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {EXPERT_TIPS.map((tip) => (
              <article
                key={tip.title}
                className="rounded-lg hairline bg-card p-6"
              >
                <span className="text-[10px] uppercase tracking-widest text-gold">
                  {tip.tag}
                </span>
                <h3 className="font-display text-xl mt-2">{tip.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {tip.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <p className="mt-16 text-[10px] uppercase tracking-widest text-muted-foreground/60 max-w-2xl">
          Intelligence curated from long-running community publications including Point Hacks
          AU, God Save the Points, One Mile at a Time, Frequent Miler, The Points Guy and
          Australian Frequent Flyer. Miles and taxes are indicative — always confirm in-program before transferring.
        </p>
      </main>
      <Footer />
    </div>
  );
}

// unused param placeholder — silence type checker for `programName`
void programName;
