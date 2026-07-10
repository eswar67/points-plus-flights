import { useState, FormEvent } from "react";
import type { Cabin } from "@/lib/awards/types";
import { AIRPORTS, METROS } from "@/lib/airports";

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
  mode: "exact",
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
  const [mode, setMode] = useState<SearchMode>(initial?.mode ?? "exact");
  const [errors, setErrors] = useState<{ from?: string; to?: string }>({});

  const today = new Date().toISOString().slice(0, 10);

  function submit(e: FormEvent) {
    e.preventDefault();
    // Expand any metro codes (NYC → JFK,EWR,LGA) just before validation/search.
    const fromExpanded = expandMetros(from);
    const toExpanded = expandMetros(to);
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
  }

  return (
    <form
      onSubmit={submit}
      className="relative rounded-lg bg-card/80 backdrop-blur-xl border border-border shadow-elevated p-3 md:p-4"
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5 px-1">
        <button
          type="button"
          onClick={swap}
          title="Swap origin and destination"
          aria-label="Swap origin and destination"
          className="text-xs px-2.5 py-1.5 rounded-full border border-border text-muted-foreground hover:text-gold hover:border-gold/50 transition inline-flex items-center gap-1.5"
        >
          <span aria-hidden>⇄</span> Swap
        </button>
        <button
          type="button"
          onClick={reset}
          title="Reset all search fields"
          className="text-xs px-2.5 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-border-strong transition"
        >
          Reset
        </button>
        <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">
          Tip: combine codes with commas — e.g. <span className="tabular-nums">SYD,MEL</span>.
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.2fr_1fr_0.8fr_auto] gap-2">
        <Field label="From" error={errors.from}>
          <input
            value={from}
            onChange={(e) => {
              setFrom(normalizeCodes(e.target.value));
              setErrors((x) => ({ ...x, from: undefined }));
            }}
            maxLength={400}
            required
            aria-invalid={!!errors.from}
            title="One or more 3-letter IATA codes, comma-separated. e.g. SYD,MEL"
            list="ml-airports"
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent text-xl md:text-2xl font-display tracking-wider text-foreground outline-none"
          />
        </Field>
        <Field label="To" error={errors.to}>
          <input
            value={to}
            onChange={(e) => {
              setTo(normalizeCodes(e.target.value));
              setErrors((x) => ({ ...x, to: undefined }));
            }}
            maxLength={400}
            required
            aria-invalid={!!errors.to}
            title="One or more 3-letter IATA codes, comma-separated. e.g. LHR,CDG"
            list="ml-airports"
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent text-xl md:text-2xl font-display tracking-wider text-foreground outline-none"
          />
        </Field>
        <Field label="Depart">
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none [color-scheme:dark]"
          />
        </Field>
        <Field label="Pax">
          <input
            type="number"
            min={1}
            max={9}
            value={pax}
            onChange={(e) => setPax(Math.min(9, Math.max(1, Number(e.target.value) || 1)))}
            className="w-full bg-transparent text-sm text-foreground outline-none"
          />
        </Field>
        <button type="submit" className="btn btn-primary rounded-lg px-8 font-semibold shadow-gold">
          Search awards
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
        <div
          className="flex items-center gap-1.5 flex-wrap"
          role="radiogroup"
          aria-label="Date flexibility"
        >
          <span className="text-xs uppercase tracking-widest text-muted-foreground mr-1">
            Dates
          </span>
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={mode === m.value}
              onClick={() => setMode(m.value)}
              className={`text-xs uppercase tracking-widest px-3 py-2 min-h-9 rounded-full border transition ${
                mode === m.value
                  ? "bg-gold/15 text-gold border-gold/50"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-live" /> Live award data · seats.aero
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 px-1" aria-label="Popular routes">
        <span className="text-xs uppercase tracking-widest text-muted-foreground mr-1">
          Popular
        </span>
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

      <datalist id="ml-airports">
        {AIRPORTS.map((a) => (
          <option key={a.code} value={a.code} label={`${a.city} · ${a.country}`} />
        ))}
      </datalist>
    </form>
  );
}

function ContinentRow({
  label,
  onPick,
}: {
  label: string;
  onPick: (codes: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label={label}>
      <span className="text-xs uppercase tracking-widest text-muted-foreground mr-1">
        {label}
      </span>
      {CONTINENTS.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onPick(c.codes)}
          title={`Add all ${c.codes.length} airports in ${c.label}`}
          className="text-xs px-2.5 py-1.5 rounded-full border border-border text-muted-foreground hover:text-gold hover:border-gold/50 transition"
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
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
