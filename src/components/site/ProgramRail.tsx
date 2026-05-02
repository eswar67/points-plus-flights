import { PROGRAMS } from "@/lib/programs";

export function ProgramRail() {
  return (
    <div className="border-y border-border/60 bg-card/30">
      <div className="mx-auto max-w-7xl px-6 py-6 flex items-center gap-10 overflow-x-auto">
        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground whitespace-nowrap">
          Connected programs
        </span>
        {PROGRAMS.map((p) => (
          <div key={p.id} className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground hover:text-foreground transition">
            <span className="size-1.5 rounded-full" style={{ background: p.accent }} />
            {p.name}
          </div>
        ))}
      </div>
    </div>
  );
}
