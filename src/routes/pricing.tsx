import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/site/Header";
import { StripeEmbeddedCheckout_ } from "@/components/site/StripeEmbeddedCheckout";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

// Stripe price lookup key (created in Stripe with this lookup_key).
const PLUS_LOOKUP_KEY = "miles_expert_plus_monthly";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Miles Expert Plus" },
      {
        name: "description",
        content:
          "Upgrade to Miles Expert Plus for concierge booking, unlimited watchlists, and real-time award alerts.",
      },
      { property: "og:title", content: "Pricing — Miles Expert Plus" },
      {
        property: "og:description",
        content: "Concierge award booking, unlimited watchlists, and real-time alerts.",
      },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const { user, loading } = useAuth();
  const { subscription } = useSubscription();
  const [showCheckout, setShowCheckout] = useState(false);
  const isPlus = !!subscription;

  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest text-gold mb-3">Pricing</div>
          <h1 className="font-display text-4xl md:text-5xl">Miles Expert Plus</h1>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Everything in free, plus concierge award booking, unlimited watchlists, and real-time
            alerts the moment award seats open.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-8">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Free</div>
            <div className="mt-3 font-display text-4xl">$0</div>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>• Award search across programs</li>
              <li>• Route guide & sweet spots</li>
              <li>• Basic saved searches</li>
            </ul>
          </div>

          <div className="rounded-lg border border-gold/40 bg-card p-8 shadow-gold">
            <div className="text-xs uppercase tracking-widest text-gold">Plus</div>
            <div className="mt-3 font-display text-4xl">
              $19<span className="text-lg text-muted-foreground">/mo</span>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              <li>• Concierge award booking</li>
              <li>• Unlimited watchlists</li>
              <li>• Real-time email & Telegram alerts</li>
              <li>• Priority support</li>
            </ul>

            <div className="mt-8">
              {loading ? (
                <div className="h-11" />
              ) : !user ? (
                <Link
                  to="/auth"
                  className="inline-block text-xs uppercase tracking-widest px-6 py-3 rounded-full bg-gold text-gold-foreground hover:bg-gold-soft transition shadow-gold"
                >
                  Sign in to upgrade
                </Link>
              ) : isPlus ? (
                <Link
                  to="/account"
                  className="inline-block text-xs uppercase tracking-widest px-6 py-3 rounded-full border border-gold/40 text-gold hover:bg-gold/10 transition"
                >
                  Manage subscription
                </Link>
              ) : !showCheckout ? (
                <button
                  onClick={() => setShowCheckout(true)}
                  className="text-xs uppercase tracking-widest px-6 py-3 rounded-full bg-gold text-gold-foreground hover:bg-gold-soft transition shadow-gold"
                >
                  Upgrade to Plus
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {showCheckout && user && !isPlus && (
          <div className="mt-12 rounded-lg border border-border bg-card p-6">
            <StripeEmbeddedCheckout_ priceId={PLUS_LOOKUP_KEY} />
          </div>
        )}
      </main>
    </div>
  );
}