import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Aureum Works — Real-Time Award Redemption" },
      { name: "description", content: "Link your loyalty accounts, search live award space, and book in seconds. Here's how." },
      { property: "og:title", content: "How Aureum Works" },
      { property: "og:description", content: "Three steps from points to premium cabin." },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  { n: "01", t: "Link your programs", d: "Connect Qantas, Velocity, KrisFlyer, Emirates, United and LifeMiles with read-only access. Balances sync instantly." },
  { n: "02", t: "Search live award space", d: "We scan every alliance and cabin for the date you want — no more loading dummy calendars on six different airline websites." },
  { n: "03", t: "Redeem in real time", d: "Pick the itinerary, confirm with one tap. Aureum spends the points from the right account and ticketing happens immediately." },
];

function HowItWorks() {
  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-12">
        <span className="text-[10px] uppercase tracking-[0.3em] text-gold">How it works</span>
        <h1 className="font-display text-5xl md:text-6xl mt-4 max-w-3xl">
          From points to <span className="text-gold-gradient">premium cabin</span>, in three steps.
        </h1>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-3">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-2xl border border-border bg-card p-8 hover:border-gold/40 transition">
            <div className="font-display text-5xl text-gold-gradient">{s.n}</div>
            <h3 className="font-display text-2xl mt-6">{s.t}</h3>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{s.d}</p>
          </div>
        ))}
      </section>
      <Footer />
    </div>
  );
}
