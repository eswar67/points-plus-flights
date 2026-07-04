import { useState, FormEvent } from "react";
import type { Cabin } from "@/lib/awards/types";

const CABINS: { value: Cabin; label: string }[] = [
  { value: "economy", label: "Economy" },
  { value: "premium", label: "Premium" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

export function SearchForm({
  onSearch,
  initial,
}: {
  onSearch: (q: { from: string; to: string; date: string; cabin: Cabin; pax: number }) => void;
  initial?: { from: string; to: string; date: string; cabin: Cabin; pax: number };
}) {
  const [from, setFrom] = useState(initial?.from ?? "SYD");
  const [to, setTo] = useState(initial?.to ?? "LHR");
  const [date, setDate] = useState(initial?.date ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [cabin, setCabin] = useState<Cabin>(initial?.cabin ?? "business");
  const [pax, setPax] = useState(initial?.pax ?? 1);

  function submit(e: FormEvent) {
    e.preventDefault();
    onSearch({ from, to, date, cabin, pax });
  }

  return (
    <form
      onSubmit={submit}
      className="relative rounded-2xl bg-card/80 backdrop-blur-xl border border-border shadow-elevated p-3 md:p-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1.2fr_1fr_1fr_0.8fr_auto] gap-2">
        <Field label="From">
          <input value={from} onChange={(e) => setFrom(e.target.value.toUpperCase())} maxLength={3}
            className="w-full bg-transparent text-2xl font-display tracking-wider text-foreground outline-none" />
        </Field>
        <Field label="To">
          <input value={to} onChange={(e) => setTo(e.target.value.toUpperCase())} maxLength={3}
            className="w-full bg-transparent text-2xl font-display tracking-wider text-foreground outline-none" />
        </Field>
        <Field label="Depart">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none [color-scheme:dark]" />
        </Field>
        <Field label="Cabin">
          <select value={cabin} onChange={(e) => setCabin(e.target.value as Cabin)}
            className="w-full bg-transparent text-sm text-foreground outline-none">
            {CABINS.map((c) => <option key={c.value} value={c.value} className="bg-card">{c.label}</option>)}
          </select>
        </Field>
        <Field label="Pax">
          <input type="number" min={1} max={9} value={pax} onChange={(e) => setPax(Number(e.target.value))}
            className="w-full bg-transparent text-sm text-foreground outline-none" />
        </Field>
        <button type="submit"
          className="rounded-xl px-6 py-4 font-display font-semibold text-sm tracking-wide text-gold-foreground bg-gradient-to-br from-gold-soft to-gold shadow-gold hover:opacity-95 transition">
          Search Awards
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="rounded-xl bg-background/40 hover:bg-background/60 transition px-4 py-3 flex flex-col gap-1 border border-transparent hover:border-border">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
