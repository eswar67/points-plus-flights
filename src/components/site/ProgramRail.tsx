import { PROGRAMS } from "@/lib/programs";

export function ProgramRail() {
  return (
    <div className="border-y border-border/60 bg-card/30">
      <div className="mx-auto max-w-7xl px-6 py-5 flex items-center gap-8 overflow-x-auto">
        <span className="text-xs uppercase tracking-widest text-muted-foreground whitespace-nowrap">
          Programs we support
        </span>
        {PROGRAMS.map((p) => (
          <div
            key={p.id}
            className="group flex items-center gap-2.5 whitespace-nowrap text-sm text-muted-foreground hover:text-foreground transition"
          >
            <span
              className="size-7 rounded-full grid place-items-center font-display text-xs font-semibold transition group-hover:scale-110"
              style={{
                background: `${p.accent}1f`,
                color: p.accent,
                border: `1px solid ${p.accent}55`,
              }}
            >
              {p.short}
            </span>
            {p.name}
          </div>
        ))}
      </div>
    </div>
  );
}
