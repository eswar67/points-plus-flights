import { ExternalLink } from "lucide-react";
import { getProgram } from "@/lib/programs";
import {
  TRANSFERABLE_PROGRAM_BANKS,
  routesFromBankProgram,
  effectiveBalances,
  ratioMultiplier,
} from "@/lib/intelligence";
import { useUserBalances } from "@/hooks/useUserBalances";

function fmtEta(min: number) {
  return min < 60 ? `${min}m` : `~${Math.round(min / 60)}h`;
}

/**
 * Shows where the user's transferable currencies (Amex MR, Citi TYP, ANZ)
 * can go, at what ratio and speed — and the resulting per-program reach.
 */
export function TransferPlanner() {
  const { balances, byProgramId, loading } = useUserBalances();

  if (loading) return null;

  const heldBankPrograms = balances.filter((b) => b.program_id in TRANSFERABLE_PROGRAM_BANKS);

  if (heldBankPrograms.length === 0) {
    return (
      <section className="mt-16 pt-10 border-t border-border">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          Transfer planner
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-prose">
          Add a transferable currency above — Amex Membership Rewards or Citi ThankYou Points — and
          we'll show every airline program you can reach, at what ratio, and how long the points
          take to land.
        </p>
      </section>
    );
  }

  const reach = effectiveBalances(byProgramId);
  const boostedPrograms = Object.entries(reach)
    .filter(([, v]) => v.viaTransfer > 0)
    .sort((a, b) => b[1].total - a[1].total);

  return (
    <section className="mt-16 pt-10 border-t border-border">
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Transfer planner</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-prose">
        Where your transferable points can go. Ratios and posting times are typical values — always
        confirm on the bank's site before moving points.
      </p>

      <div className="mt-6 space-y-4">
        {heldBankPrograms.map((b) => {
          const program = getProgram(b.program_id);
          const routes = routesFromBankProgram(b.program_id);
          const accent = program?.accent ?? "#c9a84c";
          return (
            <div key={b.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="size-8 rounded-full grid place-items-center font-display text-xs"
                  style={{
                    background: `${accent}22`,
                    color: accent,
                    border: `1px solid ${accent}55`,
                  }}
                >
                  {program?.short ?? "•"}
                </span>
                <div>
                  <div className="font-display text-lg leading-tight">{b.program_name}</div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    {b.balance.toLocaleString()} points to deploy
                  </div>
                </div>
              </div>

              {routes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No airline transfer routes on file for this currency yet.
                </p>
              ) : (
                <ul className="divide-y divide-border-soft">
                  {routes.map((r) => {
                    const target = getProgram(r.programId);
                    const yielded = Math.floor(b.balance * ratioMultiplier(r.ratio));
                    return (
                      <li
                        key={`${r.bank}-${r.programId}`}
                        className="py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
                      >
                        <span className="min-w-[180px]">
                          <span className="text-muted-foreground">→</span>{" "}
                          {target?.name ?? r.programId}
                        </span>
                        <span className="text-muted-foreground font-mono text-xs">{r.ratio}</span>
                        <span className="text-muted-foreground text-xs">
                          lands in {fmtEta(r.etaMin)}
                        </span>
                        <span className="text-gold font-mono text-xs">
                          = {yielded.toLocaleString()} pts
                        </span>
                        <a
                          href={r.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto inline-flex items-center gap-1 text-xs uppercase tracking-widest text-gold hover:underline"
                        >
                          {r.bank} <ExternalLink className="size-3" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {boostedPrograms.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Effective reach per program
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {boostedPrograms.map(([pid, v]) => {
              const p = getProgram(pid);
              return (
                <div key={pid} className="rounded-lg border border-border bg-background/40 p-4">
                  <div className="text-sm">{p?.name ?? pid}</div>
                  <div className="font-display text-2xl text-gold-gradient mt-1">
                    {v.total.toLocaleString()}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                    {v.direct.toLocaleString()} held + {v.viaTransfer.toLocaleString()} via transfer
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Reach is per program — the same bank points can only fund one transfer.
          </p>
        </div>
      )}
    </section>
  );
}
