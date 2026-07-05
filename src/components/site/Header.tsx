import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth, signOut } from "@/hooks/useAuth";
import { LogoMark } from "./Logo";

export function Header() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <LogoMark className="size-8" />
          <span className="font-display font-semibold tracking-tight text-lg">
            Aureum
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition">Search</Link>
          <Link to="/programs" className="hover:text-foreground transition">Programs</Link>
          {user && (
            <Link to="/watchlists" className="hover:text-foreground transition">Watchlists</Link>
          )}
          {user && (
            <Link to="/requests" className="hover:text-foreground transition">Requests</Link>
          )}
          <Link to="/how-it-works" className="hover:text-foreground transition">How it works</Link>
          <Link to="/pricing" className="hover:text-foreground transition">Pricing</Link>
          <Link to="/faq" className="hover:text-foreground transition">FAQ</Link>
          <Link to="/book" className="hover:text-foreground transition">Book</Link>
        </nav>
        {loading ? (
          <div className="h-8 w-20" />
        ) : user ? (
          <div className="flex items-center gap-2">
            <Link
              to="/account"
              className="text-xs uppercase tracking-[0.2em] px-4 py-2 rounded-full hairline text-gold hover:bg-gold/10 transition"
            >
              Account
            </Link>
            <button
              onClick={async () => { await signOut(); nav({ to: "/" }); }}
              className="text-xs uppercase tracking-[0.2em] px-3 py-2 rounded-full text-muted-foreground hover:text-foreground transition"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="text-xs uppercase tracking-[0.2em] px-4 py-2 rounded-full hairline text-gold hover:bg-gold/10 transition"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
