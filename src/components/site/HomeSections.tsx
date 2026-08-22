import { Link } from "@tanstack/react-router";
import { useState } from "react";
import luxuryJpg from "@/assets/lifestyle-luxury.jpg";
import luxuryWebp from "@/assets/lifestyle-luxury-800.webp";
import familyJpg from "@/assets/lifestyle-family.jpg";
import familyWebp from "@/assets/lifestyle-family-800.webp";
import weekendJpg from "@/assets/lifestyle-weekend.jpg";
import weekendWebp from "@/assets/lifestyle-weekend-800.webp";
import { Reveal } from "./Reveal";

const PROPS = [
  {
    jpg: luxuryJpg,
    webp: luxuryWebp,
    title: "Luxury at the front of the plane",
    body: "Lie-flat suites, caviar service and arrivals lounges — for a small slice of your points balance.",
  },
  {
    jpg: familyJpg,
    webp: familyWebp,
    title: "Family holidays for less",
    body: "Stretch your points across four (or more) seats and turn an aspiration into a boarding pass.",
  },
  {
    jpg: weekendJpg,
    webp: weekendWebp,
    title: "Effortless weekend escapes",
    body: "Short-haul premium cabins and city breaks, with a ready-to-follow playbook in under a minute.",
  },
];

const STRIP_STEPS = [
  {
    n: "1",
    t: "Search once",
    d: "Every program, cabin and alliance in one query — with freshness badges on each seat.",
  },
  {
    n: "2",
    t: "See true value",
    d: "Cents-per-point grading against real one-way fares tells you book or skip.",
  },
  {
    n: "3",
    t: "Follow the playbook",
    d: "Transfer timing, booking links, step by step — everything you need to redeem yourself.",
  },
];

export function HowItWorksStrip() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-14 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {STRIP_STEPS.map((s, i) => (
          <Reveal key={s.n} stagger={i}>
            <Link
              to="/how-it-works"
              className="group flex h-full items-start gap-4 rounded-lg border border-border bg-card/40 p-6 hover:border-border-strong transition"
            >
              <span className="shrink-0 size-9 rounded-full grid place-items-center font-display text-sm bg-gold/10 text-gold border border-gold/30">
                {s.n}
              </span>
              <span>
                <span className="block font-display text-lg">{s.t}</span>
                <span className="block text-sm text-muted-foreground mt-1 leading-relaxed">
                  {s.d}
                </span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function ValueProps() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <div className="max-w-2xl mb-12">
        <span className="text-xs uppercase tracking-widest text-gold">Why Miles Expert</span>
        <h2 className="font-display text-4xl md:text-5xl mt-3 leading-[1.05]">
          Your points are worth <span className="text-gold-gradient">more</span> than you think.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Whatever the trip, we surface the smartest redemption so you can book it yourself.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PROPS.map((p, i) => (
          <Reveal key={p.title} stagger={i}>
            <article className="group rounded-lg overflow-hidden border border-border bg-card hover:border-border-strong hover:-translate-y-1 transition duration-300">
              <div className="aspect-[4/3] overflow-hidden">
                <picture>
                  <source srcSet={p.webp} type="image/webp" />
                  <img
                    src={p.jpg}
                    alt=""
                    width={800}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.04]"
                  />
                </picture>
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl">{p.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{p.body}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export const FAQ_ITEMS = [
  {
    q: "How does Miles Expert actually find seats?",
    a: "We search cached award availability across frequent flyer programs (Qantas, Velocity, KrisFlyer, United, Emirates, LifeMiles and more) via seats.aero, updated continuously. You search once — we surface every program that has the route, ranked by cents-per-point value, with a freshness badge on every result so you know how current it is.",
  },
  {
    q: "Do I need to give you my frequent flyer logins?",
    a: "No. You tell us which programs you hold and roughly how many points — your login credentials stay with you. Miles Expert only reads cached award availability; you book the seat yourself through your program's website or call centre using the step-by-step playbook we generate for each result.",
  },
  {
    q: "How much does Miles Expert cost?",
    a: "Miles Expert is free to use. Search award availability, save watchlists, and receive alerts at no charge.",
  },
  {
    q: "What if you can't find what I'm looking for?",
    a: "Award space moves constantly. If nothing matches today, save a watchlist — we'll re-check seats.aero on a schedule and alert you the moment a seat opens that beats your cents-per-point target.",
  },
  {
    q: "Which airlines and programs do you cover?",
    a: "All major Oneworld, Star Alliance and SkyTeam carriers plus Virgin Australia, Emirates, Etihad and partner award charts. Browse the full list on the Programs page.",
  },
  {
    q: "How fresh is the award availability?",
    a: "Every result carries a freshness badge showing when that seat was last confirmed with the program. We continuously re-poll popular routes; less-travelled routes refresh on demand when you search them.",
  },
];

export function FAQ({ limit }: { limit?: number }) {
  const [open, setOpen] = useState<number | null>(0);
  const items = limit ? FAQ_ITEMS.slice(0, limit) : FAQ_ITEMS;
  return (
    <section className="mx-auto max-w-4xl px-6 py-20 md:py-28">
      <div className="text-center mb-12">
        <span className="text-xs uppercase tracking-widest text-gold">FAQ</span>
        <h2 className="font-display text-4xl md:text-5xl mt-3 leading-[1.05]">
          Questions, answered.
        </h2>
      </div>
      <div className="divide-y divide-border-soft border-y border-border-soft">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-6 py-6 text-left hover:text-gold transition"
                aria-expanded={isOpen}
              >
                <span className="font-display text-lg md:text-xl">{item.q}</span>
                <span
                  className={`shrink-0 size-8 rounded-full border border-border grid place-items-center text-gold transition ${
                    isOpen ? "rotate-45 border-gold/60" : ""
                  }`}
                  aria-hidden
                >
                  +
                </span>
              </button>
              {isOpen && (
                <p className="pb-6 -mt-2 text-muted-foreground leading-relaxed max-w-3xl">
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {limit && (
        <div className="text-center mt-10">
          <Link
            to="/faq"
            className="text-xs uppercase tracking-widest px-5 py-3 rounded-full hairline text-gold hover:bg-gold/10 transition inline-block"
          >
            See all questions
          </Link>
        </div>
      )}
    </section>
  );
}

export function ConciergeCTA() {
  return null;
}

const WORTH_TIERS = [
  {
    pts: 19_500,
    flight: "Economy to Bali or Southeast Asia",
    flightValue: 550,
    detail: "one-way sweet spot",
  },
  {
    pts: 60_000,
    flight: "Business class to Tokyo",
    flightValue: 3_900,
    detail: "lie-flat, one-way",
  },
  {
    pts: 87_000,
    flight: "Business class to Europe",
    flightValue: 6_500,
    detail: "lie-flat, one-way",
  },
];

const VOUCHER_RATE = 0.005; // ~0.5c/pt, typical bank portal

/** Anti-voucher education: the same points, spent two ways. */
export function PointsWorth() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <div className="max-w-2xl mb-12">
        <span className="text-xs uppercase tracking-widest text-gold">Points are money</span>
        <h2 className="font-display text-4xl md:text-5xl mt-3 leading-[1.05]">
          Don&apos;t burn them on <span className="text-gold-gradient">gift vouchers.</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Points aren&apos;t a bonus — they&apos;re a return on spending you already did. The same
          balance is worth several times more on flights than in a bank portal.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {WORTH_TIERS.map((t) => {
          const voucher = Math.round(t.pts * VOUCHER_RATE);
          const mult = t.flightValue / voucher;
          return (
            <div key={t.pts} className="rounded-lg border border-border bg-card/60 p-6">
              <div className="font-mono tabular-nums text-2xl text-foreground">
                {t.pts.toLocaleString()} <span className="text-sm text-muted-foreground">pts</span>
              </div>
              <div className="mt-5 flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Gift voucher</span>
                <span className="font-mono tabular-nums text-muted-foreground line-through decoration-destructive/60">
                  A${voucher.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between text-sm">
                <span className="text-foreground">{t.flight}</span>
                <span className="font-mono tabular-nums text-gold">
                  ~A${t.flightValue.toLocaleString()}
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-border-soft flex items-baseline justify-between">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {t.detail}
                </span>
                <span className="text-xs text-gold font-semibold tabular-nums">
                  {mult.toFixed(0)}× the value
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-8 text-center">
        <Link
          to="/calculator"
          className="inline-block text-xs uppercase tracking-widest px-6 py-3 rounded-full hairline text-gold hover:bg-gold/10 transition"
        >
          What are your points worth? →
        </Link>
      </div>
    </section>
  );
}
