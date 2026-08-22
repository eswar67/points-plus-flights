import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { LogoMark } from "./Logo";

const NAV_LINKS = [
  { to: "/", label: "Search", authed: false },
  { to: "/awards", label: "Route guide", authed: false },
  { to: "/calculator", label: "Calculator", authed: false },
  { to: "/how-it-works", label: "How it works", authed: false },
  { to: "/faq", label: "FAQ", authed: false },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const links = NAV_LINKS;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border-soft">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <LogoMark className="size-8" />
          <span className="font-display font-semibold tracking-tight text-lg">Miles Expert</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-foreground transition">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="md:hidden size-10 grid place-items-center rounded-lg border border-border text-muted-foreground hover:text-gold hover:border-border-strong transition"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden border-t border-border-soft bg-background/95 backdrop-blur-xl px-6 py-4">
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
        </nav>
      )}
    </header>
  );
}
