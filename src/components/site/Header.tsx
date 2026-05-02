import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/50">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-gradient-to-br from-gold-soft to-gold shadow-gold" />
          <span className="font-display font-semibold tracking-tight text-lg">
            Aureum
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition">Search</Link>
          <Link to="/programs" className="hover:text-foreground transition">Programs</Link>
          <Link to="/how-it-works" className="hover:text-foreground transition">How it works</Link>
        </nav>
        <button className="text-xs uppercase tracking-[0.2em] px-4 py-2 rounded-full hairline text-gold hover:bg-gold/10 transition">
          Sign in
        </button>
      </div>
    </header>
  );
}
