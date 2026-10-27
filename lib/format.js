// lib/format.js — shared formatting + calculation helpers

export const naira = (n) =>
  n === null || n === undefined || Number.isNaN(n)
    ? "--"
    : Number(n).toLocaleString("en-NG", { style: "currency", currency: "NGN" });

// jsPDF's built-in fonts have no "₦" glyph, so PDFs use the ISO code.
export const nairaPdf = (n) =>
  "NGN " +
  Number(n || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-NG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "--";

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const addDaysISO = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// Take-Home Pay = Gross Fee x (1 - Tax Rate / 100)
export function takeHome(gross, rate) {
  const fee = parseFloat(gross);
  const r = parseFloat(rate);
  if (Number.isNaN(fee) || Number.isNaN(r)) return null;
  return fee * (1 - r / 100);
}

// Required Rate = Monthly Income / Monthly Hours
export function requiredHourlyRate(income, hours) {
  const inc = parseFloat(income);
  const hrs = parseFloat(hours);
  if (Number.isNaN(inc) || Number.isNaN(hrs)) return { value: null, error: "" };
  if (hrs === 0) return { value: null, error: "Hours cannot be zero." };
  if (hrs < 0 || inc < 0) return { value: null, error: "Values cannot be negative." };
  return { value: inc / hrs, error: "" };
}

export function invoiceTotals(items, taxRate) {
  const subtotal = items.reduce(
    (sum, it) => sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0),
    0
  );
  const tax_amount = subtotal * ((parseFloat(taxRate) || 0) / 100);
  return { subtotal, tax_amount, total_amount: subtotal + tax_amount };
}

export const newInvoiceNumber = () =>
  `QQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

export const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s || "");
