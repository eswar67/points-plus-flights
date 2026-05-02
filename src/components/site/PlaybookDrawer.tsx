import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Check, Clock, ExternalLink, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import type { AwardItinerary } from "@/server/awards/types";
import { buildPlaybook } from "@/lib/playbook";
import { submitBookingRequest } from "@/server/booking/booking.functions";
import { useUserBalances } from "@/hooks/useUserBalances";

type Mode = "playbook" | "concierge" | "submitted";

export function PlaybookDrawer({ award, onClose }: { award: AwardItinerary; onClose: () => void }) {
  const { byProgramId } = useUserBalances();
  const playbook = buildPlaybook(award, byProgramId);
  const [mode, setMode] = useState<Mode>("playbook");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ id: string } | null>(null);
  const submit = useServerFn(submitBookingRequest);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await submit({
        data: {
          contact_email: String(fd.get("email") || ""),
          contact_name: String(fd.get("name") || ""),
          passenger_count: Number(fd.get("pax") || 1),
          route_from: award.from,
          route_to: award.to,
          travel_date: (award.depart || "").slice(0, 10) || new Date().toISOString().slice(0, 10),
          cabin: award.cabin,
          program: award.programId,
          carrier: award.carrier,
          miles_required: award.miles,
          notes: String(fd.get("notes") || "") || null,
        },
      });
      setConfirmation({ id: res.id });
      setMode("submitted");
    } catch (err) {
      setError((err as Error).message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full md:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl md:rounded-2xl border border-gold/20 bg-card shadow-gold"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-gold">
              {mode === "concierge" ? "Concierge booking" : mode === "submitted" ? "Request received" : "Redemption playbook"}
            </div>
            <div className="font-display text-lg mt-0.5">
              {award.from} → {award.to} · {award.cabin}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">
            Close
          </button>
        </div>

        <div className="p-6">
          {mode === "playbook" && (
            <>
              <FeasibilityBanner playbook={playbook} />
              {playbook.riskNote && (
                <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-300 px-4 py-3 text-sm">
                  ⚠ {playbook.riskNote}
                </div>
              )}
              <ol className="mt-6 space-y-4">
                {playbook.steps.map((s, i) => (
                  <li key={i} className="relative pl-10">
                    <span className="absolute left-0 top-0.5 size-7 rounded-full grid place-items-center font-display text-xs bg-gold/15 text-gold border border-gold/30">
                      {i + 1}
                    </span>
                    <div className="font-display text-base">{s.title}</div>
                    <p className="text-sm text-muted-foreground mt-1">{s.detail}</p>
                    <div className="mt-2 flex items-center gap-3">
                      {s.href && s.cta && (
                        <a
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] px-3 py-1.5 rounded-full bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 transition"
                        >
                          {s.cta} <ExternalLink className="size-3" />
                        </a>
                      )}
                      {s.etaMinutes !== undefined && s.kind !== "wait" && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          <Clock className="size-3" /> ~{s.etaMinutes < 60 ? `${s.etaMinutes}m` : `${Math.round(s.etaMinutes / 60)}h`}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-8 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent p-5">
                <div className="flex items-start gap-3">
                  <Sparkles className="size-5 text-gold mt-0.5" />
                  <div className="flex-1">
                    <div className="font-display text-base">Don't want to do this yourself?</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Our concierge will transfer points and ticket the seat for you. Service fee applies.
                    </p>
                  </div>
                  <button
                    onClick={() => setMode("concierge")}
                    className="text-xs uppercase tracking-[0.18em] px-4 py-2 rounded-full bg-gold text-gold-foreground hover:opacity-90 transition flex items-center gap-1.5"
                  >
                    Have us book it <ArrowRight className="size-3" />
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === "concierge" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We'll reach out within 30 minutes to capture program logins (sent via secure link), confirm payment for fees & taxes, and ticket the seat.
              </p>
              <Field name="name" label="Full name (as on passport)" required maxLength={120} />
              <Field name="email" label="Email" type="email" required maxLength={255} />
              <Field name="pax" label="Passengers" type="number" min={1} max={9} defaultValue={String(1)} required />
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Notes (optional)</label>
                <textarea
                  name="notes"
                  maxLength={2000}
                  rows={3}
                  className="mt-1 w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-gold/60"
                  placeholder="Frequent flyer #, seat preferences, alternate dates…"
                />
              </div>
              <div className="rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 inline -mt-0.5 mr-1 text-gold" />
                We never store your loyalty passwords. Credentials are entered through a single-use encrypted link and erased after ticketing.
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => setMode("playbook")} className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">
                  ← Back to playbook
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] px-5 py-2.5 rounded-full bg-gold text-gold-foreground hover:opacity-90 transition disabled:opacity-60"
                >
                  {submitting && <Loader2 className="size-3.5 animate-spin" />}
                  Submit booking request
                </button>
              </div>
            </form>
          )}

          {mode === "submitted" && confirmation && (
            <div className="text-center py-6">
              <div className="mx-auto size-12 rounded-full bg-gold/15 grid place-items-center border border-gold/40">
                <Check className="size-6 text-gold" />
              </div>
              <div className="mt-4 font-display text-xl">You're in the queue.</div>
              <p className="text-sm text-muted-foreground mt-2">
                Reference <span className="text-gold font-mono">{confirmation.id.slice(0, 8)}</span>. We'll email you within 30 minutes.
              </p>
              <button
                onClick={onClose}
                className="mt-6 text-xs uppercase tracking-[0.18em] px-5 py-2.5 rounded-full hairline text-gold hover:bg-gold/10 transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeasibilityBanner({ playbook }: { playbook: ReturnType<typeof buildPlaybook> }) {
  if (playbook.feasible) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-emerald-300 px-4 py-3 text-sm flex items-center gap-2">
        <Check className="size-4" /> You have enough miles. Estimated time to ticket: under 10 minutes.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-gold/30 bg-gold/5 text-gold px-4 py-3 text-sm">
      Short by {playbook.shortfall.toLocaleString()} miles. We'll route a transfer below.
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, ...rest } = props;
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</label>
      <input
        {...rest}
        className="mt-1 w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-gold/60"
      />
    </div>
  );
}