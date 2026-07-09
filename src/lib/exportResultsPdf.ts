import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Cabin } from "@/lib/awards/types";
import type { RankedItinerary, SweetSpotInfo } from "@/lib/intelligence";
import { fareEstimateAud, fmtAud } from "@/lib/intelligence";

type Enriched = RankedItinerary & SweetSpotInfo;

export type ExportContext = {
  from: string;
  to: string;
  cabin: Cabin;
  pax: number;
  dateLabel: string;
  items: Enriched[];
};

const GOLD: [number, number, number] = [201, 168, 76];
const INK: [number, number, number] = [24, 22, 20];
const MUTED: [number, number, number] = [110, 108, 104];
const HAIRLINE: [number, number, number] = [222, 216, 200];

function fmtHrs(min: number) {
  if (!min) return "—";
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

/**
 * Builds a one-page-first, wrap-as-needed PDF summary of the user's award
 * search: hero summary, top pick callout with savings, and a full results
 * table. Runs entirely client-side.
 */
export function exportResultsPdf(ctx: ExportContext): void {
  const { from, to, cabin, pax, dateLabel, items } = ctx;
  if (items.length === 0) return;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // ── Header brand strip ────────────────────────────────────────────────
  doc.setFillColor(...INK);
  doc.rect(0, 0, pageW, 56, "F");
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("MILES EXPERT", margin, 34);
  doc.setTextColor(240, 236, 224);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Award search summary", pageW - margin, 34, { align: "right" });
  y = 80;

  // ── Route title ───────────────────────────────────────────────────────
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(`${from}  →  ${to}`, margin, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const subtitle = [
    `${items.length} option${items.length === 1 ? "" : "s"}`,
    `${cabin} · ${pax} pax`,
    dateLabel,
  ]
    .filter(Boolean)
    .join("  ·  ");
  doc.text(subtitle, margin, y);
  y += 20;

  // ── Top pick callout ──────────────────────────────────────────────────
  const pick = [...items].sort(
    (a, b) =>
      Number(b.isSweetSpot) - Number(a.isSweetSpot) ||
      b.cpp - a.cpp ||
      a.miles - b.miles,
  )[0];
  const cash = fareEstimateAud(pick.from, pick.to, pick.cabin) * pax;
  const taxesAud = pick.taxesUsd * 1.55;
  const cashSaved = Math.max(0, cash - taxesAud);

  const boxH = 92;
  doc.setFillColor(252, 248, 236);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, y, pageW - margin * 2, boxH, 6, 6, "FD");

  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TOP PICK", margin + 14, y + 18);

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(
    `${pick.programName} · ${pick.miles.toLocaleString()} pts + A$${Math.round(taxesAud)} taxes`,
    margin + 14,
    y + 40,
  );

  const reason = pick.isSweetSpot
    ? `Sweet spot — ${Math.round(pick.discountPct * 100)}% under the typical ${pick.cabin} rate.`
    : pick.cpp >= 2.5
      ? `Exceptional value at ${pick.cpp.toFixed(1)}¢ per point.`
      : `Best value we found — ${pick.cpp.toFixed(1)}¢ per point.`;

  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(reason, margin + 14, y + 58);

  if (cashSaved > 300) {
    doc.setTextColor(...GOLD);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(
      `Save ~${fmtAud(cashSaved)} vs paying cash`,
      margin + 14,
      y + 76,
    );
  }

  // Right-aligned CPP badge
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(`${pick.cpp.toFixed(1)}¢`, pageW - margin - 14, y + 44, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("per point", pageW - margin - 14, y + 60, { align: "right" });

  y += boxH + 22;

  // ── Savings summary strip ─────────────────────────────────────────────
  const sweetCount = items.filter((a) => a.isSweetSpot).length;
  const totalSavings = items.reduce((s, a) => s + (a.savingsMiles || 0), 0);
  const cheapest = items.reduce(
    (m, a) => (a.miles < m ? a.miles : m),
    items[0].miles,
  );

  doc.setDrawColor(...HAIRLINE);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 14;

  const stats: Array<[string, string]> = [
    ["Cheapest option", `${cheapest.toLocaleString()} pts`],
    ["Sweet spots", `${sweetCount}`],
    ["Total pts below typical", totalSavings > 0 ? totalSavings.toLocaleString() : "—"],
    ["Cash-equivalent (top pick)", cashSaved > 0 ? fmtAud(cashSaved) : "—"],
  ];
  const colW = (pageW - margin * 2) / stats.length;
  stats.forEach(([label, value], i) => {
    const x = margin + colW * i;
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(label.toUpperCase(), x, y);
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(value, x, y + 16);
  });
  y += 32;

  // ── Results table ─────────────────────────────────────────────────────
  const rows = items.slice(0, 60).map((a) => [
    (a.depart || "").slice(0, 10),
    a.programName,
    a.carrier || "—",
    a.direct || a.stops === 0 ? "Nonstop" : `${a.stops} stop${a.stops === 1 ? "" : "s"}`,
    fmtHrs(a.durationMin || 0),
    `${a.miles.toLocaleString()}`,
    `A$${Math.round(a.taxesUsd * 1.55)}`,
    `${a.cpp.toFixed(1)}¢`,
    a.isSweetSpot ? "★ Sweet" : a.grade,
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Depart",
        "Program",
        "Carrier",
        "Stops",
        "Duration",
        "Points",
        "Taxes",
        "CPP",
        "Grade",
      ],
    ],
    body: rows,
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 5,
      textColor: INK,
      lineColor: HAIRLINE,
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: INK,
      textColor: GOLD,
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    alternateRowStyles: { fillColor: [250, 248, 240] },
    columnStyles: {
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right", textColor: GOLD, fontStyle: "bold" },
    },
    margin: { left: margin, right: margin },
    didDrawPage: () => {
      const pageH = doc.internal.pageSize.getHeight();
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        `Generated ${new Date().toLocaleString()} · miles-expert.com`,
        margin,
        pageH - 20,
      );
      const page = doc.getCurrentPageInfo().pageNumber;
      doc.text(`Page ${page}`, pageW - margin, pageH - 20, { align: "right" });
    },
  });

  if (items.length > 60) {
    const afterY = (doc as unknown as { lastAutoTable?: { finalY: number } })
      .lastAutoTable?.finalY ?? y;
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text(
      `Showing top 60 of ${items.length} — refine filters and export again for more.`,
      margin,
      afterY + 18,
    );
  }

  const filename = `miles-expert_${from}-${to}_${cabin}_${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;
  doc.save(filename);
}