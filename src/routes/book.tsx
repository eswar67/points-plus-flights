import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Header } from "@/components/site/Header";
import { submitBookingRequest } from "@/lib/booking/booking.functions";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Request a booking — Aureum concierge" },
      {
        name: "description",
        content:
          "Tell our award concierge what you want — origin, destination, dates, cabin — and we'll hunt the seats and ticket them for you.",
      },
      { property: "og:title", content: "Request a booking — Aureum concierge" },
      {
        property: "og:description",
        content:
          "Hand the search to a human. We find award space across 30+ programs and ticket on your behalf.",
      },
    ],
  }),
  component: BookPage,
});

const CABINS = [
  { value: "economy", label: "Economy" },
  { value: "premium", label: "Premium economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
] as const;

type Cabin = (typeof CABINS)[number]["value"];

function BookPage() {
  const { user, loading: authLoading } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();
  const gated = !authLoading && !subLoading && (!user || !isActive);

  const submit = useServerFn(submitBookingRequest);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string } | null>(null);

  const [form, setForm] = useState({
    contact_name: "",
    contact_email: "",
    route_from: "",
    route_to: "",
    travel_date: "",
    cabin: "business" as Cabin,
    passenger_count: 1,
    program: "",
    carrier: "",
    miles_required: "",
    notes: "",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        contact_name: form.contact_name.trim(),
        contact_email: form.contact_email.trim(),
        route_from: form.route_from.trim().toUpperCase(),
        route_to: form.route_to.trim().toUpperCase(),
        travel_date: form.travel_date,
        cabin: form.cabin,
        passenger_count: Number(form.passenger_count) || 1,
        program: form.program.trim() || "any",
        carrier: form.carrier.trim() || null,
        miles_required: form.miles_required ? Number(form.miles_required) : null,
        notes: form.notes.trim() || null,
      };
      const res = await submit({ data: payload });
      setSuccess({ id: res.id });
    } catch (err) {
      setError((err as Error).message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-noir">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-widest text-gold mb-3">Concierge booking</div>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight">Hand it to a human.</h1>
          <p className="text-muted-foreground mt-4 max-w-xl">
            Tell us where you want to go and we'll hunt award space across 30+ programs, then ticket
            it on your behalf. No card charged until we confirm a seat you approve.
          </p>
        </div>

        {gated ? (
          <div className="rounded-lg border border-gold/40 bg-gradient-to-b from-gold/10 to-transparent p-8">
            <div className="text-xs uppercase tracking-widest text-gold mb-2">
              Aureum Plus members only
            </div>
            <h2 className="font-display text-2xl">Concierge ticketing is a member benefit.</h2>
            <p className="text-muted-foreground mt-3 max-w-xl">
              An award specialist hunts the seats, holds them, and tickets on your behalf — across
              30+ programs. Available to Aureum Plus members for A$12/month or A$120/year.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/pricing"
                className="text-xs uppercase tracking-widest px-5 py-3 rounded-full bg-gold text-gold-foreground hover:bg-gold-soft transition shadow-gold"
              >
                Upgrade to Aureum Plus
              </Link>
              {!user && (
                <Link
                  to="/auth"
                  search={{ redirect: "/book" }}
                  className="text-xs uppercase tracking-widest px-5 py-3 rounded-full hairline text-gold hover:bg-gold/10 transition"
                >
                  Sign in
                </Link>
              )}
              <Link
                to="/"
                className="text-xs uppercase tracking-widest px-5 py-3 rounded-full text-muted-foreground hover:text-foreground transition"
              >
                Back to search
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="rounded-lg border border-gold/40 bg-gold/5 p-8">
            <div className="text-xs uppercase tracking-widest text-gold mb-2">Request received</div>
            <h2 className="font-display text-2xl">We're on it.</h2>
            <p className="text-muted-foreground mt-3">
              Reference <span className="font-mono text-foreground">{success.id.slice(0, 8)}</span>.
              An award specialist will reply to{" "}
              <span className="text-foreground">{form.contact_email}</span> within a few hours with
              options.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                to="/"
                className="text-xs uppercase tracking-widest px-4 py-2 rounded-full hairline text-gold hover:bg-gold/10 transition"
              >
                Back to search
              </Link>
              <button
                onClick={() => {
                  setSuccess(null);
                  setForm((f) => ({
                    ...f,
                    route_from: "",
                    route_to: "",
                    travel_date: "",
                    notes: "",
                  }));
                }}
                className="text-xs uppercase tracking-widest px-4 py-2 rounded-full text-muted-foreground hover:text-foreground transition"
              >
                Submit another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <Section title="You">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Name">
                  <input
                    required
                    maxLength={120}
                    value={form.contact_name}
                    onChange={(e) => set("contact_name", e.target.value)}
                    className={inputCls}
                    placeholder="Jane Doe"
                  />
                </Field>
                <Field label="Email">
                  <input
                    required
                    type="email"
                    maxLength={255}
                    value={form.contact_email}
                    onChange={(e) => set("contact_email", e.target.value)}
                    className={inputCls}
                    placeholder="jane@example.com"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Trip">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="From (IATA)">
                  <input
                    required
                    maxLength={4}
                    value={form.route_from}
                    onChange={(e) =>
                      set("route_from", e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))
                    }
                    className={`${inputCls} uppercase tracking-widest`}
                    placeholder="SYD"
                  />
                </Field>
                <Field label="To (IATA)">
                  <input
                    required
                    maxLength={4}
                    value={form.route_to}
                    onChange={(e) =>
                      set("route_to", e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))
                    }
                    className={`${inputCls} uppercase tracking-widest`}
                    placeholder="LHR"
                  />
                </Field>
                <Field label="Travel date">
                  <input
                    required
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={form.travel_date}
                    onChange={(e) => set("travel_date", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Passengers">
                  <input
                    required
                    type="number"
                    min={1}
                    max={9}
                    value={form.passenger_count}
                    onChange={(e) => set("passenger_count", Number(e.target.value) as 1)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Cabin">
                  <select
                    value={form.cabin}
                    onChange={(e) => set("cabin", e.target.value as Cabin)}
                    className={inputCls}
                  >
                    {CABINS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Date is flexible? (note in details)">
                  <div className="text-xs text-muted-foreground py-3">
                    Mention ± days in the details box below.
                  </div>
                </Field>
              </div>
            </Section>

            <Section title="Preferences (optional)">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Preferred program">
                  <input
                    maxLength={60}
                    value={form.program}
                    onChange={(e) => set("program", e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Velocity, Qantas, AAdvantage, any"
                  />
                </Field>
                <Field label="Preferred carrier">
                  <input
                    maxLength={120}
                    value={form.carrier}
                    onChange={(e) => set("carrier", e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Qatar Airways"
                  />
                </Field>
                <Field label="Miles available (optional)">
                  <input
                    type="number"
                    min={0}
                    max={2000000}
                    value={form.miles_required}
                    onChange={(e) => set("miles_required", e.target.value)}
                    className={inputCls}
                    placeholder="e.g. 150000"
                  />
                </Field>
              </div>
              <Field label="Details">
                <textarea
                  rows={5}
                  maxLength={2000}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  className={inputCls}
                  placeholder="Date flexibility, stopovers, redeye preference, partner programs you hold, etc."
                />
              </Field>
            </Section>

            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 text-destructive p-4 text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between gap-4 pt-2">
              <p className="text-xs text-muted-foreground max-w-sm">
                We'll only contact you about this request. No card on file — you approve fares
                before we ticket.
              </p>
              <button type="submit" disabled={submitting} className="btn btn-primary shadow-gold">
                {submitting ? "Sending…" : "Send request"}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

const inputCls =
  "w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card/40 p-6">
      <h2 className="font-display text-lg mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
