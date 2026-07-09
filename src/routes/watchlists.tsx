import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { SkeletonRows } from "@/components/site/Skeleton";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import type { Cabin } from "@/lib/awards/types";
import { useServerFn } from "@tanstack/react-start";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { listWatchlistAlerts } from "@/lib/alerts/history.functions";
import { getAlertChannelAvailability } from "@/lib/alerts/alerts.functions";

export const Route = createFileRoute("/watchlists")({
  head: () => ({
    meta: [
      { title: "Watchlists — Aureum" },
      {
        name: "description",
        content: "Save routes, set CPP thresholds and get alerted the moment award seats open.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  // Prefill arrives from "Watch this route" on the results page.
  validateSearch: (s: Record<string, unknown>) => ({
    from:
      typeof s.from === "string" && /^[A-Za-z]{3}$/.test(s.from) ? s.from.toUpperCase() : undefined,
    to: typeof s.to === "string" && /^[A-Za-z]{3}$/.test(s.to) ? s.to.toUpperCase() : undefined,
    dateFrom:
      typeof s.dateFrom === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.dateFrom)
        ? s.dateFrom
        : undefined,
    dateTo:
      typeof s.dateTo === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.dateTo) ? s.dateTo : undefined,
    cabin: ["economy", "premium", "business", "first"].includes(s.cabin as string)
      ? (s.cabin as Cabin)
      : undefined,
    pax:
      Number.isInteger(Number(s.pax)) && Number(s.pax) >= 1 && Number(s.pax) <= 9
        ? Number(s.pax)
        : undefined,
  }),
  component: WatchlistsPage,
});

type Prefill = {
  from?: string;
  to?: string;
  dateFrom?: string;
  dateTo?: string;
  cabin?: Cabin;
  pax?: number;
};

function relTime(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

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
  const { isActive: hasPlus } = useSubscription();
  const prefill: Prefill = Route.useSearch();
  const [items, setItems] = useState<Watchlist[]>([]);
  const [lastMatch, setLastMatch] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(() => !!(prefill.from && prefill.to));

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      nav({ to: "/auth", search: { redirect: "/watchlists" } });
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
    const rows = (data ?? []) as Watchlist[];
    setItems(rows);
    setLoading(false);
    if (rows.length) {
      const { data: alerts } = await supabase
        .from("alerts_sent")
        .select("watchlist_id, sent_at")
        .in(
          "watchlist_id",
          rows.map((r) => r.id),
        )
        .order("sent_at", { ascending: false })
        .limit(200);
      const m: Record<string, string> = {};
      for (const a of alerts ?? []) if (!m[a.watchlist_id]) m[a.watchlist_id] = a.sent_at;
      setLastMatch(m);
    }
  }

  async function toggleActive(w: Watchlist) {
    const { error } = await supabase
      .from("watchlists")
      .update({ active: !w.active })
      .eq("id", w.id);
    if (error) {
      setError(
        error.message.includes("row-level security")
          ? "The free plan includes one active watchlist. Pause the other one or upgrade to Aureum Plus."
          : error.message,
      );
      return;
    }
    setItems((prev) => prev.map((x) => (x.id === w.id ? { ...x, active: !x.active } : x)));
  }

  async function remove(w: Watchlist) {
    if (!confirm(`Delete watchlist for ${w.origin} → ${w.destination}?`)) return;
    const { error } = await supabase.from("watchlists").delete().eq("id", w.id);
    if (error) {
      setError(error.message);
      return;
    }
    setItems((prev) => prev.filter((x) => x.id !== w.id));
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-noir">
        <Header />
        <main className="mx-auto max-w-4xl px-6 py-16">
          <div className="h-8 w-48 rounded-md bg-card/80 animate-pulse mb-10" />
          <SkeletonRows rows={3} height="h-28" />
        </main>
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
            disabled={!hasPlus && items.length >= 1 && !showForm}
            className="btn btn-primary"
          >
            {showForm ? "Close" : "+ New watchlist"}
          </button>
        </div>

        {!hasPlus && items.length >= 1 && !showForm && (
          <div className="mt-6 rounded-lg border border-gold/40 bg-gold/5 p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-gold mb-1">
                Free plan limit
              </div>
              <p className="text-sm text-muted-foreground">
                You're using your one free watchlist. Upgrade to{" "}
                <span className="text-foreground">Aureum Plus</span> for unlimited watchlists and
                priority alerts.
              </p>
            </div>
            <Link
              to="/pricing"
              className="text-xs uppercase tracking-widest px-5 py-3 rounded-full bg-gold text-gold-foreground hover:bg-gold-soft transition shadow-gold whitespace-nowrap"
            >
              Upgrade
            </Link>
          </div>
        )}

        {showForm && (
          <NewWatchlistForm
            initial={prefill}
            onCreated={() => {
              setShowForm(false);
              refresh();
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {error && <div className="mt-4 text-sm text-destructive">{error}</div>}

        <div className="mt-10 space-y-3">
          {loading ? (
            <SkeletonRows rows={3} height="h-28" />
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No watchlists yet. Add one above to start getting alerts.
            </div>
          ) : (
            items.map((w) => (
              <article
                key={w.id}
                className={`rounded-lg border p-5 flex flex-wrap items-center gap-4 ${
                  w.active
                    ? "border-border bg-background/40"
                    : "border-border-soft bg-background/20 opacity-70"
                }`}
              >
                <div className="flex-1 min-w-[220px]">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
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
                  {w.min_cpp_aud != null && (
                    <div>
                      Min CPP: <span className="text-foreground">{w.min_cpp_aud}¢</span>
                    </div>
                  )}
                  {w.max_miles != null && (
                    <div>
                      Max miles:{" "}
                      <span className="text-foreground">{w.max_miles.toLocaleString()}</span>
                    </div>
                  )}
                  <div>
                    Alert via: <span className="text-foreground">{w.channel}</span>
                  </div>
                  <div>
                    Last match:{" "}
                    <span className={lastMatch[w.id] ? "text-live" : "text-muted-foreground"}>
                      {lastMatch[w.id] ? relTime(lastMatch[w.id]) : "none yet"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(w)}
                    className={`text-xs uppercase tracking-widest px-3 py-2 rounded-full hairline transition ${
                      w.active ? "text-gold" : "text-muted-foreground"
                    }`}
                  >
                    {w.active ? "Active" : "Paused"}
                  </button>
                  <button
                    onClick={() => remove(w)}
                    className="text-xs uppercase tracking-widest px-3 py-2 rounded-full text-muted-foreground hover:text-destructive transition"
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
    <div className="basis-full mt-2 pt-3 border-t border-border-soft">
      <button
        type="button"
        onClick={toggle}
        className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition"
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
          {!loading && alerts && <CppSparkline alerts={alerts} />}
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
                      <span className="text-muted-foreground">{a.miles.toLocaleString()} mi</span>
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

/** CPP of every alert this watchlist fired, oldest → newest. */
function CppSparkline({ alerts }: { alerts: AlertRow[] }) {
  const data = alerts
    .filter((a) => a.cpp_aud != null)
    .map((a) => ({
      t: new Date(a.sent_at).getTime(),
      label: new Date(a.sent_at).toLocaleDateString([], { day: "numeric", month: "short" }),
      cpp: a.cpp_aud as number,
    }))
    .sort((a, b) => a.t - b.t);

  if (data.length < 2) return null;

  return (
    <div className="mb-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
        Alert value over time
      </div>
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <XAxis dataKey="label" hide />
            <YAxis hide domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 11,
              }}
              labelStyle={{ color: "var(--muted-foreground)" }}
              formatter={(value) => [`${Number(value).toFixed(1)}¢/pt`, "CPP"]}
            />
            <Line
              type="monotone"
              dataKey="cpp"
              stroke="var(--gold)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function NewWatchlistForm({
  onCreated,
  onCancel,
  initial,
}: {
  onCreated: () => void;
  onCancel: () => void;
  initial?: Prefill;
}) {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const plus60 = new Date(Date.now() + 60 * 86400 * 1000).toISOString().slice(0, 10);

  const [label, setLabel] = useState(
    initial?.from && initial?.to ? `${initial.from} → ${initial.to}` : "",
  );
  const [origin, setOrigin] = useState(initial?.from ?? "SYD");
  const [destination, setDestination] = useState(initial?.to ?? "LAX");
  const [dateFrom, setDateFrom] = useState(initial?.dateFrom ?? today);
  const [dateTo, setDateTo] = useState(initial?.dateTo ?? plus60);
  const [cabin, setCabin] = useState<Cabin>(initial?.cabin ?? "business");
  const [pax, setPax] = useState(initial?.pax ?? 1);
  const [minCpp, setMinCpp] = useState<string>("3.5");
  const [maxMiles, setMaxMiles] = useState<string>("");
  const [channel, setChannel] = useState<string>("telegram");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Only offer channels this deployment can actually deliver on.
  const fetchChannels = useServerFn(getAlertChannelAvailability);
  const [channelOptions, setChannelOptions] = useState<{ value: string; label: string }[]>([
    { value: "app", label: "In-app history only" },
  ]);
  useEffect(() => {
    let alive = true;
    fetchChannels()
      .then((avail) => {
        if (!alive) return;
        const opts = [
          ...(avail.telegram ? [{ value: "telegram", label: "Telegram" }] : []),
          ...(avail.email ? [{ value: "email", label: "Email" }] : []),
          { value: "app", label: "In-app history only" },
        ];
        setChannelOptions(opts);
        setChannel(opts[0].value);
      })
      .catch(() => {
        /* keep in-app fallback */
        setChannel("app");
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (dateTo < dateFrom) {
      setErr("Latest date must be on or after the earliest date.");
      return;
    }
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
    if (error) {
      setErr(
        error.message.includes("row-level security")
          ? "The free plan includes one active watchlist. Upgrade to Aureum Plus for unlimited watchlists."
          : error.message,
      );
      return;
    }
    onCreated();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 rounded-lg border border-border p-6 bg-background/40 space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Label (optional)">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={inputCls}
            placeholder="Honeymoon SYD-LAX"
          />
        </Field>
        <Field label="Cabin">
          <select
            value={cabin}
            onChange={(e) => setCabin(e.target.value as Cabin)}
            className={inputCls}
          >
            {CABINS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="From (IATA)">
          <input
            required
            value={origin}
            onChange={(e) => setOrigin(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
            maxLength={3}
            pattern="[A-Za-z]{3}"
            title="3-letter IATA airport code"
            className={inputCls}
          />
        </Field>
        <Field label="To (IATA)">
          <input
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
            maxLength={3}
            pattern="[A-Za-z]{3}"
            title="3-letter IATA airport code"
            className={inputCls}
          />
        </Field>
        <Field label="Earliest date">
          <input
            required
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Latest date">
          <input
            required
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Passengers">
          <input
            required
            type="number"
            min={1}
            max={9}
            value={pax}
            onChange={(e) => setPax(Number(e.target.value))}
            className={inputCls}
          />
        </Field>
        <Field label="Min CPP (¢ AUD)">
          <input
            type="number"
            step="0.1"
            min="0"
            value={minCpp}
            onChange={(e) => setMinCpp(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Max miles (optional)">
          <input
            type="number"
            min="0"
            value={maxMiles}
            onChange={(e) => setMaxMiles(e.target.value)}
            className={inputCls}
            placeholder="e.g. 120000"
          />
        </Field>
        <Field label="Alert channel">
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className={inputCls}>
            {channelOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {err && <div className="text-sm text-destructive">{err}</div>}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting ? "Saving…" : "Create watchlist"}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-quiet">
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "mt-1 w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-gold/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
