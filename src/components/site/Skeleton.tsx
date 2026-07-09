/** Loading placeholder rows that mirror the card layout they stand in for. */
export function SkeletonRows({
  rows = 3,
  height = "h-24",
  className = "",
}: {
  rows?: number;
  height?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`${height} rounded-lg border border-border-soft bg-card/60 animate-pulse`}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}
