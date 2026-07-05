import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/requests")({
  head: () => ({
    meta: [
      { title: "Your requests — Aureum" },
      { name: "description", content: "Track the status of your concierge booking requests." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RequestsPage,
});

type Req = {
  id: string;
  route_from: string;
  route_to: string;
  travel_date: string;
  cabin: string;
  passenger_count: number;
  program: string;
  carrier: string | null;
  miles_required: number | null;
  notes: string | null;
  status: string;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  new: "bg-gold/15 text-gold border-gold/40",
  in_progress: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  ticketed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const STATUS_HELP: Record<string, string> = {
  new: "In the queue — a specialist will pick this up shortly.",
  in_progress: "A specialist is hunting seats for this request.",
  ticketed: "Booked! Check your email for the e-ticket details.",
  cancelled: "This request was closed without ticketing.",
};

function RequestsPage() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<Req[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("booking_requests")
        .select("id, route_from, route_to, travel_date, cabin, passenger_count, program, carrier, miles_required, notes, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) setError(error.message);
      setRequests((data ?? []) as Req[]);
    })();
  }, [user, authLoading, nav]);

  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="font-display text-3xl">Your requests</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Every concierge booking request you've made, and where it stands.
            </p>
          </div>
          <Link
            to="/book"
            className="text-xs uppercase tracking-[0.2em] px-4 py-2 rounded-full hairline text-gold hover:bg-gold/10 transition whitespace-nowrap"
          >
            + New request
          </Link>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive p-4 text-sm">
            {error}
          </div>
        )}

        <div className="mt-10 space-y-3">
          {requests === null ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : requests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <h2 className="font-display text-xl">No requests yet.</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Hand a route to our concierge and we'll hunt the award seats and
                ticket them for you.
              </p>
              <Link
                to="/book"
                className="inline-block mt-5 text-xs uppercase tracking-[0.25em] px-5 py-2.5 rounded-full bg-gold text-gold-foreground hover:opacity-90 transition"
              >
                Request a booking
              </Link>
            </div>
          ) : (
            requests.map((r) => (
              <article key={r.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()} · ref {r.id.slice(0, 8)}
                    </div>
                    <div className="font-display text-xl mt-1">
                      {r.route_from} <span className="text-gold">→</span> {r.route_to}
                      <span className="text-sm text-muted-foreground ml-3">
                        {r.travel_date} · {r.cabin} · {r.passenger_count} pax
                      </span>
                    </div>
                    <div className="text-sm mt-2 text-muted-foreground">
                      Program: <span className="text-foreground">{r.program}</span>
                      {r.carrier && <> · Carrier: <span className="text-foreground">{r.carrier}</span></>}
                      {r.miles_required != null && (
                        <> · Miles: <span className="text-foreground">{r.miles_required.toLocaleString()}</span></>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border ${
                        STATUS_STYLES[r.status] ?? STATUS_STYLES.new
                      }`}
                    >
                      {r.status.replace("_", " ")}
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-2 max-w-[200px]">
                      {STATUS_HELP[r.status] ?? ""}
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
