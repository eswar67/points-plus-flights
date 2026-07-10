import { useEffect, useState, FormEvent } from "react";
import type { Cabin } from "@/lib/awards/types";
import {
  AIRPORTS,
  METROS,
  searchAirports,
  warmAirportIndex,
  type Airport,
} from "@/lib/airports";

export type SearchMode = "exact" | "flex1" | "flex" | "month";

const MODES: { value: SearchMode; label: string }[] = [
  { value: "exact", label: "Exact date" },
  { value: "flex1", label: "± 1 day" },
  { value: "flex", label: "± 3 days" },
  { value: "month", label: "Whole month" },
];

/** Map any metro shortcuts inside a code list to their member airports. */
function expandMetros(codes: string): string {
  const parts = codes.split(",").filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const metro = METROS.find((m) => m.code === p);
    if (metro) out.push(...metro.airports);
    else out.push(p);
  }
  return Array.from(new Set(out)).join(",");
}

const DEFAULTS: Pick<SearchFormQuery, "from" | "to" | "cabin" | "pax" | "mode"> = {
  from: "",
  to: "",
  cabin: "business",
  pax: 1,
  mode: "flex",
};

/** Popular ex-Australia award routes, one tap to fill. */
const PRESETS: { from: string; to: string }[] = [
  { from: "SYD", to: "SIN" },
  { from: "SYD", to: "LHR" },
  { from: "SYD", to: "HND" },
  { from: "SYD", to: "LAX" },
  { from: "MEL", to: "LHR" },
  { from: "MEL", to: "SIN" },
  { from: "BNE", to: "LAX" },
  { from: "PER", to: "CDG" },
];

/** Sanitize free-form input into a comma-joined list of 3-letter IATA codes. */
function normalizeCodes(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z,]/g, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(",");
}

/** Valid = one or more comma-separated 3-letter codes, no duplicates. */
function isValidCodes(v: string): boolean {
  if (!v) return false;
  const parts = v.split(",").filter(Boolean);
  if (parts.length === 0) return false;
  if (!parts.every((p) => /^[A-Z]{3}$/.test(p))) return false;
  return new Set(parts).size === parts.length;
}

export type SearchFormQuery = {
  from: string;
  to: string;
  date: string;
  /**
   * Legacy field kept so existing recent-searches / shared URLs / downstream
   * code that references a "selected cabin" continues to work. The search
   * itself no longer filters by cabin — every cabin is returned and rendered
   * side by side in the results table.
   */
  cabin: Cabin;
  pax: number;
  mode: SearchMode;
};

export function SearchForm({
  onSearch,
  initial,
}: {
  onSearch: (q: SearchFormQuery) => void;
  initial?: SearchFormQuery;
}) {
  const [from, setFrom] = useState(initial?.from ?? "");
  const [to, setTo] = useState(initial?.to ?? "");
  const [date, setDate] = useState(
    initial?.date ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  );
  // Kept in state for `initial` compat; not user-editable anymore.
  const [cabin] = useState<Cabin>(initial?.cabin ?? "business");
  const [pax, setPax] = useState(initial?.pax ?? 1);
  const [mode, setMode] = useState<SearchMode>(initial?.mode ?? "flex");
  const [errors, setErrors] = useState<{ from?: string; to?: string }>({});
  const [showMore, setShowMore] = useState(false);
  const [fromMatches, setFromMatches] = useState<Airport[]>([]);
  const [toMatches, setToMatches] = useState<Airport[]>([]);

  // Warm the worldwide airport index on mount so typing feels instant.
  useEffect(() => {
    warmAirportIndex();
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  /** Extract the last comma-separated token — that's what the user is
   *  currently typing, e.g. "SYD,MEL,HYD" → "HYD". */
  function activeToken(v: string): string {
    const parts = v.split(",");
    return (parts[parts.length - 1] ?? "").trim();
  }

  async function refreshMatches(
    raw: string,
    setter: (a: Airport[]) => void,
  ): Promise<void> {
    const token = activeToken(raw);
    if (!token || token.length < 2) {
      setter([]);
      return;
    }
    const hits = await searchAirports(token, 10);
    setter(hits);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    // Expand any metro codes (NYC → JFK,EWR,LGA) just before validation/search.
    // Free-text city names (e.g. "Hyderabad") are also allowed — the input
    // handler swaps them to the matching IATA code as the user picks from
    // the autocomplete list, so by submit-time we should only see codes.
    const fromExpanded = expandMetros(from.toUpperCase());
    const toExpanded = expandMetros(to.toUpperCase());
    if (fromExpanded !== from) setFrom(fromExpanded);
    if (toExpanded !== to) setTo(toExpanded);
    const errs: { from?: string; to?: string } = {};
    if (!isValidCodes(fromExpanded)) errs.from = "3-letter codes, comma-separated. e.g. SYD,MEL";
    if (!isValidCodes(toExpanded)) errs.to = "3-letter codes, comma-separated. e.g. LHR,CDG";
    if (!errs.from && !errs.to) {
      const fromSet = new Set(fromExpanded.split(","));
      const toSet = new Set(toExpanded.split(","));
      const overlap = [...fromSet].some((c) => toSet.has(c));
      if (overlap) errs.to = "Origin and destination cannot share an airport.";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSearch({
      from: fromExpanded,
      to: toExpanded,
      date,
      cabin,
      pax: Math.min(9, Math.max(1, pax || 1)),
      mode,
    });
  }

  function swap() {
    setFrom(to);
    setTo(from);
    setErrors({});
  }

  function reset() {
    setFrom(DEFAULTS.from);
    setTo(DEFAULTS.to);
    setDate(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    setPax(DEFAULTS.pax);
    setMode(DEFAULTS.mode);
    setErrors({});
    setFromMatches([]);
    setToMatches([]);
  }

  return (
    <form
      onSubmit={submit}
      className="relative rounded-lg bg-card/80 backdrop-blur-xl border border-border shadow-elevated p-3 md:p-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1.3fr_1fr_auto] gap-2">
        <Field label="From" error={errors.from} data-tour="from">
          <input
            value={from}
            onChange={(e) => {
              const raw = e.target.value;
              // Allow letters, digits, spaces and commas while typing so
              // city names like "Hyderabad" are searchable. We normalise
              // to IATA codes when a match is picked or on submit.
              const cleaned = raw.replace(/[^A-Za-z, ]/g, "");
              setFrom(cleaned);
              setErrors((x) => ({ ...x, from: undefined }));
              void refreshMatches(cleaned, setFromMatches);
            }}
            onBlur={() => setFrom((v) => normalizeCodes(v))}
            maxLength={400}
            required
            aria-invalid={!!errors.from}
            placeholder="City or airport (e.g. Sydney or SYD)"
            title="Type any city name or IATA code. Combine with commas for multiple: SYD,MEL"
            list="ml-airports-from"
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent text-xl md:text-2xl font-display tracking-wider text-foreground outline-none"
          />
        </Field>
        <Field label="To" error={errors.to} data-tour="to">
          <input
            value={to}
            onChange={(e) => {
              const raw = e.target.value;
              const cleaned = raw.replace(/[^A-Za-z, ]/g, "");
              setTo(cleaned);
              setErrors((x) => ({ ...x, to: undefined }));
              void refreshMatches(cleaned, setToMatches);
            }}
            onBlur={() => setTo((v) => normalizeCodes(v))}
            maxLength={400}
            required
            aria-invalid={!!errors.to}
            placeholder="City or airport (e.g. London or LHR)"
            title="Type any city name or IATA code. Combine with commas for multiple: LHR,CDG"
            list="ml-airports-to"
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent text-xl md:text-2xl font-display tracking-wider text-foreground outline-none"
          />
        </Field>
        <Field label="When" data-tour="when">
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none [color-scheme:dark]"
          />
        </Field>
        <button
          type="submit"
          data-tour="submit"
          className="btn btn-primary rounded-lg px-8 font-semibold shadow-gold"
        >
          Find my trip
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 px-1">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-gold transition"
        >
          {showMore ? "− Hide options" : "+ More options"}
        </button>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-live" /> Live award data
        </span>
      </div>

      {showMore && (
        <div className="mt-3 pt-3 border-t border-border-soft space-y-3 px-1 animate-fade-in">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              Travellers
              <input
                type="number"
                min={1}
                max={9}
                value={pax}
                onChange={(e) => setPax(Math.min(9, Math.max(1, Number(e.target.value) || 1)))}
                className="w-14 bg-background/60 border border-border rounded px-2 py-1 text-sm text-foreground outline-none focus:border-gold/50"
              />
            </label>
            <button
              type="button"
              onClick={swap}
              className="text-xs px-2.5 py-1.5 rounded-full border border-border text-muted-foreground hover:text-gold hover:border-gold/50 transition inline-flex items-center gap-1.5"
            >
              <span aria-hidden>⇄</span> Swap
            </button>
            <button
              type="button"
              onClick={reset}
              className="text-xs px-2.5 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-border-strong transition"
            >
              Reset
            </button>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap" role="radiogroup" aria-label="Date flexibility">
            <span className="text-xs uppercase tracking-widest text-muted-foreground mr-1">Dates</span>
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={mode === m.value}
                onClick={() => setMode(m.value)}
                className={`text-xs uppercase tracking-widest px-3 py-1.5 rounded-full border transition ${
                  mode === m.value
                    ? "bg-gold/15 text-gold border-gold/50"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-border-strong"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5" aria-label="Popular routes">
            <span className="text-xs uppercase tracking-widest text-muted-foreground mr-1">Popular</span>
            {PRESETS.map((p) => (
              <button
                key={`${p.from}${p.to}`}
                type="button"
                onClick={() => {
                  setFrom(p.from);
                  setTo(p.to);
                  setErrors({});
                }}
                className="text-xs px-2.5 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-border-strong transition tabular-nums"
              >
                {p.from}–{p.to}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Per-field datalists so the "From" suggestions never bleed into
          "To" and vice versa. We seed each with the curated list, then
          merge live matches from the worldwide index on top. */}
      <AirportDatalist id="ml-airports-from" matches={fromMatches} />
      <AirportDatalist id="ml-airports-to" matches={toMatches} />
    </form>
  );
}

function AirportDatalist({ id, matches }: { id: string; matches: Airport[] }) {
  // De-dupe: matches from the global index win over curated when both are
  // present, so a live "Hyderabad" hit replaces a stale curated entry.
  const seen = new Set<string>();
  const combined: Airport[] = [];
  for (const a of matches) {
    if (seen.has(a.code)) continue;
    seen.add(a.code);
    combined.push(a);
  }
  for (const a of AIRPORTS) {
    if (seen.has(a.code)) continue;
    seen.add(a.code);
    combined.push(a);
  }
  return (
    <datalist id={id}>
      {combined.map((a) => (
        <option key={a.code} value={a.code} label={`${a.city} · ${a.country}`} />
      ))}
    </datalist>
  );
}

function Field({
  label,
  error,
  children,
  ...rest
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest}>
      <label
        className={`rounded-lg bg-background/40 hover:bg-background/60 transition px-4 py-3 flex flex-col gap-1 border ${
          error ? "border-destructive/60" : "border-transparent hover:border-border"
        }`}
      >
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        {children}
      </label>
      {error && (
        <p role="alert" className="mt-1 px-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
