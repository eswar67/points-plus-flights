import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { useAuth } from "@/hooks/useAuth";
import { PROGRAMS } from "@/lib/programs";
import { useServerFn } from "@tanstack/react-start";
import { sendTestTelegramAlert } from "@/server/alerts/alerts.functions";
import {
  getCronSecretMeta,
  rotateCronSecret,
} from "@/server/admin/cron-secret.functions";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — Aureum" },
      { name: "robots", content: "noindex" },
    ],
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
  const [programs, setPrograms] = useState<Set<string>>(new Set());
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
        setPrograms(new Set(data.programs_held ?? []));
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

  function toggleProgram(id: string) {
    setPrograms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    const payload = {
      user_id: user.id,
      display_name: displayName.trim() || null,
      programs_held: Array.from(programs),
      telegram_chat_id: telegram.trim() || null,
    };
    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-noir">
        <Header />
        <main className="mx-auto max-w-3xl px-6 py-16 text-sm text-muted-foreground">Loading…</main>
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
          <Link to="/watchlists" className="text-xs uppercase tracking-[0.2em] text-gold hover:underline">
            Watchlists →
          </Link>
        </div>

        <form onSubmit={onSave} className="mt-10 space-y-10">
          <section>
            <h2 className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Profile</h2>
            <div className="mt-4">
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Display name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={120}
                className="mt-1 w-full max-w-md rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-gold/60"
              />
            </div>
          </section>

          <section>
            <h2 className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Programs you hold</h2>
            <p className="text-sm text-muted-foreground mt-2">
              We use this to rank deals by what you can actually book — and to choose the right transfer partners.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROGRAMS.map((p) => {
                const on = programs.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProgram(p.id)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ${
                      on
                        ? "border-gold/60 bg-gold/5"
                        : "border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <div>
                      <div className="text-sm">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">{p.alliance}</div>
                    </div>
                    <div className={`text-[10px] uppercase tracking-[0.2em] ${on ? "text-gold" : "text-muted-foreground"}`}>
                      {on ? "Held" : "Add"}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Telegram alerts</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Paste your Telegram chat ID to receive alerts when watchlists hit. Get yours by messaging @userinfobot on Telegram.
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
                    if (res.ok) setTestMsg({ kind: "ok", text: "Test message sent — check Telegram." });
                    else setTestMsg({ kind: "err", text: res.error });
                  } catch (e) {
                    setTestMsg({ kind: "err", text: (e as Error).message });
                  } finally {
                    setTesting(false);
                  }
                }}
                className="text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-full hairline text-gold hover:bg-gold/10 transition disabled:opacity-50"
              >
                {testing ? "Sending…" : "Send test alert"}
              </button>
              {!profile?.telegram_chat_id && (
                <span className="text-[11px] text-muted-foreground">Save your chat ID first to enable test.</span>
              )}
              {testMsg && (
                <span className={`text-[11px] ${testMsg.kind === "ok" ? "text-gold" : "text-destructive"}`}>
                  {testMsg.text}
                </span>
              )}
            </div>
          </section>

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="text-xs uppercase tracking-[0.18em] px-6 py-3 rounded-full bg-gold text-gold-foreground hover:opacity-90 transition disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && <span className="text-sm text-gold">Saved.</span>}
          </div>
        </form>
        {isAdmin && <AdminCronSecretSection />}
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
        <h2 className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Admin · CRON secret
        </h2>
        <span className="text-[10px] uppercase tracking-[0.2em] text-gold/70">Admin only</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2 max-w-prose">
        Rotates the shared secret used by the scheduled poller to authenticate against{" "}
        <code className="text-xs">/api/public/hooks/poll-watchlists</code>. The new value is
        written to the locked-down config table immediately. You must then paste the same
        value into the Lovable Cloud secret <code className="text-xs">CRON_SECRET</code> so
        runtime code stays in sync.
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
              className="text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-full hairline text-gold hover:bg-gold/10 transition disabled:opacity-50"
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
                className="text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-full bg-gold text-gold-foreground hover:opacity-90 transition disabled:opacity-60"
              >
                {working ? "Rotating…" : "Yes, rotate"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={working}
                className="text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-full hairline text-muted-foreground hover:text-foreground transition"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}

      {revealed && (
        <div className="mt-6 rounded-lg border border-gold/40 bg-gold/5 p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-gold">
            New secret — shown once
          </div>
          <div className="mt-3 font-mono text-xs break-all bg-background border border-border rounded p-3">
            {revealed}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={copy}
              className="text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-full bg-gold text-gold-foreground hover:opacity-90 transition"
            >
              {copied ? "Copied ✓" : "Copy to clipboard"}
            </button>
            <button
              type="button"
              onClick={() => setRevealed(null)}
              className="text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-full hairline text-muted-foreground hover:text-foreground transition"
            >
              Done
            </button>
          </div>
          <ol className="mt-5 space-y-2 text-xs text-muted-foreground list-decimal list-inside">
            <li>Copy the value above.</li>
            <li>
              Open Lovable Cloud → Secrets, find <code>CRON_SECRET</code>, and paste the new
              value to update it.
            </li>
            <li>
              The scheduled poller will pick up the new secret on its next run (within 15
              minutes). No redeploy needed.
            </li>
          </ol>
          <p className="mt-4 text-[11px] text-destructive/80">
            Until you update the Cloud secret, runtime code that reads{" "}
            <code>process.env.CRON_SECRET</code> will be out of sync with the database.
          </p>
        </div>
      )}
    </section>
  );
}