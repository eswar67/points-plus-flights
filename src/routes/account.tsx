import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { SkeletonRows } from "@/components/site/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { PROGRAMS } from "@/lib/programs";
import { useServerFn } from "@tanstack/react-start";
import { useUserBalances } from "@/hooks/useUserBalances";
import { TransferPlanner } from "@/components/site/TransferPlanner";
import { sendTestTelegramAlert } from "@/lib/alerts/alerts.functions";
import { getCronSecretMeta, rotateCronSecret } from "@/lib/admin/cron-secret.functions";
import { listPollerRuns } from "@/lib/admin/observability.functions";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [{ title: "Account — Miles Expert" }, { name: "robots", content: "noindex" }],
  }),
  component: AccountPage,
});

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  programs_held: string[];
  telegram_chat_id: string | null;
};

function AccountPage() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const sendTest = useServerFn(sendTestTelegramAlert);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, programs_held, telegram_chat_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) setError(error.message);
      if (data) {
        setProfile(data as ProfileRow);
        setDisplayName(data.display_name ?? "");
        setTelegram(data.telegram_chat_id ?? "");
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
      setLoading(false);
    })();
  }, [user, authLoading, nav]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    const payload = {
      user_id: user.id,
      display_name: displayName.trim() || null,
      programs_held: profile?.programs_held ?? [],
      telegram_chat_id: telegram.trim() || null,
    };
    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setProfile({
      user_id: user.id,
      display_name: payload.display_name,
      programs_held: payload.programs_held,
      telegram_chat_id: payload.telegram_chat_id,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-noir">
        <Header />
        <main className="mx-auto max-w-3xl px-6 py-16">
          <div className="h-8 w-48 rounded-md bg-card/80 animate-pulse mb-10" />
          <SkeletonRows rows={3} height="h-28" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="font-display text-3xl">Your account</h1>
            <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
          </div>
          <Link
            to="/watchlists"
            className="text-xs uppercase tracking-widest text-gold hover:underline"
          >
            Watchlists →
          </Link>
        </div>

        <form onSubmit={onSave} className="mt-10 space-y-10">
          <section>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Profile</h2>
            <div className="mt-4">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Display name
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={120}
                className="mt-1 w-full max-w-md rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-gold/60"
              />
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
              Your points balances
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Add the loyalty programs you hold and how many points you have. We'll value the total
              in AUD on your homepage and use it to rank award deals.
            </p>
            <div className="mt-5">
              <BalancesEditor />
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
              Telegram alerts
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Paste your Telegram chat ID to receive alerts when watchlists hit. Get yours by
              messaging @userinfobot on Telegram.
            </p>
            <input
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="e.g. 123456789"
              className="mt-3 w-full max-w-md rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-gold/60"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                disabled={testing || !profile?.telegram_chat_id}
                onClick={async () => {
                  setTesting(true);
                  setTestMsg(null);
                  try {
                    const res = await sendTest({ data: {} });
                    if (res.ok)
                      setTestMsg({ kind: "ok", text: "Test message sent — check Telegram." });
                    else setTestMsg({ kind: "err", text: res.error });
                  } catch (e) {
                    setTestMsg({ kind: "err", text: (e as Error).message });
                  } finally {
                    setTesting(false);
                  }
                }}
                className="text-xs uppercase tracking-widest px-4 py-2 rounded-full hairline text-gold hover:bg-gold/10 transition disabled:opacity-50"
              >
                {testing ? "Sending…" : "Send test alert"}
              </button>
              {!profile?.telegram_chat_id && (
                <span className="text-xs text-muted-foreground">
                  Save your chat ID first to enable test.
                </span>
              )}
              {testMsg && (
                <span
                  className={`text-xs ${testMsg.kind === "ok" ? "text-gold" : "text-destructive"}`}
                >
                  {testMsg.text}
                </span>
              )}
            </div>
          </section>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && <span className="text-sm text-gold">Saved.</span>}
          </div>
        </form>
        <TransferPlanner />
        {isAdmin && <AdminCronSecretSection />}
        {isAdmin && <AdminPollerRunsSection />}
      </main>
    </div>
  );
}

function AdminCronSecretSection() {
  const fetchMeta = useServerFn(getCronSecretMeta);
  const rotate = useServerFn(rotateCronSecret);
  const [meta, setMeta] = useState<{ exists: boolean; updatedAt: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchMeta({ data: {} });
        if (res.ok) setMeta({ exists: res.exists, updatedAt: res.updatedAt });
        else setErr(res.error);
      } catch (e) {
        setErr((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchMeta]);

  async function doRotate() {
    setWorking(true);
    setErr(null);
    try {
      const res = await rotate({ data: {} });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setRevealed(res.secret);
      setMeta({ exists: true, updatedAt: res.updatedAt });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setWorking(false);
      setConfirming(false);
    }
  }

  async function copy() {
    if (!revealed) return;
    await navigator.clipboard.writeText(revealed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="mt-16 pt-10 border-t border-border">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Admin · CRON secret
        </h2>
        <span className="text-xs uppercase tracking-widest text-gold/70">Admin only</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2 max-w-prose">
        Rotates the shared secret used by the scheduled poller to authenticate against{" "}
        <code className="text-xs">/api/public/hooks/poll-watchlists</code>. The new value is written
        to the locked-down config table immediately. You must then paste the same value into the
        Lovable Cloud secret <code className="text-xs">CRON_SECRET</code> so runtime code stays in
        sync.
      </p>

      <div className="mt-5 text-xs text-muted-foreground">
        {loading
          ? "Loading…"
          : meta?.exists
            ? `Last rotated ${meta.updatedAt ? new Date(meta.updatedAt).toLocaleString() : "—"}`
            : "No CRON_SECRET stored yet."}
      </div>

      {err && <div className="mt-3 text-sm text-destructive">{err}</div>}

      {!revealed && (
        <div className="mt-5 flex items-center gap-3">
          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={loading}
              className="text-xs uppercase tracking-widest px-4 py-2 rounded-full hairline text-gold hover:bg-gold/10 transition disabled:opacity-50"
            >
              Rotate CRON_SECRET
            </button>
          ) : (
            <>
              <span className="text-xs text-muted-foreground">
                This invalidates the current secret immediately. Continue?
              </span>
              <button
                type="button"
                onClick={doRotate}
                disabled={working}
                className="text-xs uppercase tracking-widest px-4 py-2 rounded-full bg-gold text-gold-foreground hover:opacity-90 transition disabled:opacity-60"
              >
                {working ? "Rotating…" : "Yes, rotate"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={working}
                className="text-xs uppercase tracking-widest px-4 py-2 rounded-full hairline text-muted-foreground hover:text-foreground transition"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}

      {revealed && (
        <div className="mt-6 rounded-lg border border-gold/40 bg-gold/5 p-5">
          <div className="text-xs uppercase tracking-widest text-gold">New secret — shown once</div>
          <div className="mt-3 font-mono text-xs break-all bg-background border border-border rounded p-3">
            {revealed}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={copy}
              className="text-xs uppercase tracking-widest px-4 py-2 rounded-full bg-gold text-gold-foreground hover:opacity-90 transition"
            >
              {copied ? "Copied ✓" : "Copy to clipboard"}
            </button>
            <button
              type="button"
              onClick={() => setRevealed(null)}
              className="text-xs uppercase tracking-widest px-4 py-2 rounded-full hairline text-muted-foreground hover:text-foreground transition"
            >
              Done
            </button>
          </div>
          <ol className="mt-5 space-y-2 text-xs text-muted-foreground list-decimal list-inside">
            <li>Copy the value above.</li>
            <li>
              Open Lovable Cloud → Secrets, find <code>CRON_SECRET</code>, and paste the new value
              to update it.
            </li>
            <li>
              The scheduled poller will pick up the new secret on its next run (within 15 minutes).
              No redeploy needed.
            </li>
          </ol>
          <p className="mt-4 text-xs text-destructive/80">
            Until you update the Cloud secret, runtime code that reads{" "}
            <code>process.env.CRON_SECRET</code> will be out of sync with the database.
          </p>
        </div>
      )}
    </section>
  );
}

type PollerRun = {
  id: string;
  started_at: string;
  finished_at: string | null;
  processed: number;
  alerts_sent: number;
  errors: Array<{ message?: string; stage?: string }> | null;
  duration_ms: number | null;
  ok: boolean;
};

function AdminPollerRunsSection() {
  const fetchRuns = useServerFn(listPollerRuns);
  const [runs, setRuns] = useState<PollerRun[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    setErr(null);
    try {
      const res = await fetchRuns({ data: { limit: 20 } });
      if (!res.ok) setErr(res.error);
      else setRuns(res.runs as PollerRun[]);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const last = runs?.[0];
  const failedCount = runs?.filter((r) => !r.ok).length ?? 0;

  return (
    <section className="mt-16 pt-10 border-t border-border">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Admin · Poller observability
        </h2>
        <button
          type="button"
          onClick={load}
          disabled={refreshing}
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <p className="text-sm text-muted-foreground mt-2 max-w-prose">
        Last 20 scheduled runs of the watchlist poller. Cron fires every 15 minutes.
      </p>

      {err && <div className="mt-3 text-sm text-destructive">{err}</div>}

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat
          label="Last run"
          value={
            last
              ? new Date(last.started_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"
          }
          tone={last ? (last.ok ? "ok" : "err") : "muted"}
        />
        <Stat
          label="Alerts sent (last run)"
          value={last ? String(last.alerts_sent) : "—"}
          tone="muted"
        />
        <Stat
          label="Failed runs (last 20)"
          value={String(failedCount)}
          tone={failedCount > 0 ? "err" : "ok"}
        />
      </div>

      <div className="mt-6 rounded-lg border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-background/40 text-muted-foreground uppercase tracking-widest text-xs">
            <tr>
              <th className="text-left px-3 py-2">Started</th>
              <th className="text-right px-3 py-2">Watchlists</th>
              <th className="text-right px-3 py-2">Alerts</th>
              <th className="text-right px-3 py-2">Duration</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {!runs ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : runs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  No runs recorded yet. The cron job runs every 15 minutes.
                </td>
              </tr>
            ) : (
              runs.map((r) => {
                const errMsgs = (r.errors ?? []).map((e) => e.message).filter(Boolean) as string[];
                return (
                  <tr
                    key={r.id}
                    className="border-t border-border-soft hover:bg-background/40 transition-colors tabular-nums"
                  >
                    <td className="px-3 py-2 font-mono text-xs">
                      {new Date(r.started_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">{r.processed}</td>
                    <td className="px-3 py-2 text-right">{r.alerts_sent}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {r.duration_ms != null ? `${r.duration_ms}ms` : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {r.ok ? (
                        <span className="text-emerald-400">OK</span>
                      ) : (
                        <span className="text-destructive" title={errMsgs.join("\n")}>
                          {errMsgs.length} error{errMsgs.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ok" | "err" | "muted";
}) {
  const toneCls =
    tone === "ok" ? "text-emerald-400" : tone === "err" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-background/40 px-4 py-3">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-display text-xl mt-1 ${toneCls}`}>{value}</div>
    </div>
  );
}

function BalancesEditor() {
  const { balances, refetch, loading } = useUserBalances();
  const { user } = useAuth();
  const [programId, setProgramId] = useState<string>(PROGRAMS[0]?.id ?? "");
  const [amount, setAmount] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const heldIds = new Set(balances.map((b) => b.program_id));
  const available = PROGRAMS.filter((p) => !heldIds.has(p.id));

  // Keep the dropdown selection valid as the available list changes.
  useEffect(() => {
    if (available.length && !available.some((p) => p.id === programId)) {
      setProgramId(available[0].id);
    }
  }, [available, programId]);

  async function addBalance(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setErr(null);
    const program = PROGRAMS.find((p) => p.id === programId);
    if (!program) {
      setErr("Pick a program.");
      return;
    }
    const value = Number.parseInt(amount.replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(value) || value < 0 || value > 50_000_000) {
      setErr("Enter a valid points balance (0–50,000,000).");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("user_program_balances").insert({
      user_id: user.id,
      program_id: program.id,
      program_name: program.name,
      balance: value,
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setAmount("");
    refetch();
  }

  async function updateBalance(id: string, value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 50_000_000) return;
    await supabase.from("user_program_balances").update({ balance: value }).eq("id", id);
    refetch();
  }

  async function removeBalance(id: string) {
    await supabase.from("user_program_balances").delete().eq("id", id);
    refetch();
  }

  return (
    <div className="space-y-5">
      {loading ? (
        <SkeletonRows rows={2} height="h-14" />
      ) : balances.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          No balances yet. Add your first program below.
        </div>
      ) : (
        <ul className="divide-y divide-border-soft border border-border rounded-lg overflow-hidden">
          {balances.map((b) => {
            const p = PROGRAMS.find((x) => x.id === b.program_id);
            return (
              <li key={b.id} className="flex items-center gap-3 px-4 py-3 bg-card/40">
                <span
                  className="size-7 shrink-0 rounded-full grid place-items-center font-display text-xs"
                  style={{
                    background: `${p?.accent ?? "#c9a84c"}22`,
                    color: p?.accent ?? "#c9a84c",
                    border: `1px solid ${p?.accent ?? "#c9a84c"}55`,
                  }}
                >
                  {p?.short ?? "•"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{b.program_name}</div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    {p?.alliance ?? "Loyalty program"}
                  </div>
                </div>
                <input
                  type="number"
                  min={0}
                  max={50_000_000}
                  defaultValue={b.balance}
                  onBlur={(e) => {
                    const v = Number.parseInt(e.target.value, 10);
                    if (Number.isFinite(v) && v !== b.balance) updateBalance(b.id, v);
                  }}
                  className="w-32 rounded-md bg-background border border-border px-2 py-1.5 text-sm text-right focus:outline-none focus:border-gold/60"
                />
                <button
                  type="button"
                  onClick={() => removeBalance(b.id)}
                  className="text-xs uppercase tracking-widest text-muted-foreground hover:text-destructive transition"
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {available.length > 0 ? (
        <form onSubmit={addBalance} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Program
            </label>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="mt-1 w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-gold/60"
            >
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Points
            </label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              placeholder="125000"
              className="mt-1 w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-gold/60"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="text-xs uppercase tracking-widest px-4 py-2.5 rounded-full hairline text-gold hover:bg-gold/10 transition disabled:opacity-60"
          >
            {busy ? "Adding…" : "+ Add program"}
          </button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">
          You've added every supported program. Edit balances above as they change.
        </p>
      )}

      {err && <div className="text-sm text-destructive">{err}</div>}
    </div>
  );
}
