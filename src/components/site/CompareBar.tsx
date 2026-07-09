import { GitCompare, X } from "lucide-react";
import { useState } from "react";
import { COMPARE_MAX, useCompare } from "@/hooks/useCompare";
import { useUserBalances } from "@/hooks/useUserBalances";
import { CompareModal } from "./CompareModal";

/**
 * Floating bar (bottom-left) that surfaces the current comparison selection
 * and opens the side-by-side modal. Complements the Shortlist dock on the
 * right without overlapping it.
 */
export function CompareBar() {
  const { items, remove, clear } = useCompare();
  const { byProgramId } = useUserBalances();
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  const canCompare = items.length >= 2;

  return (
    <>
      <div className="fixed bottom-5 left-5 z-40 animate-fade-in">
        <div className="flex items-center gap-2 rounded-full border border-gold/50 bg-card/95 backdrop-blur px-3 py-2 shadow-elevated">
          <div className="flex items-center gap-1.5 pl-1">
            <GitCompare className="size-4 text-gold" />
            <span className="text-xs uppercase tracking-widest text-foreground">
              Compare
            </span>
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-gold text-gold-foreground text-[10px] font-bold tabular-nums">
              {items.length}/{COMPARE_MAX}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={!canCompare}
            className={`text-xs uppercase tracking-widest px-3 py-1.5 rounded-full transition ${
              canCompare
                ? "bg-gold text-gold-foreground hover:opacity-90"
                : "bg-muted/40 text-muted-foreground cursor-not-allowed"
            }`}
            title={canCompare ? "Open side-by-side comparison" : "Select at least 2 to compare"}
          >
            {canCompare ? "Compare now" : "Pick 1 more"}
          </button>
          <button
            type="button"
            onClick={clear}
            className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
            aria-label="Clear comparison"
            title="Clear"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {open && (
        <CompareModal
          items={items}
          onClose={() => setOpen(false)}
          onRemove={(id) => {
            remove(id);
            // Auto-close when only one left after removal
            if (items.length - 1 <= 1) setOpen(false);
          }}
          balances={byProgramId}
        />
      )}
    </>
  );
}