import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { Link } from "@tanstack/react-router";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import type { Cabin } from "@/server/awards/types";
import { useServerFn } from "@tanstack/react-start";
import { listWatchlistAlerts } from "@/server/alerts/history.functions";

export const Route = createFileRoute("/watchlists")({
  head: () => ({
    meta: [
      { title: "Watchlists — Aureum" },
      { name: "description", content: "Save routes, set CPP thresholds and get alerted the moment award seats open." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WatchlistsPage,
});

type Watchlist = {
  id: string;
  label: string | null;
  origin: string;
  destination: string;
  date_from: string;
  date_to: string;
  cabin: Cabin;
  pax: number;
  max_miles: number | null;
  min_cpp_aud: number | null;
  channel: string;
  active: boolean;
  created_at: string;
};

const CABINS: Cabin[] = ["economy", "premium", "business", "first"];

function WatchlistsPage() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase
      .from("watchlists")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setItems((data ?? []) as Watchlist[]);
    setLoading(false);
  }

  async function toggleActive(w: Watchlist) {
    const { error } = await supabase
      .from("watchlists")
      .update({ active: !w.active })
      .eq("id", w.id);
    if (error) { setError(error.message); return; }
    setItems((prev) => prev.map((x) => x.id === w.id ? { ...x, active: !x.active } : x));
  }

  async function remove(w: Watchlist) {
    if (!confirm(`Delete watchlist for ${w.origin} → ${w.destination}?`)) return;
    const { error } = await supabase.from("watchlists").delete().eq("id", w.id);
    if (error) { setError(error.message); return; }
    setItems((prev) => prev.filter((x) => x.id !== w.id));
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-noir">
        <Header />
        <main className="mx-auto max-w-4xl px-6 py-16 text-sm text-muted-foreground">Loading…</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="font-display text-3xl">Watchlists</h1>
            <p className="text-sm text-muted-foreground mt-1">
              We re-check seats.aero on a schedule and alert you when a deal beats your CPP target.
            </p>
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="text-xs uppercase tracking-[0.18em] px-5 py-3 rounded-full bg-gold text-gold-foreground hover:opacity-90 transition"
          >
            {showForm ? "Close" : "+ New watchlist"}
          </button>
        </div>

        {showForm && (
          <NewWatchlistForm
            onCreated={() => { setShowForm(false); refresh(); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {error && <div className="mt-4 text-sm text-destructive">{error}</div>}

        <div className="mt-10 space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading watchlists…</div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No watchlists yet. Add one above to start getting alerts.
            </div>
          ) : (
            items.map((w) => (
              <article
                key={w.id}
                className={`rounded-xl border p-5 flex flex-wrap items-center gap-4 ${
                  w.active ? "border-border bg-background/40" : "border-border/50 bg-background/20 opacity-70"
                }`}
              >
                <div className="flex-1 min-w-[220px]">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {w.label || "Untitled"}
                  </div>
                  <div className="mt-1 font-display text-xl">
                    {w.origin} → {w.destination}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {w.date_from} → {w.date_to} · {w.cabin} · {w.pax} pax
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {w.min_cpp_aud != null && <div>Min CPP: <span className="text-foreground">{w.min_cpp_aud}¢</span></div>}
                  {w.max_miles != null && <div>Max miles: <span className="text-foreground">{w.max_miles.toLocaleString()}</span></div>}
                  <div>Alert via: <span className="text-foreground">{w.channel}</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(w)}
                    className={`text-[10px] uppercase tracking-[0.2em] px-3 py-2 rounded-full hairline transition ${
                      w.active ? "text-gold" : "text-muted-foreground"
                    }`}
                  >
                    {w.active ? "Active" : "Paused"}
                  </button>
                  <button
                    onClick={() => remove(w)}
                    className="text-[10px] uppercase tracking-[0.2em] px-3 py-2 rounded-full text-muted-foreground hover:text-destructive transition"
                  >
                    Delete
                  </button>
                </div>
                <AlertHistory watchlistId={w.id} />
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

type AlertRow = {
  id: string;
  sent_at: string;
  fingerprint: string;
  cpp_aud: number | null;
  miles: number | null;
};

function AlertHistory({ watchlistId }: { watchlistId: string }) {
  const fetchAlerts = useServerFn(listWatchlistAlerts);
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetchAlerts({ data: { watchlistId, limit: 10 } });
      if (!res.ok) setErr(res.error);
      else setAlerts(res.alerts as AlertRow[]);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && alerts === null) load();
  }

  return (
    <div className="basis-full mt-2 pt-3 border-t border-border/40">
      <button
        type="button"
        onClick={toggle}
        className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition"
      >
        {open ? "▾ Hide alert history" : "▸ Show alert history"}
      </button>
      {open && (
        <div className="mt-3 text-xs">
          {loading && <div className="text-muted-foreground">Loading…</div>}
          {err && <div className="text-destructive">{err}</div>}
          {!loading && !err && alerts && alerts.length === 0 && (
            <div className="text-muted-foreground">
              No alerts sent yet. We'll record one here every time this watchlist fires.
            </div>
          )}
          {!loading && alerts && alerts.length > 0 && (
            <ul className="space-y-1.5">
              {alerts.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 font-mono">
                  <span className="text-muted-foreground">
                    {new Date(a.sent_at).toLocaleString()}
                  </span>
                  <span className="text-foreground">
                    {a.cpp_aud != null && (
                      <span className="text-gold mr-3">{a.cpp_aud.toFixed(1)}¢/pt</span>
                    )}
                    {a.miles != null && (
                      <span className="text-muted-foreground">
                        {a.miles.toLocaleString()} mi
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function NewWatchlistForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const plus60 = new Date(Date.now() + 60 * 86400 * 1000).toISOString().slice(0, 10);

  const [label, setLabel] = useState("");
  const [origin, setOrigin] = useState("SYD");
  const [destination, setDestination] = useState("LAX");
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(plus60);
  const [cabin, setCabin] = useState<Cabin>("business");
  const [pax, setPax] = useState(1);
  const [minCpp, setMinCpp] = useState<string>("3.5");
  const [maxMiles, setMaxMiles] = useState<string>("");
  const [channel, setChannel] = useState<"telegram" | "email">("telegram");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setErr(null);
    const payload = {
      user_id: user.id,
      label: label.trim() || null,
      origin: origin.trim().toUpperCase(),
      destination: destination.trim().toUpperCase(),
      date_from: dateFrom,
      date_to: dateTo,
      cabin,
      pax,
      min_cpp_aud: minCpp ? Number(minCpp) : null,
      max_miles: maxMiles ? Number(maxMiles) : null,
      channel,
      active: true,
    };
    const { error } = await supabase.from("watchlists").insert(payload);
    setSubmitting(false);
    if (error) { setErr(error.message); return; }
    onCreated();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 rounded-xl border border-border p-6 bg-background/40 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Label (optional)">
          <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} placeholder="Honeymoon SYD-LAX" />
        </Field>
        <Field label="Cabin">
          <select value={cabin} onChange={(e) => setCabin(e.target.value as Cabin)} className={inputCls}>
            {CABINS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="From (IATA)">
          <input required value={origin} onChange={(e) => setOrigin(e.target.value)} maxLength={4} className={inputCls} />
        </Field>
        <Field label="To (IATA)">
          <input required value={destination} onChange={(e) => setDestination(e.target.value)} maxLength={4} className={inputCls} />
        </Field>
        <Field label="Earliest date">
          <input required type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Latest date">
          <input required type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Passengers">
          <input required type="number" min={1} max={9} value={pax} onChange={(e) => setPax(Number(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Min CPP (¢ AUD)">
          <input type="number" step="0.1" min="0" value={minCpp} onChange={(e) => setMinCpp(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Max miles (optional)">
          <input type="number" min="0" value={maxMiles} onChange={(e) => setMaxMiles(e.target.value)} className={inputCls} placeholder="e.g. 120000" />
        </Field>
        <Field label="Alert channel">
          <select value={channel} onChange={(e) => setChannel(e.target.value as "telegram" | "email")} className={inputCls}>
            <option value="telegram">Telegram</option>
            <option value="email">Email</option>
          </select>
        </Field>
      </div>

      {err && <div className="text-sm text-destructive">{err}</div>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="text-xs uppercase tracking-[0.18em] px-6 py-3 rounded-full bg-gold text-gold-foreground hover:opacity-90 transition disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Create watchlist"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs uppercase tracking-[0.18em] px-4 py-3 text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputCls = "mt-1 w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-gold/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}