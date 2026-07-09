import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";

export const Route = createFileRoute("/agent-login")({
  head: () => ({
    meta: [
      { title: "Agent sign in — Miles Expert" },
      { name: "description", content: "Concierge agent access for Miles Expert award booking queue." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AgentLogin,
});

function AgentLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    nav({ to: "/concierge" });
  }

  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <main className="mx-auto max-w-md px-6 py-24">
        <h1 className="font-display text-3xl">Agent sign in</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Restricted access. Concierge agents only.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-gold/60"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-gold/60"
            />
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-xs uppercase tracking-widest px-5 py-3 rounded-full bg-gold text-gold-foreground hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>
    </div>
  );
}
