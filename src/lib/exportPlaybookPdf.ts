import jsPDF from "jspdf";
import type { AwardItinerary } from "@/lib/awards/types";
import type { Playbook } from "@/lib/playbook";
import { fmtAud } from "@/lib/intelligence";

const GOLD: [number, number, number] = [201, 168, 76];
const INK: [number, number, number] = [24, 22, 20];
const MUTED: [number, number, number] = [110, 108, 104];
const HAIRLINE: [number, number, number] = [222, 216, 200];

const CABIN_LABEL: Record<string, string> = {
  economy: "Economy",
  premium: "Premium economy",
  business: "Business",
  first: "First",
};

/**
 * jsPDF's built-in fonts are WinAnsi-encoded. Characters outside Latin-1
 * (arrows, en/em dashes, smart quotes) render as garbage and, worse, measure
 * as near-zero width so splitTextToSize stops wrapping correctly. Map the
 * typography we actually use down to safe equivalents.
 */
function pdfSafe(text: string): string {
  return (
    text
      .replace(/[\u2192\u2794\u27A1]/g, "->")
      .replace(/[\u2190]/g, "<-")
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u2026/g, "...")
      .replace(/\u00B1/g, "+/-")
      .replace(/[\u2022]/g, "-")
      .replace(/\u00A0/g, " ")
      // anything still outside Latin-1 would break metrics
      .split("")
      .filter((ch) => ch.charCodeAt(0) <= 0xff)
      .join("")
  );
}

function etaLabel(min?: number): string {
  if (min == null) return "";
  return min < 60 ? `~${min}m` : `~${Math.round(min / 60)}h`;
}

/**
 * Renders the redemption playbook for one award as a printable PDF:
 * brand strip, route/points summary, feasibility line, numbered steps with
 * their detail + link, risk note, and a freshness disclaimer.
 * Mirrors the visual language of exportResultsPdf. Runs client-side.
 */
/** Builds the guide document (exported separately so it can be rendered
 *  and inspected outside the browser). */
export function buildPlaybookPdf(award: AwardItinerary, playbook: Playbook): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentW = pageW - margin * 2;
  let y = margin;

  const newPageIfNeeded = (needed: number) => {
    if (y + needed < pageH - 56) return;
    doc.addPage();
    y = margin;
  };

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
  doc.text("Redemption guide", pageW - margin, 34, { align: "right" });
  y = 84;

  // ── Route title ───────────────────────────────────────────────────────
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(award.from, margin, y);
  const fromW = doc.getTextWidth(award.from);
  const aX = margin + fromW + 14;
  const aY = y - 7;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.6);
  doc.line(aX, aY, aX + 26, aY);
  doc.line(aX + 20, aY - 5, aX + 26, aY);
  doc.line(aX + 20, aY + 5, aX + 26, aY);
  doc.text(award.to, aX + 40, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const depart = award.depart?.slice(0, 10) ?? "";
  const subtitle = [CABIN_LABEL[award.cabin] ?? award.cabin, depart, award.carrier, award.flightNo]
    .filter(Boolean)
    .join("  ·  ");
  doc.text(pdfSafe(subtitle), margin, y);
  y += 26;

  // ── Cost summary box ──────────────────────────────────────────────────
  doc.setDrawColor(...HAIRLINE);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, y, contentW, 58, 4, 4, "S");

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(award.miles.toLocaleString(), margin + 16, y + 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(pdfSafe(`${award.programName} points`), margin + 16, y + 45);

  if (award.taxesUsd) {
    const taxesX = margin + contentW / 2;
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(fmtAud(award.taxesUsd * 1.55), taxesX, y + 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("approx. taxes & carrier fees", taxesX, y + 45);
  }

  if (award.seats > 0) {
    doc.setTextColor(...MUTED);
    doc.setFontSize(9);
    doc.text(
      `${award.seats} seat${award.seats > 1 ? "s" : ""} showing`,
      pageW - margin - 16,
      y + 45,
      { align: "right" },
    );
  }
  y += 78;

  // ── Feasibility line ──────────────────────────────────────────────────
  doc.setFontSize(10);
  if (playbook.feasible) {
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.text("You have enough points for this redemption.", margin, y);
  } else {
    doc.setTextColor(...GOLD);
    doc.setFont("helvetica", "bold");
    doc.text(
      pdfSafe(`Short by ${playbook.shortfall.toLocaleString()} points - transfer steps below.`),
      margin,
      y,
    );
  }
  y += 24;

  // ── Steps ─────────────────────────────────────────────────────────────
  doc.setDrawColor(...HAIRLINE);
  doc.line(margin, y, pageW - margin, y);
  y += 20;

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Your step-by-step plan", margin, y);
  y += 20;

  playbook.steps.forEach((step, i) => {
    newPageIfNeeded(80);

    // Numbered bullet
    doc.setFillColor(...GOLD);
    doc.circle(margin + 7, y - 3, 8, "F");
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(String(i + 1), margin + 7, y, { align: "center" });

    // Title
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const titleLines = doc.splitTextToSize(pdfSafe(step.title), contentW - 30) as string[];
    doc.text(titleLines, margin + 26, y);
    y += titleLines.length * 14 + 2;

    // Detail
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    const detailLines = doc.splitTextToSize(pdfSafe(step.detail), contentW - 30) as string[];
    newPageIfNeeded(detailLines.length * 12 + 20);
    doc.text(detailLines, margin + 26, y);
    y += detailLines.length * 12;

    // ETA + link
    const eta = etaLabel(step.etaMinutes);
    if (eta) {
      doc.setTextColor(...MUTED);
      doc.setFontSize(8.5);
      doc.text(`Typical time: ${eta}`, margin + 26, y + 12);
      y += 12;
    }
    if (step.href && step.href.startsWith("http")) {
      doc.setTextColor(...GOLD);
      doc.setFontSize(8.5);
      const linkLines = doc.splitTextToSize(step.href, contentW - 30) as string[];
      doc.textWithLink(linkLines[0], margin + 26, y + 12, { url: step.href });
      y += 12;
    }

    y += 18;
  });

  // ── Risk note ─────────────────────────────────────────────────────────
  if (playbook.riskNote) {
    newPageIfNeeded(60);
    doc.setDrawColor(...GOLD);
    const noteLines = doc.splitTextToSize(pdfSafe(playbook.riskNote), contentW - 24) as string[];
    const boxH = noteLines.length * 12 + 26;
    doc.roundedRect(margin, y, contentW, boxH, 4, 4, "S");
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Watch out", margin + 12, y + 16);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(noteLines, margin + 12, y + 30);
    y += boxH + 18;
  }

  // ── Footer on every page ──────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...HAIRLINE);
    doc.line(margin, pageH - 44, pageW - margin, pageH - 44);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      "Award space changes fast - confirm availability before transferring points.",
      margin,
      pageH - 30,
    );
    doc.text(
      pdfSafe(`miles-expert.com  ${new Date().toLocaleDateString()}  page ${p} of ${pages}`),
      pageW - margin,
      pageH - 30,
      { align: "right" },
    );
  }

  return doc;
}

export function exportPlaybookPdf(award: AwardItinerary, playbook: Playbook): void {
  const doc = buildPlaybookPdf(award, playbook);
  doc.save(
    `miles-expert-${award.from}-${award.to}-${award.cabin}.pdf`.toLowerCase().replace(/\s+/g, "-"),
  );
}
