// components/bento/InvoiceGenerator.jsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Receipt, Plus, Trash2, Download, Save, Loader2, Eye } from "lucide-react";
import Field from "@/components/ui/Field";
import InvoicePreview from "./InvoicePreview";
import { buildDocumentPDF } from "@/lib/invoice-pdf";
import { createInvoice, uploadInvoicePdf } from "@/lib/data";
import {
  addDaysISO, invoiceTotals, isEmail, naira, newInvoiceNumber, todayISO,
} from "@/lib/format";

const emptyItem = () => ({ description: "", quantity: "1", unit_price: "" });

export default function InvoiceGenerator({ user, projects = [], onSaved }) {
  const [form, setForm] = useState(() => ({
    client_name: "",
    client_email: "",
    business_name: user?.business_name || "",
    invoice_number: newInvoiceNumber(),
    issue_date: todayISO(),
    due_date: addDaysISO(14),
    project_title: "",
    project_id: "",
    tax_rate: String(user?.tax_rate ?? 7.5),
    notes: "",
    items: [emptyItem()],
  }));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [canShowPdf, setCanShowPdf] = useState(true);
  const urlRef = useRef(null);

  // Browsers without an inline PDF viewer (Android Chrome) get the HTML mirror.
  useEffect(() => {
    const ok = typeof navigator !== "undefined" && navigator.pdfViewerEnabled !== false;
    setCanShowPdf(ok && window.matchMedia("(min-width: 1024px)").matches);
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setItem = (i, k, v) =>
    setForm((f) => ({ ...f, items: f.items.map((it, j) => (j === i ? { ...it, [k]: v } : it)) }));

  const docData = useMemo(
    () => ({
      ...form,
      kind: "INVOICE",
      freelancer_name: user ? `${user.first_name} ${user.last_name}` : "",
      freelancer_email: user?.email,
    }),
    [form, user]
  );
  const totals = invoiceTotals(form.items, form.tax_rate);

  // Live render: rebuild the jsPDF document on every change (debounced).
  useEffect(() => {
    if (!canShowPdf) return;
    const t = setTimeout(async () => {
      const doc = await buildDocumentPDF(docData);
      const url = URL.createObjectURL(doc.output("blob"));
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      setPdfUrl(url);
    }, 250);
    return () => clearTimeout(t);
  }, [docData, canShowPdf]);

  useEffect(() => () => urlRef.current && URL.revokeObjectURL(urlRef.current), []);

  const validate = () => {
    const e = {};
    if (!form.client_name.trim()) e.client_name = "Client name is required";
    if (!isEmail(form.client_email)) e.client_email = "Enter a valid email";
    if (!form.project_title.trim()) e.project_title = "Project title is required";
    if (!form.issue_date) e.issue_date = "Required";
    form.items.forEach((it, i) => {
      if (!it.description.trim()) e[`item${i}d`] = "Required";
      if (!(parseFloat(it.unit_price) > 0)) e[`item${i}p`] = "> 0";
      if (!(parseFloat(it.quantity) > 0)) e[`item${i}q`] = "> 0";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (status) => {
    if (!validate()) return;
    setBusy(status);
    try {
      const doc = await buildDocumentPDF(docData);
      if (status === "sent") doc.save(`${form.invoice_number}.pdf`);
      const invoice = await createInvoice(user.id, { ...form, status });
      if (status === "sent") await uploadInvoicePdf(user.id, invoice.id, doc.output("blob"));
      onSaved?.(invoice, status);
      setForm((f) => ({
        ...f,
        client_name: "", client_email: "", project_title: "", project_id: "", notes: "",
        invoice_number: newInvoiceNumber(), items: [emptyItem()],
      }));
      setErrors({});
    } catch (err) {
      onSaved?.(null, "error", err.message);
    } finally {
      setBusy(null);
    }
  };

  const pickProject = (id) => {
    const p = projects.find((x) => x.id === id);
    setForm((f) => ({ ...f, project_id: id, project_title: p ? p.project_name : f.project_title }));
  };

  const cls = (k) => `glass-input ${errors[k] ? "invalid" : ""}`;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {/* Left panel: form */}
      <div className="glass space-y-5 p-5 sm:p-6">
        <div className="tile-title">
          <Receipt size={18} className="text-violet-300" /> Invoice details
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Client name" error={errors.client_name}>
            <input className={cls("client_name")} value={form.client_name} onChange={(e) => set("client_name", e.target.value)} placeholder="e.g. UNN Bookshop" />
          </Field>
          <Field label="Client email" error={errors.client_email}>
            <input type="email" className={cls("client_email")} value={form.client_email} onChange={(e) => set("client_email", e.target.value)} placeholder="client@email.com" />
          </Field>
          <Field label="Your business name">
            <input className="glass-input" value={form.business_name} onChange={(e) => set("business_name", e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Invoice number">
            <input className="glass-input font-mono" value={form.invoice_number} onChange={(e) => set("invoice_number", e.target.value)} />
          </Field>
          <Field label="Invoice date" error={errors.issue_date}>
            <input type="date" className={cls("issue_date")} value={form.issue_date} onChange={(e) => set("issue_date", e.target.value)} />
          </Field>
          <Field label="Payment due date">
            <input type="date" className="glass-input" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
          </Field>
          {projects.length > 0 && (
            <Field label="Link to project">
              <select className="glass-input" value={form.project_id} onChange={(e) => pickProject(e.target.value)}>
                <option value="">— None —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.project_name}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Project title / description" error={errors.project_title} className={projects.length ? "" : "sm:col-span-2"}>
            <input className={cls("project_title")} value={form.project_title} onChange={(e) => set("project_title", e.target.value)} placeholder="e.g. Website redesign" />
          </Field>
        </div>

        <div>
          <span className="label">Line items</span>
          <div className="space-y-2.5">
            {form.items.map((it, i) => (
              <div key={i} className="glass-soft grid grid-cols-12 gap-2 p-2.5">
                <input className={`${cls(`item${i}d`)} col-span-12 sm:col-span-6`} placeholder="Description" value={it.description} onChange={(e) => setItem(i, "description", e.target.value)} />
                <input type="number" min="0" className={`${cls(`item${i}q`)} col-span-3 sm:col-span-2 !px-2.5`} placeholder="Qty" value={it.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} />
                <input type="number" min="0" className={`${cls(`item${i}p`)} col-span-6 sm:col-span-3 !px-2.5`} placeholder="Unit price" value={it.unit_price} onChange={(e) => setItem(i, "unit_price", e.target.value)} />
                <button
                  type="button"
                  disabled={form.items.length === 1}
                  onClick={() => set("items", form.items.filter((_, j) => j !== i))}
                  className="col-span-3 flex items-center justify-center rounded-lg text-white/50 hover:bg-red-500/15 hover:text-red-200 disabled:opacity-30 sm:col-span-1"
                  aria-label="Remove line item"
                >
                  <Trash2 size={16} />
                </button>
                <p className="col-span-12 text-right text-xs text-white/50">
                  Line total: {naira((parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0))}
                </p>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => set("items", [...form.items, emptyItem()])} className="btn-ghost mt-2.5 !py-2 text-xs">
            <Plus size={14} /> Add Line Item
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tax rate (%)">
            <input type="number" min="0" max="100" className="glass-input" value={form.tax_rate} onChange={(e) => set("tax_rate", e.target.value)} />
          </Field>
          <div className="glass-soft space-y-1 p-3 text-sm">
            <div className="flex justify-between text-white/60"><span>Subtotal</span><span className="text-white">{naira(totals.subtotal)}</span></div>
            <div className="flex justify-between text-white/60"><span>Tax</span><span className="text-white">{naira(totals.tax_amount)}</span></div>
            <div className="flex justify-between font-bold"><span>Total</span><span>{naira(totals.total_amount)}</span></div>
          </div>
        </div>

        <Field label="Notes / payment instructions">
          <textarea rows={2} className="glass-input" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. Pay to GTBank 0123456789 — Ada Okafor" />
        </Field>

        {Object.keys(errors).length > 0 && (
          <p className="text-sm text-red-300">Fill the highlighted fields to download the PDF.</p>
        )}

        <div className="flex flex-wrap gap-3">
          <button onClick={() => save("sent")} disabled={!!busy} className="btn-primary flex-1">
            {busy === "sent" ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download PDF
          </button>
          <button onClick={() => save("draft")} disabled={!!busy} className="btn-ghost">
            {busy === "draft" ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save draft
          </button>
        </div>
      </div>

      {/* Right panel: live preview */}
      <div className="glass flex flex-col p-4 sm:p-5 xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
        <div className="tile-title mb-3 text-sm">
          <Eye size={16} className="text-cyan-300" /> Live preview
          <span className="ml-auto text-[11px] font-normal text-white/45">
            {canShowPdf ? "jsPDF render" : "layout preview"}
          </span>
        </div>
        {canShowPdf ? (
          <div className="flex-1 overflow-hidden rounded-lg bg-white/90">
            {pdfUrl ? (
              <iframe title="Invoice PDF preview" src={`${pdfUrl}#toolbar=0&view=FitH`} className="h-full min-h-[560px] w-full" />
            ) : (
              <div className="flex h-full min-h-[300px] items-center justify-center text-slate-500">
                <Loader2 className="animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <InvoicePreview data={docData} />
        )}
      </div>
    </div>
  );
}
