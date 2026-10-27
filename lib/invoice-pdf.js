// lib/invoice-pdf.js — client-side PDF rendering with jsPDF (invoices + quotations)
import { nairaPdf, fmtDate } from "./format";

const VIOLET = [109, 76, 230];
const CYAN = [34, 211, 238];
const INK = [24, 27, 52];
const MUTED = [110, 116, 140];
const LINE = [226, 229, 240];

function drawLogo(doc, x, y, s = 14) {
  // QQ mark: gradient-ish tile (two bands) + two interlocking rings
  doc.setFillColor(...VIOLET);
  doc.roundedRect(x, y, s, s, 3.5, 3.5, "F");
  doc.setFillColor(...CYAN);
  doc.triangle(x + s, y + s * 0.35, x + s, y + s, x + s * 0.35, y + s, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.1);
  doc.circle(x + s * 0.38, y + s * 0.45, s * 0.17, "S");
  doc.line(x + s * 0.47, y + s * 0.56, x + s * 0.58, y + s * 0.67);
  doc.circle(x + s * 0.62, y + s * 0.55, s * 0.17, "S");
  doc.line(x + s * 0.71, y + s * 0.66, x + s * 0.82, y + s * 0.77);
}

/**
 * Builds the invoice/quotation PDF.
 * @param {object} d  { kind, business_name, freelancer_name, freelancer_email,
 *   invoice_number, client_name, client_email, project_title, issue_date,
 *   due_date, items:[{description,quantity,unit_price}], tax_rate, notes }
 * @returns {Promise<import('jspdf').jsPDF>}
 */
export async function buildDocumentPDF(d) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 16;
  const kind = d.kind || "INVOICE";

  // Header band
  doc.setFillColor(...INK);
  doc.rect(0, 0, W, 42, "F");
  doc.setFillColor(...VIOLET);
  doc.rect(0, 42, W, 1.4, "F");
  drawLogo(doc, M, 13, 16);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(d.business_name || d.freelancer_name || "QuickQuote Freelancer", M + 21, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 205, 230);
  doc.text([d.freelancer_name, d.freelancer_email].filter(Boolean).join("  |  ") || " ", M + 21, 26);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text(kind, W - M, 21, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 205, 230);
  doc.text(`No. ${d.invoice_number || "--"}`, W - M, 28, { align: "right" });

  // Meta row
  let y = 56;
  const col = (label, value, x) => {
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "bold");
    doc.text(label.toUpperCase(), x, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(value || "--", 58);
    doc.text(lines, x, y + 5.5);
  };
  col("Bill to", [d.client_name, d.client_email].filter(Boolean).join("\n"), M);
  col("Project", d.project_title, M + 66);
  col(kind === "QUOTATION" ? "Date / Valid until" : "Issued / Due",
    `${fmtDate(d.issue_date)}\n${fmtDate(d.due_date)}`, M + 132);

  // Line-item table
  y = 84;
  doc.setFillColor(244, 242, 255);
  doc.rect(M, y - 6, W - 2 * M, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...VIOLET);
  doc.text("DESCRIPTION", M + 3, y);
  doc.text("QTY", W - M - 78, y, { align: "right" });
  doc.text("UNIT PRICE", W - M - 42, y, { align: "right" });
  doc.text("AMOUNT", W - M - 3, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  y += 9;
  let subtotal = 0;
  (d.items || []).forEach((it) => {
    const q = parseFloat(it.quantity) || 0;
    const p = parseFloat(it.unit_price) || 0;
    subtotal += q * p;
    const desc = doc.splitTextToSize(it.description || "—", W - 2 * M - 95);
    if (y + desc.length * 5 > H - 60) {
      doc.addPage();
      y = 24;
    }
    doc.text(desc, M + 3, y);
    doc.text(String(q), W - M - 78, y, { align: "right" });
    doc.text(nairaPdf(p), W - M - 42, y, { align: "right" });
    doc.text(nairaPdf(q * p), W - M - 3, y, { align: "right" });
    y += desc.length * 5 + 3;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.2);
    doc.line(M, y - 2.5, W - M, y - 2.5);
    y += 2;
  });

  // Totals
  const rate = parseFloat(d.tax_rate) || 0;
  const tax = subtotal * (rate / 100);
  y += 4;
  const tx = W - M - 70;
  const row = (label, value, bold) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9.5);
    doc.setTextColor(...(bold ? INK : MUTED));
    doc.text(label, tx, y);
    doc.setTextColor(...INK);
    doc.text(value, W - M - 3, y, { align: "right" });
    y += bold ? 8 : 6;
  };
  row("Subtotal", nairaPdf(subtotal));
  if (kind === "QUOTATION") {
    row(`Tax deduction (${rate}%)`, "- " + nairaPdf(tax));
    doc.setFillColor(...VIOLET);
    doc.rect(tx - 4, y - 5.5, W - M - tx + 4, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Quoted total", tx, y + 1);
    doc.text(nairaPdf(subtotal), W - M - 3, y + 1, { align: "right" });
    y += 12;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(`Freelancer net take-home after tax: ${nairaPdf(subtotal - tax)}`, W - M - 3, y, { align: "right" });
  } else {
    row(`Tax (${rate}%)`, nairaPdf(tax));
    doc.setFillColor(...VIOLET);
    doc.rect(tx - 4, y - 5.5, W - M - tx + 4, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Total due", tx, y + 1);
    doc.text(nairaPdf(subtotal + tax), W - M - 3, y + 1, { align: "right" });
    y += 12;
  }

  // Notes
  if (d.notes) {
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("NOTES / PAYMENT INSTRUCTIONS", M, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    doc.text(doc.splitTextToSize(d.notes, W - 2 * M), M, y + 5.5);
  }

  // Footer
  doc.setDrawColor(...LINE);
  doc.line(M, H - 18, W - M, H - 18);
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Generated with QuickQuote — Freelance Service Quotation System", M, H - 12);
  doc.text("Thank you for your business.", W - M, H - 12, { align: "right" });

  return doc;
}
