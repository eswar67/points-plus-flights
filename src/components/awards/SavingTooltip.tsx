"use client";

import { Info } from "lucide-react";
import { fmtAud } from "@/lib/intelligence";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SavingTooltip({
  cash,
  taxes,
  pct,
  cabin,
}: {
  cash: number;
  taxes: number;
  pct: number;
  cabin: "business" | "economy";
}) {
  const saved = cash - taxes;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          className="inline-flex items-center justify-center size-4 rounded-full bg-card border border-gold/50 text-gold hover:border-gold hover:text-gold-soft transition cursor-pointer"
          aria-label={`How the ${cabin} Save ${pct}% figure is calculated`}
        >
          <Info className="size-3" strokeWidth={2.5} />
        </span>
      </TooltipTrigger>

      <TooltipContent
        side="top"
        align="center"
        sideOffset={6}
        className="max-w-[260px] bg-card text-foreground border border-border p-3 shadow-elevated"
      >
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-widest text-gold">
            How Save {pct}% is calculated
          </p>
          <div className="text-xs space-y-1">
            <p>
              <span className="text-muted-foreground">Cash fare:</span>{" "}
              <span className="font-mono tabular-nums">{fmtAud(cash)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Reward taxes:</span>{" "}
              <span className="font-mono tabular-nums">{fmtAud(taxes)}</span>
            </p>
            <p className="font-mono tabular-nums text-gold">
              {fmtAud(cash)} − {fmtAud(taxes)} = {fmtAud(saved)} saved
            </p>
            <p className="font-mono tabular-nums text-gold">
              {fmtAud(saved)} ÷ {fmtAud(cash)} × 100 = {pct}%
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            The saving percentage is the cash outlay avoided by paying reward taxes instead of the
            full fare. It does not include the value of the points or miles redeemed.
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
