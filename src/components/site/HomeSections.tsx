import { Link } from "@tanstack/react-router";
import { useState } from "react";
import luxuryImg from "@/assets/lifestyle-luxury.jpg";
import familyImg from "@/assets/lifestyle-family.jpg";
import weekendImg from "@/assets/lifestyle-weekend.jpg";
import { Reveal } from "./Reveal";

const PROPS = [
  {
    img: luxuryImg,
    title: "Luxury at the front of the plane",
    body: "Lie-flat suites, caviar service and arrivals lounges — for a fraction of the cash fare.",
  },
  {
    img: familyImg,
    title: "Family holidays for less",
    body: "Stretch your points across four (or more) seats and turn an aspiration into a boarding pass.",
  },
  {
    img: weekendImg,
    title: "Effortless weekend escapes",
    body: "Short-haul premium cabins and city breaks, with a ready-to-book playbook in under a minute.",
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
    d: "Transfer timing, booking links, step by step — or hand it to our concierge.",
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
          Whatever the trip, we surface the smartest redemption — then book it for you.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PROPS.map((p, i) => (
          <Reveal key={p.title} stagger={i}>
            <article className="group rounded-lg overflow-hidden border border-border bg-card hover:border-border-strong hover:-translate-y-1 transition duration-300">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={p.img}
                  alt=""
                  width={1024}
                  height={768}
                  loading="lazy"
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.04]"
                />
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
    a: "No. You tell us which programs you hold and roughly how many points. For concierge bookings, our agents walk you through the ticketing call or use our authorised booking channels — your credentials stay with you.",
  },
  {
    q: "What does Miles Expert Plus cost?",
    a: "Miles Expert Plus is a flat monthly subscription that unlocks unlimited watchlists, instant Telegram alerts on new award space, and concierge ticketing. See the Pricing page for current rates.",
  },
  {
    q: "What if you can't find what I'm looking for?",
    a: "If our concierge can't ticket your requested redemption within 14 days of submission, we refund that month's subscription. No questions, no friction.",
  },
  {
    q: "Which airlines and programs do you cover?",
    a: "All major Oneworld, Star Alliance and SkyTeam carriers plus Virgin Australia, Emirates, Etihad and partner award charts. Browse the full list on the Programs page.",
  },
  {
    q: "How quickly do you respond to a booking request?",
    a: "Most concierge requests are acknowledged within an hour and ticketed inside 24 hours — often the same day if award space is at risk of disappearing.",
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
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 md:pb-28">
      <div className="relative overflow-hidden rounded-lg border border-gold/30 bg-gradient-to-br from-gold/10 via-card to-background p-10 md:p-16">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-widest text-gold">Miles Expert Plus</span>
          <h2 className="font-display text-4xl md:text-5xl mt-3 leading-[1.05]">
            Hand the search to us.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg">
            Tell our concierge where you want to go. We'll find the seats, hold them, and ticket the
            redemption — usually inside 24 hours.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/book"
              className="text-xs uppercase tracking-widest px-6 py-3 rounded-full bg-gold text-gold-foreground hover:opacity-90 transition"
            >
              Submit a request
            </Link>
            <Link
              to="/pricing"
              className="text-xs uppercase tracking-widest px-6 py-3 rounded-full hairline text-gold hover:bg-gold/10 transition"
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
