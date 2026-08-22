import { Link } from "@tanstack/react-router";
import { LogoMark } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border-soft mt-32">
      <div className="mx-auto max-w-7xl px-6 py-12 flex flex-col md:flex-row gap-6 items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <LogoMark className="size-6" />
          <span className="font-display text-foreground">Miles Expert</span>
          <span className="opacity-60">— award seat search.</span>
        </div>
        <nav className="flex items-center gap-5 text-xs uppercase tracking-widest">
          <Link to="/calculator" className="hover:text-gold transition">
            Calculator
          </Link>
          <Link to="/awards" className="hover:text-gold transition">
            Route guides
          </Link>
          <Link to="/how-it-works" className="hover:text-gold transition">
            How it works
          </Link>
          <Link to="/faq" className="hover:text-gold transition">
            FAQ
          </Link>
        </nav>
        <p className="opacity-70">
          © {new Date().getFullYear()} Miles Expert. Availability via seats.aero, refreshed
          continuously.
        </p>
      </div>
    </footer>
  );
}
