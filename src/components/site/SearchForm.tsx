import { useState, FormEvent } from "react";
import type { Cabin } from "@/lib/awards/types";

const CABINS: { value: Cabin; label: string }[] = [
  { value: "economy", label: "Economy" },
  { value: "premium", label: "Premium" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

export type SearchMode = "exact" | "flex1" | "flex" | "month";

const MODES: { value: SearchMode; label: string }[] = [
  { value: "exact", label: "Exact date" },
  { value: "flex1", label: "± 1 day" },
  { value: "flex", label: "± 3 days" },
  { value: "month", label: "Whole month" },
];

/** Popular ex-Australia award routes, one tap to fill. */
const PRESETS: { from: string; to: string }[] = [
  { from: "SYD", to: "LHR" },
  { from: "SYD", to: "SIN" },
  { from: "SYD", to: "HND" },
  { from: "SYD", to: "LAX" },
  { from: "MEL", to: "LHR" },
  { from: "MEL", to: "SIN" },
  { from: "BNE", to: "LAX" },
  { from: "PER", to: "CDG" },
];

export type SearchFormQuery = {
  from: string;
  to: string;
  date: string;
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
  const [from, setFrom] = useState(initial?.from ?? "SYD");
  const [to, setTo] = useState(initial?.to ?? "LHR");
  const [date, setDate] = useState(
    initial?.date ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  );
  const [cabin, setCabin] = useState<Cabin>(initial?.cabin ?? "business");
  const [pax, setPax] = useState(initial?.pax ?? 1);
  const [mode, setMode] = useState<SearchMode>(initial?.mode ?? "exact");
  const [errors, setErrors] = useState<{ from?: string; to?: string }>({});

  const today = new Date().toISOString().slice(0, 10);

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: { from?: string; to?: string } = {};
    if (!/^[A-Z]{3}$/.test(from)) errs.from = "3-letter airport code, e.g. SYD.";
    if (!/^[A-Z]{3}$/.test(to)) errs.to = "3-letter airport code, e.g. LHR.";
    if (!errs.from && !errs.to && from === to) errs.to = "Destination must differ from origin.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSearch({ from, to, date, cabin, pax: Math.min(9, Math.max(1, pax || 1)), mode });
  }

  return (
    <form
      onSubmit={submit}
      className="relative rounded-lg bg-card/80 backdrop-blur-xl border border-border shadow-elevated p-3 md:p-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.2fr_1fr_1fr_0.8fr_auto] gap-2">
        <Field label="From" error={errors.from}>
          <input
            value={from}
            onChange={(e) => {
              setFrom(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""));
              setErrors((x) => ({ ...x, from: undefined }));
            }}
            maxLength={3}
            required
            aria-invalid={!!errors.from}
            title="3-letter IATA airport code, e.g. SYD"
            className="w-full bg-transparent text-2xl font-display tracking-wider text-foreground outline-none"
          />
        </Field>
        <Field label="To" error={errors.to}>
          <input
            value={to}
            onChange={(e) => {
              setTo(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""));
              setErrors((x) => ({ ...x, to: undefined }));
            }}
            maxLength={3}
            required
            aria-invalid={!!errors.to}
            title="3-letter IATA airport code, e.g. LHR"
            className="w-full bg-transparent text-2xl font-display tracking-wider text-foreground outline-none"
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
        <Field label="Cabin">
          <select
            value={cabin}
            onChange={(e) => setCabin(e.target.value as Cabin)}
            className="w-full bg-transparent text-sm text-foreground outline-none"
          >
            {CABINS.map((c) => (
              <option key={c.value} value={c.value} className="bg-card">
                {c.label}
              </option>
            ))}
          </select>
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
    </form>
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
