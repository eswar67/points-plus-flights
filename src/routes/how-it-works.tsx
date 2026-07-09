import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Miles Expert Works — Award Seat Search" },
      {
        name: "description",
        content:
          "Track your points, search cached award space across programs — updated continuously — and follow a guided redemption playbook.",
      },
      { property: "og:title", content: "How Miles Expert Works" },
      { property: "og:description", content: "Three steps from points to premium cabin." },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  {
    n: "01",
    t: "Track your programs",
    d: "Add the loyalty programs you hold — Qantas, Velocity, KrisFlyer, Emirates, United, LifeMiles and more — with the balances you have. We value the lot in AUD. No passwords, ever.",
  },
  {
    n: "02",
    t: "Search cached award space",
    d: "One search covers every program, cabin and alliance — cached award data, updated continuously, with freshness badges so you know exactly how current each seat is.",
  },
  {
    n: "03",
    t: "Follow the playbook",
    d: "Every result comes with a step-by-step plan: which points to transfer, how long they take to land, and where to ticket the seat yourself.",
  },
];

function HowItWorks() {
  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-12">
        <span className="text-xs uppercase tracking-widest text-gold">How it works</span>
        <h1 className="font-display text-5xl md:text-6xl mt-4 max-w-3xl">
          From points to <span className="text-gold-gradient">premium cabin</span>, in three steps.
        </h1>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-3">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="rounded-lg border border-border bg-card p-8 hover:border-border-strong transition"
          >
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
