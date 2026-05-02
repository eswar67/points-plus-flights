import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { useAuth } from "@/hooks/useAuth";
import { PROGRAMS } from "@/lib/programs";
import { useServerFn } from "@tanstack/react-start";
import { sendTestTelegramAlert } from "@/server/alerts/alerts.functions";

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
      </main>
    </div>
  );
}