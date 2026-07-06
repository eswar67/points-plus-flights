import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { SkeletonRows } from "@/components/site/Skeleton";
import { listBookingRequests, updateBookingRequest } from "@/lib/booking/agent.functions";

export const Route = createFileRoute("/concierge")({
  head: () => ({
    meta: [
      { title: "Concierge queue — Aureum" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConciergeQueue,
});

type Req = {
  id: string;
  contact_email: string;
  contact_name: string;
  passenger_count: number;
  route_from: string;
  route_to: string;
  travel_date: string;
  cabin: string;
  program: string;
  carrier: string | null;
  miles_required: number | null;
  notes: string | null;
  status: string;
  agent_notes: string | null;
  created_at: string;
};

const STATUSES = ["new", "in_progress", "ticketed", "cancelled"] as const;

function ConciergeQueue() {
  const nav = useNavigate();
  const list = useServerFn(listBookingRequests);
  const update = useServerFn(updateBookingRequest);
  const [requests, setRequests] = useState<Req[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  async function refresh() {
    try {
      const { requests } = await list();
      setRequests(requests as Req[]);
    } catch (e) {
      setError((e as Error).message || "Failed to load");
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        nav({ to: "/agent-login" });
        return;
      }
      // RLS protects the data regardless; this keeps non-agents out of the UI.
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id);
      const isAgent = !!roles?.some((r) => r.role === "agent" || r.role === "admin");
      if (!alive) return;
      setAuthorized(isAgent);
      if (isAgent) refresh();
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-noir">
        <Header />
        <main className="mx-auto max-w-md px-6 py-24 text-center">
          <h1 className="font-display text-3xl">Agents only.</h1>
          <p className="text-sm text-muted-foreground mt-3">
            This queue is restricted to concierge agents. If you should have
            access, ask an admin to assign you the <span className="font-mono">agent</span> role.
          </p>
          <button
            onClick={async () => { await supabase.auth.signOut(); nav({ to: "/agent-login" }); }}
            className="mt-8 text-xs uppercase tracking-widest px-5 py-3 rounded-full hairline text-gold hover:bg-gold/10 transition"
          >
            Sign in as an agent
          </button>
        </main>
      </div>
    );
  }

  async function setStatus(id: string, status: typeof STATUSES[number], agent_notes?: string | null) {
    await update({ data: { id, status, agent_notes: agent_notes ?? null } });
    refresh();
  }

  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl">Concierge queue</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Live booking requests. Update status as you ticket each one.
            </p>
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); nav({ to: "/agent-login" }); }}
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 text-destructive p-4 text-sm mb-6">
            {error}. You may need the <span className="font-mono">agent</span> role assigned to your user.
          </div>
        )}

        {!requests ? (
          <SkeletonRows rows={4} height="h-24" />
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
            No booking requests yet.
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()} · ref {r.id.slice(0, 8)}
                    </div>
                    <div className="font-display text-xl mt-1">
                      {r.route_from} <span className="text-gold">→</span> {r.route_to}
                      <span className="text-sm text-muted-foreground ml-3">
                        {r.travel_date} · {r.cabin} · {r.passenger_count} pax
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {r.contact_name} · {r.contact_email}
                    </div>
                    <div className="text-sm mt-2">
                      <span className="text-muted-foreground">Program:</span> {r.program}
                      {r.carrier && <> · <span className="text-muted-foreground">Carrier:</span> {r.carrier}</>}
                      {r.miles_required != null && <> · <span className="text-muted-foreground">Miles:</span> {r.miles_required.toLocaleString()}</>}
                    </div>
                    {r.notes && (
                      <div className="text-sm text-muted-foreground mt-2 italic">"{r.notes}"</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(r.id, s, r.agent_notes)}
                        className={`text-xs uppercase tracking-widest px-3 py-1.5 rounded-full border transition ${
                          r.status === s
                            ? "bg-gold text-gold-foreground border-gold"
                            : "border-border text-muted-foreground hover:text-foreground hover:border-border-strong"
                        }`}
                      >
                        {s.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}