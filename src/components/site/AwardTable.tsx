import { Link } from "@tanstack/react-router";
import type { RankedItinerary, SweetSpotInfo } from "@/lib/intelligence";
import { fmtAud, fmtCpp, fmtAge, taxesAudFromUsd } from "@/lib/intelligence";
import { getProgram } from "@/lib/programs";
import { ArrowDown, ArrowUp, Sparkles } from "lucide-react";

type Row = RankedItinerary & SweetSpotInfo;

type SortKey =
  | "value"
  | "points"
  | "taxes"
  | "seats"
  | "duration"
  | "stops"
  | "depart"
  | "fresh"
  | "sweet";

function fmtDuration(min: number) {
  if (!min) return "—";
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function fmtDate(value: string) {
  if (!value) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(value + "T00:00:00").toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

const GRADE_STYLES: Record<Row["grade"], string> = {
  exceptional: "bg-gold/20 text-gold border-gold/50",
  great: "bg-gold/10 text-gold border-gold/30",
  fair: "border-border text-muted-foreground",
  skip: "border-border-soft text-muted-foreground/70",
};

function HeaderButton({
  active,
  onClick,
  align = "left",
  children,
}: {
  active: boolean;
  onClick: () => void;
  align?: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest transition ${
        align === "right" ? "flex-row-reverse" : ""
      } ${active ? "text-gold" : "text-muted-foreground hover:text-foreground"}`}
    >
      {children}
      {active && <ArrowDown className="size-3" aria-hidden="true" />}
    </button>
  );
}

export function AwardTable({
  rows,
  sortBy,
  onSort,
  pax,
}: {
  rows: Row[];
  sortBy: SortKey;
  onSort: (key: SortKey) => void;
  pax: number;
}) {
  if (!rows.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-background/40 border-b border-border-soft">
          <tr>
            <th className="text-left px-4 py-3 font-normal">
              <HeaderButton active={false} onClick={() => {}}>
                Program · Airline
              </HeaderButton>
            </th>
            <th className="text-left px-4 py-3 font-normal">
              <HeaderButton active={sortBy === "depart"} onClick={() => onSort("depart")}>
                Route · Date
              </HeaderButton>
            </th>
            <th className="text-left px-4 py-3 font-normal">Cabin</th>
            <th className="text-right px-4 py-3 font-normal">
              <HeaderButton
                align="right"
                active={sortBy === "points"}
                onClick={() => onSort("points")}
              >
                Miles
              </HeaderButton>
            </th>
            <th className="text-right px-4 py-3 font-normal">
              <HeaderButton
                align="right"
                active={sortBy === "taxes"}
                onClick={() => onSort("taxes")}
              >
                Taxes
              </HeaderButton>
            </th>
            <th className="text-right px-4 py-3 font-normal">
              <HeaderButton
                align="right"
                active={sortBy === "seats"}
                onClick={() => onSort("seats")}
              >
                Seats
              </HeaderButton>
            </th>
            <th className="text-right px-4 py-3 font-normal">
              <HeaderButton
                align="right"
                active={sortBy === "stops"}
                onClick={() => onSort("stops")}
              >
                Stops
              </HeaderButton>
            </th>
            <th className="text-right px-4 py-3 font-normal">
              <HeaderButton
                align="right"
                active={sortBy === "duration"}
                onClick={() => onSort("duration")}
              >
                Duration
              </HeaderButton>
            </th>
            <th className="text-right px-4 py-3 font-normal">
              <HeaderButton
                align="right"
                active={sortBy === "value"}
                onClick={() => onSort("value")}
              >
                Value
              </HeaderButton>
            </th>
            <th className="text-right px-4 py-3 font-normal">
              <HeaderButton
                align="right"
                active={sortBy === "fresh"}
                onClick={() => onSort("fresh")}
              >
                Updated
              </HeaderButton>
            </th>
            <th className="text-right px-4 py-3 font-normal" aria-label="Action" />
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const program = getProgram(a.programId);
            const accent = program?.accent ?? "#c9a84c";
            const programName = program?.name ?? a.programName;
            const taxesAud = taxesAudFromUsd(a.taxesUsd);
            const stopsLabel =
              a.direct || a.stops === 0 ? "Nonstop" : `${a.stops} stop${a.stops === 1 ? "" : "s"}`;
            return (
              <tr
                key={a.id}
                className={`border-t border-border-soft hover:bg-background/40 transition-colors ${
                  a.isSweetSpot ? "bg-gold/[0.03]" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="inline-flex items-center gap-2">
                    <span
                      className="size-7 rounded-full grid place-items-center font-display text-[10px]"
                      style={{
                        background: `${accent}22`,
                        color: accent,
                        border: `1px solid ${accent}55`,
                      }}
                    >
                      {program?.short ?? "?"}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate">{programName}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                        {a.carrier || "Multiple"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-mono tabular-nums">
                    {a.from} <span className="text-gold">→</span> {a.to}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {fmtDate(a.depart)}
                  </div>
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{a.cabin}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    {a.isSweetSpot && (
                      <span
                        className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest text-gold"
                        title={`~${Math.round(a.discountPct * 100)}% below the median for this cabin`}
                      >
                        <Sparkles className="size-3" aria-hidden="true" />
                      </span>
                    )}
                    {a.miles.toLocaleString()}
                  </div>
                  {pax > 1 && (
                    <div className="text-[10px] text-muted-foreground">
                      {pax}× {(a.miles / pax).toLocaleString()}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                  {taxesAud ? fmtAud(taxesAud) : "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  <span className={a.seats <= 1 ? "text-muted-foreground" : ""}>
                    {a.seats > 0 ? a.seats : "0"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                  {stopsLabel}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                  {fmtDuration(a.durationMin)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${GRADE_STYLES[a.grade]}`}
                    title={`${fmtCpp(a.cpp)} — ${a.grade}`}
                  >
                    {fmtCpp(a.cpp)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  {a.confidence?.ageMin != null ? fmtAge(a.confidence.ageMin) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to="/book"
                    search={{ id: a.id }}
                    className="text-[10px] uppercase tracking-widest text-gold hover:underline"
                  >
                    Book →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}