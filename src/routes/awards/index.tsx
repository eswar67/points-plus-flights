import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { knownRoutes, fareTableFor, fmtAud } from "@/lib/intelligence";

export const Route = createFileRoute("/awards/")({
  head: () => ({
    meta: [
      { title: "Award Flight Routes — Miles Expert" },
      {
        name: "description",
        content:
          "Popular premium-cabin award routes from Australia: benchmark cash fares, indicative miles per program, and cached award-space search.",
      },
      { property: "og:title", content: "Award Flight Routes — Miles Expert" },
    ],
  }),
  component: AwardsIndex,
});

function AwardsIndex() {
  const routes = knownRoutes();
  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <span className="text-xs uppercase tracking-widest text-gold">Route guides</span>
        <h1 className="font-display text-5xl md:text-6xl mt-4 max-w-3xl">
          Where do you want your <span className="text-gold-gradient">points to take you?</span>
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Benchmark fares and indicative miles for the routes Australians redeem most. Every guide
          links straight into a live award search.
        </p>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {routes.map(({ from, to }) => {
            const fares = fareTableFor(from, to);
            const business = fares?.business;
            return (
              <Link
                key={`${from}-${to}`}
                to="/awards/$route"
                params={{ route: `${from.toLowerCase()}-${to.toLowerCase()}` }}
                className="group rounded-lg border border-border bg-card p-6 hover:border-border-strong transition"
              >
                <div className="font-display text-2xl">
                  {from} <span className="text-gold">→</span> {to}
                </div>
                {business && (
                  <div className="text-sm text-muted-foreground mt-2">
                    Business cash fare ≈ <span className="text-foreground">{fmtAud(business)}</span>
                  </div>
                )}
                <div className="mt-4 text-xs uppercase tracking-widest text-gold opacity-0 group-hover:opacity-100 transition">
                  View route guide →
                </div>
              </Link>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
