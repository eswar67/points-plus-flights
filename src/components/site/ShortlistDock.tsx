import { Bookmark, Trash2, X, Plane } from "lucide-react";
import { useState } from "react";
import { useShortlist } from "@/hooks/useShortlist";
import { PROGRAMS } from "@/lib/programs";

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

/**
 * Persistent, floating access to the user's saved-itinerary shortlist.
 * Appears in the bottom-right whenever at least one itinerary is saved.
 */
export function ShortlistDock() {
  const { items, remove, clear } = useShortlist();
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-card/95 backdrop-blur px-4 py-2.5 shadow-elevated hover:bg-gold/10 transition animate-fade-in"
        aria-label="Open shortlist"
      >
        <Bookmark className="size-4 text-gold" />
        <span className="text-xs uppercase tracking-widest text-foreground">Shortlist</span>
        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-gold text-gold-foreground text-[10px] font-bold tabular-nums">
          {items.length}
        </span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-label="Saved itineraries"
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-card border-l border-border shadow-elevated flex flex-col animate-slide-in-right"
          >
            <header className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <Bookmark className="size-4 text-gold" />
              <h2 className="font-display text-lg">Your shortlist</h2>
              <span className="text-xs uppercase tracking-widest text-muted-foreground tabular-nums">
                {items.length} saved
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto rounded-full p-1.5 hover:bg-muted/50 transition"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((it) => {
                const a = it.award;
                const p = PROGRAMS.find((x) => x.id === a.programId);
                const accent = p?.accent ?? "#c9a84c";
                return (
                  <div
                    key={it.id}
                    className="group rounded-lg border border-border bg-background/60 hover:border-border-strong p-4 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-display tabular-nums">{a.from}</span>
                          <Plane className="size-3 text-gold rotate-45" />
                          <span className="font-display tabular-nums">{a.to}</span>
                          <span className="text-xs uppercase tracking-widest text-gold/80 ml-1">
                            {a.cabin}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {a.carrier}
                          {a.flightNo ? ` · ${a.flightNo}` : ""} · {fmtDate(a.depart)}
                        </div>
                        <div className="mt-2 inline-flex items-center gap-1.5 text-xs">
                          <span className="size-1.5 rounded-full" style={{ background: accent }} />
                          <span className="text-muted-foreground">{p?.name ?? a.programName}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(it.id)}
                        className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                        aria-label="Remove from shortlist"
                        title="Remove"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border-soft flex items-baseline justify-between">
                      <div className="font-display text-xl text-gold-gradient tabular-nums">
                        {a.miles.toLocaleString()}
                        <span className="text-xs text-muted-foreground font-normal ml-1">pts</span>
                      </div>
                      {a.taxesUsd > 0 && (
                        <div className="text-xs text-muted-foreground tabular-nums">
                          + A${Math.round(a.taxesUsd * 1.55)} taxes
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <footer className="border-t border-border p-4">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Clear your entire shortlist?")) clear();
                }}
                className="w-full inline-flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-destructive py-2 transition"
              >
                <Trash2 className="size-3.5" />
                Clear shortlist
              </button>
            </footer>
          </aside>
        </>
      )}
    </>
  );
}
