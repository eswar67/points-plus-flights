import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SavingTooltip } from "@/components/awards/SavingTooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
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

  const programAccent = (id: string) => PROGRAMS.find((p) => p.id === id)?.accent ?? "#c9a765";
  const programShort = (id: string) => PROGRAMS.find((p) => p.id === id)?.short ?? "?";

  return (
    <TooltipProvider delayDuration={150}>
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
                      const biz = fares?.business;
                      const eco = fares?.economy;
                      const spots = sweetSpotsFor(from, to);
                      // Cheapest business redemption: pick the sweet spot with the lowest
                      // cash outlay (taxes) — that's the real % saving vs a paid business fare.
                      const bizSpots = spots.filter((s) => s.cabin === "business");
                      const bestBiz = bizSpots.length
                        ? bizSpots.reduce((a, b) =>
                            (a.taxesAud ?? Infinity) <= (b.taxesAud ?? Infinity) ? a : b,
                          )
                        : null;
                      const savingPct =
                        biz && bestBiz && bestBiz.taxesAud !== undefined
                          ? Math.max(0, Math.round(((biz - bestBiz.taxesAud) / biz) * 100))
                          : null;
                      const ecoSpots = spots.filter((s) => s.cabin === "economy");
                      const bestEco = ecoSpots.length
                        ? ecoSpots.reduce((a, b) =>
                            (a.taxesAud ?? Infinity) <= (b.taxesAud ?? Infinity) ? a : b,
                          )
                        : null;
                      const ecoSavingPct =
                        eco && bestEco && bestEco.taxesAud !== undefined
                          ? Math.max(0, Math.round(((eco - bestEco.taxesAud) / eco) * 100))
                          : null;
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
                            {savingPct !== null && (
                              <span className="text-[10px] uppercase tracking-widest text-gold-foreground bg-gold rounded-full px-2 py-0.5 font-medium">
                                Save {savingPct}%
                              </span>
                            )}
                          </div>
                          {biz && (
                            <div className="mt-4 space-y-2">
                              <div className="flex items-baseline justify-between text-xs">
                                <span className="uppercase tracking-widest text-muted-foreground">
                                  Business cash
                                </span>
                                <span className="font-mono tabular-nums text-muted-foreground line-through">
                                  {fmtAud(biz)}
                                </span>
                              </div>
                              {bestBiz ? (
                                <div className="flex items-baseline justify-between text-xs">
                                  <span className="uppercase tracking-widest text-gold">
                                    Reward · {PROGRAMS.find((p) => p.id === bestBiz.programId)?.short}
                                  </span>
                                  <span className="font-mono tabular-nums text-foreground">
                                    {(bestBiz.miles / 1000).toFixed(0)}k
                                    {bestBiz.taxesAud !== undefined && (
                                      <span className="text-muted-foreground">
                                        {" "}+ {fmtAud(bestBiz.taxesAud)}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
                                  Reward benchmark inside →
                                </div>
                              )}
                            </div>
                          )}
                          {eco && (
                            <div className="mt-3 pt-3 border-t border-border-soft space-y-2">
                              <div className="flex items-baseline justify-between text-xs">
                                <span className="uppercase tracking-widest text-muted-foreground">
                                  Economy cash
                                </span>
                                <span className="font-mono tabular-nums text-muted-foreground line-through">
                                  {fmtAud(eco)}
                                </span>
                              </div>
                              {bestEco ? (
                                <div className="flex items-baseline justify-between text-xs">
                                  <span className="uppercase tracking-widest text-gold">
                                    Reward · {PROGRAMS.find((p) => p.id === bestEco.programId)?.short}
                                  </span>
                                  <span className="font-mono tabular-nums text-foreground">
                                    {(bestEco.miles / 1000).toFixed(0)}k
                                    {bestEco.taxesAud !== undefined && (
                                      <span className="text-muted-foreground">
                                        {" "}+ {fmtAud(bestEco.taxesAud)}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
                                  Economy reward inside →
                                </div>
                              )}
                              {ecoSavingPct !== null && (
                                <div className="text-[10px] uppercase tracking-widest text-gold">
                                  Save {ecoSavingPct}% vs cash
                                </div>
                              )}
                            </div>
                          )}
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
    </TooltipProvider>
  );
}

