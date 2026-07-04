import { LogoMark } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/50 mt-32">
      <div className="mx-auto max-w-7xl px-6 py-12 flex flex-col md:flex-row gap-6 items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <LogoMark className="size-6" />
          <span className="font-display text-foreground">Aureum</span>
          <span className="opacity-60">— premium award travel.</span>
        </div>
        <p className="opacity-70">© {new Date().getFullYear()} Aureum. Award availability shown for demo purposes.</p>
      </div>
    </footer>
  );
}
