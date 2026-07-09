export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="Miles Expert"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="aureum-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--gold-soft)" />
          <stop offset="1" stopColor="var(--gold)" />
        </linearGradient>
      </defs>
      {/* Rounded tile */}
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="7.5"
        fill="oklch(0.15 0 0)"
        stroke="url(#aureum-gold)"
        strokeOpacity="0.45"
        strokeWidth="1"
      />
      {/* M mark for Miles Expert */}
      <path d="M5.5 25.5 V7 L11.2 7 L16 16.5 L20.8 7 L26.5 7 V25.5 H23.2 V12.4 L17.4 23.6 H14.6 L8.8 12.4 V25.5 Z" fill="url(#aureum-gold)" />
      {/* Contrail crossing the M like a flight path */}
      <path
        d="M4.5 22.5 C 11 21, 19 17.5, 26.5 11.5"
        fill="none"
        stroke="url(#aureum-gold)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="2.5 2.2"
        opacity="0.9"
      />
      {/* Plane dot at the end of the contrail */}
      <circle cx="26.5" cy="11.5" r="1.6" fill="var(--gold-soft)" />
    </svg>
  );
}
