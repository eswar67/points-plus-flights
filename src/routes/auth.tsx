import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Header } from "@/components/site/Header";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or sign up — Miles Expert" },
      {
        name: "description",
        content:
          "Create an Miles Expert account to save watchlists and get alerts when great award seats open.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    redirect:
      typeof s.redirect === "string" && /^\/[a-zA-Z0-9\-/]*$/.test(s.redirect)
        ? s.redirect
        : undefined,
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { redirect } = Route.useSearch();
  const dest = redirect ?? "/account";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const errs: { email?: string; password?: string } = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Enter a valid email address, e.g. jane@example.com.";
    }
    if (password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Bounce already-authenticated users to /account
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: dest });
    });
  }, [nav, dest]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/account`,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        setInfo("Check your inbox to confirm your email, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: dest });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (!result.redirected) nav({ to: dest });
  }

  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <main className="mx-auto max-w-md px-6 py-20">
        <h1 className="font-display text-3xl">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {mode === "signin"
            ? "Sign in to manage watchlists and alerts."
            : "Save routes, set CPP thresholds, and get alerts the moment seats open."}
        </p>

        <button
          type="button"
          onClick={onGoogle}
          className="mt-8 w-full flex items-center justify-center gap-2 text-sm px-5 py-3 rounded-full bg-background border border-border hover:bg-muted/40 transition"
        >
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3C33.6 32.5 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.5 29.3 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5c11.3 0 20.5-9.2 20.5-20.5 0-1.4-.1-2.4-.3-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.5 29.3 4.5 24 4.5 16.2 4.5 9.5 9.1 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44.5c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.6 26.8 36.5 24 36.5c-5.2 0-9.6-3.4-11.2-8.1l-6.5 5C9.4 39.7 16.1 44.5 24 44.5z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.3 5.3C41 35 44.5 30 44.5 24c0-1.4-.1-2.4-.9-3.5z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
          <div className="flex-1 h-px bg-border" />
          or
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                Display name
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={120}
                className="mt-1 w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-gold/60"
              />
            </div>
          )}
          <div>
            <label
              htmlFor="auth-email"
              className="text-xs uppercase tracking-widest text-muted-foreground"
            >
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "auth-email-error" : undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((f) => ({ ...f, email: undefined }));
              }}
              className={`mt-1 w-full rounded-lg bg-background border px-3 py-2.5 text-sm focus:border-gold/60 ${fieldErrors.email ? "border-destructive/60" : "border-border"}`}
            />
            {fieldErrors.email && (
              <p id="auth-email-error" role="alert" className="mt-1.5 text-xs text-destructive">
                {fieldErrors.email}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="auth-password"
              className="text-xs uppercase tracking-widest text-muted-foreground"
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={8}
              value={password}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "auth-password-error" : "auth-password-help"}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((f) => ({ ...f, password: undefined }));
              }}
              className={`mt-1 w-full rounded-lg bg-background border px-3 py-2.5 text-sm focus:border-gold/60 ${fieldErrors.password ? "border-destructive/60" : "border-border"}`}
            />
            {fieldErrors.password ? (
              <p id="auth-password-error" role="alert" className="mt-1.5 text-xs text-destructive">
                {fieldErrors.password}
              </p>
            ) : (
              mode === "signup" && (
                <p id="auth-password-help" className="mt-1.5 text-xs text-muted-foreground">
                  At least 8 characters.
                </p>
              )
            )}
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          {info && <div className="text-sm text-gold">{info}</div>}
          <button type="submit" disabled={loading} className="w-full btn btn-primary">
            {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="mt-6 text-sm text-muted-foreground text-center">
          {mode === "signin" ? (
            <>
              New here?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setInfo(null);
                }}
                className="text-gold hover:underline"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setInfo(null);
                }}
                className="text-gold hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Concierge agent?{" "}
          <Link to="/agent-login" className="text-gold hover:underline">
            Agent sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
