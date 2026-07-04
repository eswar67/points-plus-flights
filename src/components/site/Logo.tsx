export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="Aureum"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="aureum-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--gold-soft)" />
          <stop offset="1" stopColor="var(--gold)" />
        </linearGradient>
      </defs>
      {/* Rounded tile */}
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7.5"
        fill="oklch(0.15 0 0)" stroke="url(#aureum-gold)" strokeOpacity="0.45" strokeWidth="1" />
      {/* A-frame peak */}
      <path
        d="M16 6.5 L25.4 25.5 h-3.5 L16 13.2 10.1 25.5 H6.6 Z"
        fill="url(#aureum-gold)"
      />
      {/* Contrail crossing the A like a flight path */}
      <path
        d="M4.5 20.5 C 11 19, 19 15.5, 26.5 9.5"
        fill="none"
        stroke="url(#aureum-gold)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="2.5 2.2"
        opacity="0.9"
      />
      {/* Plane dot at the end of the contrail */}
      <circle cx="26.5" cy="9.5" r="1.6" fill="var(--gold-soft)" />
    </svg>
  );
}
