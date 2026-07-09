import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/site/Header";
import { PaymentTestModeBanner } from "@/components/site/PaymentTestModeBanner";
import { StripeEmbeddedCheckout_ } from "@/components/site/StripeEmbeddedCheckout";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Miles Expert Plus" },
      {
        name: "description",
        content:
          "Miles Expert Plus: unlimited award watchlists, instant Telegram alerts, and concierge ticketing.",
      },
      { property: "og:title", content: "Pricing — Miles Expert Plus" },
      {
        property: "og:description",
        content: "AUD $12/month. Unlimited watchlists, alerts, concierge access. Cancel anytime.",
      },
    ],
  }),
  component: PricingPage,
});

const PLUS_FEATURES = [
  "Unlimited award watchlists",
  "Real-time Telegram & email alerts",
  "30+ frequent flyer programs",
  "Priority concierge queue",
  "Cancel anytime",
];

function PricingPage() {
  const { user } = useAuth();
  const { isActive, loading } = useSubscription();
  const nav = useNavigate();
  const [open, setOpen] = useState<"monthly" | "yearly" | null>(null);

  function start(plan: "monthly" | "yearly") {
    if (!user) {
      nav({ to: "/auth", search: { redirect: "/pricing" } });
      return;
    }
    setOpen(plan);
  }

  return (
    <div className="min-h-screen bg-noir">
      <PaymentTestModeBanner />
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs uppercase tracking-widest text-gold mb-3">Membership</div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight">Miles Expert Plus.</h1>
          <p className="text-muted-foreground mt-4">
            Unlimited award hunting, instant alerts, human concierge backup. One flat membership —
            cancel any time.
          </p>
        </div>

        {open ? (
          <div className="max-w-2xl mx-auto rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="text-sm text-muted-foreground">
                Miles Expert Plus — {open === "monthly" ? "AUD $12/mo" : "AUD $120/yr"}
              </div>
              <button
                onClick={() => setOpen(null)}
                className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            <StripeEmbeddedCheckout_
              priceId={open === "monthly" ? "aureum_plus_monthly" : "aureum_plus_yearly"}
            />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <PlanCard
              title="Monthly"
              price="A$12"
              cadence="/month"
              cta={isActive ? "You're on Plus" : "Start monthly"}
              disabled={loading || isActive}
              onClick={() => start("monthly")}
              features={PLUS_FEATURES}
            />
            <PlanCard
              title="Yearly"
              price="A$120"
              cadence="/year"
              badge="Save 17%"
              highlight
              cta={isActive ? "You're on Plus" : "Start yearly"}
              disabled={loading || isActive}
              onClick={() => start("yearly")}
              features={PLUS_FEATURES}
            />
          </div>
        )}

        {isActive && !open && (
          <div className="text-center mt-10">
            <Link
              to="/account"
              className="text-xs uppercase tracking-widest text-gold hover:underline"
            >
              Manage billing in account →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function PlanCard({
  title,
  price,
  cadence,
  features,
  cta,
  onClick,
  disabled,
  highlight,
  badge,
}: {
  title: string;
  price: string;
  cadence: string;
  features: string[];
  cta: string;
  onClick: () => void;
  disabled?: boolean;
  highlight?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`rounded-lg border p-8 ${highlight ? "border-gold/60 bg-gold/5" : "border-border bg-card"}`}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-xl">{title}</h3>
        {badge && <span className="text-xs uppercase tracking-widest text-gold">{badge}</span>}
      </div>
      <div className="mt-4">
        <span className="font-display text-4xl">{price}</span>
        <span className="text-muted-foreground text-sm">{cadence}</span>
      </div>
      <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-gold">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`mt-8 w-full ${highlight ? "btn btn-primary shadow-gold" : "btn btn-ghost"}`}
      >
        {cta}
      </button>
    </div>
  );
}
