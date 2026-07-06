import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (s: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Welcome to Aureum Plus" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReturnPage,
});

function ReturnPage() {
  const { session_id } = Route.useSearch();
  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="text-xs uppercase tracking-widest text-gold mb-3">Welcome aboard</div>
        <h1 className="font-display text-4xl">You're on Aureum Plus.</h1>
        <p className="text-muted-foreground mt-4">
          {session_id
            ? "Your subscription is active. Start setting up watchlists and we'll alert you the moment seats open."
            : "Looks like you arrived here without completing checkout. Try again from the pricing page."}
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link
            to="/watchlists"
            className="text-xs uppercase tracking-widest px-6 py-3 rounded-full bg-gold text-gold-foreground hover:bg-gold-soft transition shadow-gold"
          >
            Create a watchlist
          </Link>
          <Link
            to="/account"
            className="text-xs uppercase tracking-widest px-6 py-3 rounded-full border border-gold/40 text-gold hover:bg-gold/10 transition"
          >
            Account
          </Link>
        </div>
      </main>
    </div>
  );
}
