import { useEffect, useRef, useState } from "react";

/**
 * Eases a number toward `target` whenever it changes. First render returns
 * the target directly (SSR-safe, no hydration mismatch) — the animation
 * plays when async data arrives and moves the value.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    if (prev.current === target) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      prev.current = target;
      setValue(target);
      return;
    }
    const from = prev.current;
    prev.current = target;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
