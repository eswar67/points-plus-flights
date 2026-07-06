import { useEffect, useState } from "react";
import { PROGRAMS } from "@/lib/programs";

const SCAN_ARC = "M 20 60 C 180 10, 420 10, 580 60";

/**
 * Search-in-flight state: a plane sweeps a route arc between two radar
 * beacons while the status line cycles through the programs being checked.
 */
export function SearchingState({ from, to }: { from: string; to: string }) {
  const airlinePrograms = PROGRAMS.filter((p) => p.alliance !== "Transferable");
  const [step, setStep] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = setInterval(() => setStep((s) => s + 1), 900);
    return () => clearInterval(id);
  }, []);

  const current = airlinePrograms[step % airlinePrograms.length];

  return (
    <div className="rounded-2xl border border-border bg-card/60 px-6 py-10">
      <div className="mx-auto max-w-xl">
        <svg viewBox="0 0 600 80" className="w-full" aria-hidden="true">
          <path
            d={SCAN_ARC}
            fill="none"
            stroke="var(--gold)"
            strokeOpacity="0.3"
            strokeWidth="1.2"
            strokeDasharray="3 6"
            strokeLinecap="round"
          />
          <circle cx="20" cy="60" r="3" fill="var(--gold)" />
          <circle
            cx="20" cy="60" r="7" fill="none" stroke="var(--gold)" strokeWidth="1"
            style={{ transformOrigin: "20px 60px", animation: "radar-ping 1.6s cubic-bezier(0,0,0.2,1) infinite" }}
          />
          <circle cx="580" cy="60" r="3" fill="var(--gold)" />
          <circle
            cx="580" cy="60" r="7" fill="none" stroke="var(--gold)" strokeWidth="1"
            style={{ transformOrigin: "580px 60px", animation: "radar-ping 1.6s cubic-bezier(0,0,0.2,1) 0.8s infinite" }}
          />
          <g
            style={{
              offsetPath: `path('${SCAN_ARC}')`,
              offsetRotate: "auto",
              animation: "scan-fly 2.4s ease-in-out infinite alternate",
            }}
          >
            <path
              d="M 0 0 L 12 4 L 0 8 L 3 4 Z"
              transform="translate(-6,-4)"
              fill="var(--gold-soft)"
              style={{ filter: "drop-shadow(0 0 4px rgba(201,168,76,0.9))" }}
            />
          </g>
        </svg>

        <div className="mt-6 flex items-center justify-between">
          <div className="font-display text-xl tracking-wider">{from}</div>
          <div className="text-center" aria-live="polite">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Scanning award space
            </div>
            <div className="mt-1 text-sm text-gold flex items-center justify-center gap-2">
              <span
                className="size-1.5 rounded-full"
                style={{ background: current.accent }}
              />
              {current.name}…
            </div>
          </div>
          <div className="font-display text-xl tracking-wider">{to}</div>
        </div>

        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-border/60 bg-background/40 animate-pulse"
              style={{ animationDelay: `${i * 180}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
