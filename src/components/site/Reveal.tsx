import { useEffect, useRef } from "react";

/**
 * Scroll-triggered entrance: children start translated/faded (.reveal-up in
 * styles.css) and animate in when they enter the viewport. `stagger` offsets
 * siblings. Reduced-motion users see content immediately via CSS.
 */
export function Reveal({
  children,
  stagger = 0,
  className = "",
}: {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -5% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal-up ${className}`}
      style={{ "--stagger": stagger } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
