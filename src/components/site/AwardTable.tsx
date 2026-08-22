import type { Cabin } from "@/lib/awards/types";
import type { RankedItinerary, SweetSpotInfo, TripGroup } from "@/lib/intelligence";
import { fmtAud, fmtCpp, fmtAge, taxesAudFromUsd } from "@/lib/intelligence";
import { conciergeFor, type ConciergeTone } from "@/lib/concierge";
import { getProgram } from "@/lib/programs";
import { ArrowDown, Sparkles } from "lucide-react";

type Row = RankedItinerary & SweetSpotInfo;
type Group = TripGroup<Row>;

const CABIN_ORDER: Cabin[] = ["economy", "premium", "business", "first"];
const CABIN_SHORT: Record<Cabin, string> = {
  economy: "Y",
  premium: "W",
  business: "J",
  first: "F",
};
const CABIN_LABEL: Record<Cabin, string> = {
  economy: "Economy",
  premium: "Premium",
  business: "Business",
  first: "First",
};

type SortKey =
  | "value"
  | "points"
  | "taxes"
  | "seats"
  | "duration"
  | "stops"
  | "depart"
  | "fresh"
  | "sweet"
  | "y-points"
  | "w-points"
  | "j-points"
  | "f-points";

const CABIN_SORT_KEY: Record<Cabin, SortKey> = {
  economy: "y-points",
  premium: "w-points",
  business: "j-points",
  first: "f-points",
};

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

const TONE_STYLES: Record<ConciergeTone, string> = {
  great: "text-gold",
  good: "text-emerald-300",
  fair: "text-muted-foreground",
  skip: "text-muted-foreground/60",
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
  groups,
  sortBy,
  onSort,
  pax,
  cabinScope,
  onSelect,
}: {
  groups: Group[];
  sortBy: SortKey;
  onSort: (key: SortKey) => void;
  pax: number;
  /** Opens the redemption playbook for a chosen fare. */
  onSelect?: (id: string) => void;
  /**
   * When set, the table shows a single Points column for that cabin plus a
   * plain-English "Recommendation" column — used by the split-by-cabin
   * results view on the homepage.
   */
  cabinScope?: Cabin;
}) {
  if (!groups.length) return null;
  const scoped = cabinScope
    ? groups.filter((g) => g.byCabin[cabinScope] && (g.byCabin[cabinScope]!.miles ?? 0) > 0)
    : groups;
  if (!scoped.length) return null;
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
            {cabinScope ? (
              <>
                <th className="text-right px-3 py-3 font-normal">
                  <HeaderButton
                    align="right"
                    active={sortBy === CABIN_SORT_KEY[cabinScope]}
                    onClick={() => onSort(CABIN_SORT_KEY[cabinScope])}
                  >
                    Points
                  </HeaderButton>
                </th>
                <th className="text-left px-4 py-3 font-normal">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Recommendation
                  </span>
                </th>
              </>
            ) : (
              CABIN_ORDER.map((c) => (
                <th key={c} className="text-right px-3 py-3 font-normal">
                  <HeaderButton
                    align="right"
                    active={sortBy === CABIN_SORT_KEY[c]}
                    onClick={() => onSort(CABIN_SORT_KEY[c])}
                  >
                    {CABIN_LABEL[c]}
                  </HeaderButton>
                </th>
              ))
            )}
            <th className="text-right px-4 py-3 font-normal">
              <HeaderButton
                align="right"
                active={sortBy === "fresh"}
                onClick={() => onSort("fresh")}
              >
                Updated
              </HeaderButton>
            </th>
          </tr>
        </thead>
        <tbody>
          {scoped.map((g) => {
            const base = cabinScope ? (g.byCabin[cabinScope] ?? g.best) : g.best;
            const program = getProgram(base.programId);
            const accent = program?.accent ?? "#c9a84c";
            const programName = program?.name ?? base.programName;
            const stopsLabel =
              base.direct || base.stops === 0
                ? "Nonstop"
                : `${base.stops} stop${base.stops === 1 ? "" : "s"}`;
            const anySweet = g.variants.some((v) => v.isSweetSpot);
            return (
              <tr
                key={g.tripKey}
                className={`border-t border-border-soft hover:bg-background/40 transition-colors ${
                  anySweet ? "bg-gold/[0.03]" : ""
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
                        {base.carrier || "Multiple"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-mono tabular-nums">
                    {base.from} <span className="text-gold">→</span> {base.to}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {fmtDate(base.depart)}
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground text-xs">{stopsLabel}</td>
                <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                  {fmtDuration(base.durationMin)}
                </td>
                {cabinScope
                  ? (() => {
                      const v = g.byCabin[cabinScope]!;
                      const taxesAud = taxesAudFromUsd(v.taxesUsd);
                      const rec = conciergeFor(v);
                      return (
                        <>
                          <td className="px-3 py-3 text-right align-top">
                            <button
                              type="button"
                              onClick={() => onSelect?.(v.id)}
                              className="block w-full text-right group"
                              title="View redemption steps"
                            >
                              <div className="inline-flex items-center gap-1 justify-end font-mono tabular-nums text-foreground group-hover:text-gold transition text-base">
                                {v.isSweetSpot && (
                                  <Sparkles className="size-3 text-gold" aria-hidden="true" />
                                )}
                                {v.miles.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                                + {taxesAud ? fmtAud(taxesAud) : "—"} taxes ·{" "}
                                {v.seats > 0
                                  ? `${v.seats} seat${v.seats > 1 ? "s" : ""}`
                                  : "0 seats"}
                              </div>
                            </button>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className={`text-xs ${TONE_STYLES[rec.tone]}`}>{rec.headline}</div>
                          </td>
                        </>
                      );
                    })()
                  : CABIN_ORDER.map((c) => {
                      const v = g.byCabin[c];
                      if (!v || v.miles <= 0) {
                        return (
                          <td
                            key={c}
                            className="px-3 py-3 text-right text-muted-foreground/40 font-mono tabular-nums"
                          >
                            —
                          </td>
                        );
                      }
                      const taxesAud = taxesAudFromUsd(v.taxesUsd);
                      return (
                        <td key={c} className="px-3 py-3 text-right align-top">
                          <button
                            type="button"
                            onClick={() => onSelect?.(v.id)}
                            className="block w-full text-right group"
                            title={`${CABIN_LABEL[c]} · ${fmtCpp(v.cpp)} · view redemption steps`}
                          >
                            <div className="inline-flex items-center gap-1 justify-end font-mono tabular-nums text-foreground group-hover:text-gold transition">
                              {v.isSweetSpot && (
                                <Sparkles className="size-3 text-gold" aria-hidden="true" />
                              )}
                              {v.miles.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
                              {taxesAud ? fmtAud(taxesAud) : "—"} ·{" "}
                              {v.seats > 0 ? `${v.seats} seat${v.seats > 1 ? "s" : ""}` : "0 seats"}
                            </div>
                            <span
                              className={`inline-flex mt-1 items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-widest ${GRADE_STYLES[v.grade]}`}
                            >
                              {CABIN_SHORT[c]} · {fmtCpp(v.cpp)}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                <td className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  {base.confidence?.ageMin != null ? fmtAge(base.confidence.ageMin) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
