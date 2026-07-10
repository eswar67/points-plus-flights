import { useEffect, useLayoutEffect, useState } from "react";

const STORAGE_KEY = "me:walkthrough-seen";

type Step = {
  target: string; // data-tour attribute value
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    target: "from",
    title: "1. Where are you flying from?",
    body:
      "Type a city or 3-letter airport code — SYD, MEL, LAX. Not sure? Just pick your nearest airport, we'll do the heavy lifting.",
  },
  {
    target: "to",
    title: "2. Where do you dream of going?",
    body:
      "Same idea — a city or airport code. Try LHR for London, NRT for Tokyo, JFK for New York. No need to plan the full route; we search every airline.",
  },
  {
    target: "when",
    title: "3. Roughly when?",
    body:
      "Pick any date in the next year. We automatically search a 7-day window around it, so nearby dates count too — no exact date required.",
  },
  {
    target: "submit",
    title: "4. That's it — find my trip",
    body:
      "We'll scan every frequent-flyer program at once and rank the smartest ways to book with points. Results split by Economy, Business and First — with plain-English advice.",
  },
];

type Rect = { top: number; left: number; width: number; height: number };

function useTargetRect(selector: string, active: boolean): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  useLayoutEffect(() => {
    if (!active) return;
    let raf = 0;
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${selector}"]`);
      if (!el) {
        raf = requestAnimationFrame(measure);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top + window.scrollY,
        left: r.left + window.scrollX,
        width: r.width,
        height: r.height,
      });
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
    };
  }, [selector, active]);
  return rect;
}

export function SearchWalkthrough({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const rect = useTargetRect(step.target, open);

  useEffect(() => {
    if (!open) setI(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (i < STEPS.length - 1) setI(i + 1);
        else finish();
      }
      if (e.key === "ArrowLeft" && i > 0) setI(i - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i]);

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    onClose();
  }

  if (!open || !rect) return null;

  const PAD = 8;
  const highlight = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };

  // Position the tip card below the target, unless too close to the bottom of the viewport.
  const viewportBottom = window.scrollY + window.innerHeight;
  const spaceBelow = viewportBottom - (rect.top + rect.height);
  const showAbove = spaceBelow < 240;
  const tipTop = showAbove ? rect.top - 12 : rect.top + rect.height + 12;
  const tipTransform = showAbove ? "translateY(-100%)" : undefined;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Walkthrough">
      {/* Clickable backdrop outside the spotlight. The dimming itself comes from the
          spotlight ring's outer shadow so the highlighted field stays crisp and readable. */}
      <button
        type="button"
        aria-label="Skip walkthrough"
        onClick={finish}
        className="absolute inset-0 bg-transparent cursor-default"
        style={{ pointerEvents: "auto" }}
      />
      {/* Spotlight ring — outer shadow dims the rest of the page; the centre is fully transparent. */}
      <div
        aria-hidden
        className="absolute rounded-lg ring-2 ring-gold shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] pointer-events-none transition-all duration-300"
        style={{
          top: highlight.top - window.scrollY,
          left: highlight.left,
          width: highlight.width,
          height: highlight.height,
        }}
      />
      {/* Tip card */}
      <div
        className="absolute max-w-sm rounded-lg border border-gold/40 bg-card shadow-elevated p-5 animate-fade-in"
        style={{
          top: tipTop - window.scrollY,
          left: Math.max(16, Math.min(rect.left, window.innerWidth - 380)),
          transform: tipTransform,
        }}
      >
        <div className="text-[10px] uppercase tracking-widest text-gold mb-1">
          Concierge tour · Step {i + 1} of {STEPS.length}
        </div>
        <div className="font-display text-lg text-foreground">{step.title}</div>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={finish}
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition"
          >
            Skip
          </button>
          <div className="flex items-center gap-2">
            {i > 0 && (
              <button
                type="button"
                onClick={() => setI(i - 1)}
                className="text-xs uppercase tracking-widest px-3 py-2 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-border-strong transition"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (i < STEPS.length - 1 ? setI(i + 1) : finish())}
              className="btn btn-primary rounded-full px-4 py-2 text-xs uppercase tracking-widest"
            >
              {i < STEPS.length - 1 ? "Next" : "Got it"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** True when the user has not yet dismissed the walkthrough. */
export function shouldAutoStart(): boolean {
  try {
    return !localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}