import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useAuth, signOut } from "@/hooks/useAuth";
import { LogoMark } from "./Logo";

const NAV_LINKS = [
  { to: "/", label: "Search", authed: false },
  { to: "/programs", label: "Programs", authed: false },
  { to: "/watchlists", label: "Watchlists", authed: true },
  { to: "/requests", label: "Requests", authed: true },
  { to: "/how-it-works", label: "How it works", authed: false },
  { to: "/pricing", label: "Pricing", authed: false },
  { to: "/faq", label: "FAQ", authed: false },
  { to: "/book", label: "Book", authed: false },
] as const;

export function Header() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const links = NAV_LINKS.filter((l) => !l.authed || user);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <LogoMark className="size-8" />
          <span className="font-display font-semibold tracking-tight text-lg">
            Aureum
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-foreground transition">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-8 w-20" />
          ) : user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/account"
                className="text-xs uppercase tracking-widest px-4 py-2 rounded-full hairline text-gold hover:bg-gold/10 transition"
              >
                Account
              </Link>
              <button
                onClick={async () => { await signOut(); nav({ to: "/" }); }}
                className="text-xs uppercase tracking-widest px-3 py-2 rounded-full text-muted-foreground hover:text-foreground transition"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="hidden md:inline-block text-xs uppercase tracking-widest px-4 py-2 rounded-full hairline text-gold hover:bg-gold/10 transition"
            >
              Sign in
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="md:hidden size-10 grid place-items-center rounded-lg border border-border text-muted-foreground hover:text-gold hover:border-gold/40 transition"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-6 py-4">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm text-muted-foreground hover:text-gold transition"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/account"
                  onClick={() => setOpen(false)}
                  className="text-xs uppercase tracking-widest px-4 py-2 rounded-full hairline text-gold hover:bg-gold/10 transition"
                >
                  Account
                </Link>
                <button
                  onClick={async () => { setOpen(false); await signOut(); nav({ to: "/" }); }}
                  className="text-xs uppercase tracking-widest px-3 py-2 rounded-full text-muted-foreground hover:text-foreground transition"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="text-xs uppercase tracking-widest px-4 py-2 rounded-full hairline text-gold hover:bg-gold/10 transition"
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
