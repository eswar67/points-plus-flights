import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PROGRAMS } from "@/lib/programs";

export const Route = createFileRoute("/programs")({
  head: () => ({
    meta: [
      { title: "Loyalty Programs — Aureum" },
      {
        name: "description",
        content:
          "Track Qantas, Velocity, KrisFlyer, Emirates, United and LifeMiles balances and search cached award space, updated continuously.",
      },
      { property: "og:title", content: "Loyalty Programs — Aureum" },
      { property: "og:description", content: "Six premium loyalty programs, one vault." },
    ],
  }),
  component: ProgramsPage,
});

function ProgramsPage() {
  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-10">
        <span className="text-xs uppercase tracking-widest text-gold">Supported programs</span>
        <h1 className="font-display text-5xl md:text-6xl mt-4">
          Every program. <span className="text-gold-gradient">One vault.</span>
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Add the programs you hold and let Aureum search cached award space across every cabin and
          alliance — updated continuously.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 grid grid-cols-1 md:grid-cols-2 gap-3">
        {PROGRAMS.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border border-border bg-card p-6 hover:border-border-strong transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {p.alliance}
                </div>
                <div className="font-display text-2xl mt-1">{p.name}</div>
              </div>
              <span
                className="size-12 rounded-lg grid place-items-center font-display text-sm"
                style={{
                  background: `${p.accent}22`,
                  color: p.accent,
                  border: `1px solid ${p.accent}55`,
                }}
              >
                {p.short}
              </span>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
              <Info label="Alliance" value={p.alliance} />
              <Info label="Value" value={`${p.valueAudCents.toFixed(1)}¢ / pt`} accent />
              <Info label="Cabins" value="All" />
            </div>
            <a
              href="/account"
              className="mt-6 block w-full text-center rounded-lg py-3 text-xs uppercase tracking-widest hairline text-gold hover:bg-gold/10 transition"
            >
              Add my balance
            </a>
          </div>
        ))}
      </section>
      <Footer />
    </div>
  );
}

function Info({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-background/40 border border-border-soft p-3">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-display text-base mt-1 ${accent ? "text-gold" : ""}`}>{value}</div>
    </div>
  );
}
