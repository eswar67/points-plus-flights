import { ArrowRight, Clock } from "lucide-react";
import type { RecentSearch } from "@/hooks/useRecentSearches";
import { AIRPORTS } from "@/lib/airports";

function cityFor(code: string): string {
  return AIRPORTS.find((a) => a.code === code)?.city ?? code;
}

export function RecentSearches({
  items,
  onPick,
  onClear,
}: {
  items: RecentSearch[];
  onPick: (r: RecentSearch) => void;
  onClear: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Clock className="size-3.5 text-muted-foreground" />
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Recent searches
        </span>
        <button
          type="button"
          onClick={onClear}
          className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition"
        >
          Clear
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((r) => (
          <button
            key={`${r.from}-${r.to}-${r.cabin}-${r.at}`}
            type="button"
            onClick={() => onPick(r)}
            className="group shrink-0 inline-flex items-center gap-2 rounded-full border border-border-soft hover:border-gold/60 bg-card/60 hover:bg-gold/5 px-3.5 py-2 text-xs transition"
          >
            <span className="font-display text-sm tabular-nums">{r.from}</span>
            <ArrowRight className="size-3 text-gold opacity-70 group-hover:translate-x-0.5 transition" />
            <span className="font-display text-sm tabular-nums">{r.to}</span>
            <span className="text-muted-foreground/80 hidden sm:inline">· {cityFor(r.to)}</span>
            <span className="text-[10px] uppercase tracking-widest text-gold/80 pl-1 border-l border-border-soft ml-1">
              {r.cabin}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

RecentSearches.displayName = "RecentSearches";
