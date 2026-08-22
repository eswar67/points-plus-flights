import { useEffect, useRef, useState } from "react";
import { Check, Clock, Download, ExternalLink } from "lucide-react";
import type { AwardItinerary } from "@/lib/awards/types";
import { buildPlaybook } from "@/lib/playbook";
import { useUserBalances } from "@/hooks/useUserBalances";

export function PlaybookDrawer({ award, onClose }: { award: AwardItinerary; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [downloaded, setDownloaded] = useState(false);

  // Dialog semantics: focus on open, Escape closes, Tab cycles inside the
  // panel (hard trap), and focus returns to the opener on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [onClose]);

  const { byProgramId } = useUserBalances();
  const playbook = buildPlaybook(award, byProgramId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/80 backdrop-blur-sm animate-backdrop-in"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Redemption playbook ${award.from} to ${award.to}`}
        tabIndex={-1}
        className="relative w-full md:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-lg md:rounded-lg border border-gold/20 bg-card shadow-gold animate-drawer-up focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-gold">Redemption playbook</div>
            <div className="font-display text-lg mt-0.5">
              {award.from} → {award.to} · {award.cabin}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const lines = [
                `MILES EXPERT — REDEMPTION GUIDE`,
                `${award.from} -> ${award.to} · ${award.cabin} · ${award.depart?.slice(0, 10) ?? ""}`,
                `${award.miles.toLocaleString()} ${award.programName} points${award.taxesUsd ? ` + ~$${award.taxesUsd} taxes` : ""}`,
                ``,
                ...playbook.steps.flatMap((st, i) => [
                  `${i + 1}. ${st.title}`,
                  `   ${st.detail}`,
                  st.href ? `   Link: ${st.href}` : "",
                  ``,
                ]),
                playbook.riskNote ? `Note: ${playbook.riskNote}` : "",
                ``,
                `Award space changes fast — confirm availability before transferring points.`,
                `Generated ${new Date().toLocaleString()} · miles-expert.com`,
              ].filter(Boolean);
              const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `miles-expert-${award.from}-${award.to}-${award.cabin}.txt`;
              a.click();
              URL.revokeObjectURL(url);
              setDownloaded(true);
              setTimeout(() => setDownloaded(false), 2500);
            }}
            className="mr-3 inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5 text-[10px] uppercase tracking-widest text-gold hover:bg-gold/10 transition"
          >
            <Download className="size-3" />
            {downloaded ? "Saved" : "Download guide"}
          </button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">
            Close
          </button>
        </div>

        <div className="p-6">
          <FeasibilityBanner playbook={playbook} />
          {playbook.riskNote && (
            <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-300 px-4 py-3 text-sm">
              ⚠ {playbook.riskNote}
            </div>
          )}
          <ol className="mt-6 space-y-4">
            {playbook.steps.map((s, i) => (
              <li key={i} className="relative pl-10">
                <span className="absolute left-0 top-0.5 size-7 rounded-full grid place-items-center font-display text-xs bg-gold/15 text-gold border border-gold/30">
                  {i + 1}
                </span>
                <div className="font-display text-base">{s.title}</div>
                <p className="text-sm text-muted-foreground mt-1">{s.detail}</p>
                <div className="mt-2 flex items-center gap-3">
                  {s.href && s.cta && (
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest px-3 py-1.5 rounded-full bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 transition"
                    >
                      {s.cta} <ExternalLink className="size-3" />
                    </a>
                  )}
                  {s.etaMinutes !== undefined && s.kind !== "wait" && (
                    <span className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground">
                      <Clock className="size-3" /> ~
                      {s.etaMinutes < 60 ? `${s.etaMinutes}m` : `${Math.round(s.etaMinutes / 60)}h`}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function FeasibilityBanner({ playbook }: { playbook: ReturnType<typeof buildPlaybook> }) {
  if (playbook.feasible) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-emerald-300 px-4 py-3 text-sm flex items-center gap-2">
        <Check className="size-4" /> You have enough miles. Estimated time to ticket: under 10
        minutes.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-gold/30 bg-gold/5 text-gold px-4 py-3 text-sm">
      Short by {playbook.shortfall.toLocaleString()} miles. We'll route a transfer below.
    </div>
  );
}
