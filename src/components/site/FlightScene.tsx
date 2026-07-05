/**
 * Ambient animated flight scene layered behind the hero: a plane tracing a
 * great-circle arc between two pinging beacons, over faint twinkling nav
 * stars. Pure CSS (offset-path) — browsers without support just show the
 * static arc, and prefers-reduced-motion freezes everything via styles.css.
 */
const ARC = "M 40 300 C 320 80, 780 60, 1160 210";

const STARS: { x: number; y: number; d: number }[] = [
  { x: 140, y: 90, d: 0 },
  { x: 320, y: 160, d: 1.2 },
  { x: 520, y: 60, d: 2.1 },
  { x: 700, y: 140, d: 0.6 },
  { x: 880, y: 90, d: 1.7 },
  { x: 1040, y: 60, d: 2.6 },
  { x: 980, y: 250, d: 0.9 },
  { x: 240, y: 260, d: 2.9 },
];

export function FlightScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg
        viewBox="0 0 1200 340"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-x-0 top-0 w-full h-[65%] opacity-70"
      >
        {/* Nav stars */}
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r="1.6"
            fill="var(--gold-soft)"
            style={{ animation: `twinkle ${3 + (i % 3)}s ease-in-out ${s.d}s infinite` }}
          />
        ))}

        {/* Great-circle arc */}
        <path
          d={ARC}
          fill="none"
          stroke="var(--gold)"
          strokeOpacity="0.25"
          strokeWidth="1.2"
          strokeDasharray="3 7"
          strokeLinecap="round"
        />

        {/* Departure / arrival beacons */}
        <g>
          <circle cx="40" cy="300" r="3" fill="var(--gold)" />
          <circle
            cx="40" cy="300" r="6"
            fill="none" stroke="var(--gold)" strokeWidth="1"
            style={{ transformOrigin: "40px 300px", animation: "beacon-ping 2.8s ease-out infinite" }}
          />
          <circle cx="1160" cy="210" r="3" fill="var(--gold)" />
          <circle
            cx="1160" cy="210" r="6"
            fill="none" stroke="var(--gold)" strokeWidth="1"
            style={{ transformOrigin: "1160px 210px", animation: "beacon-ping 2.8s ease-out 1.4s infinite" }}
          />
        </g>

        {/* Plane riding the arc — inside the SVG so offset-path shares viewBox coords */}
        <g
          style={{
            offsetPath: `path('${ARC}')`,
            offsetRotate: "auto",
            animation: "hero-flight 14s linear infinite",
          }}
        >
          <path
            d="M 0 0 L 14 4.5 L 0 9 L 3.5 4.5 Z"
            transform="translate(-7,-4.5)"
            fill="var(--gold-soft)"
            style={{ filter: "drop-shadow(0 0 5px rgba(201,168,76,0.9))" }}
          />
        </g>
      </svg>
    </div>
  );
}
