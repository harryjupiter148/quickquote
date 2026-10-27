"use client";
import { useEffect, useState } from "react";
import { Plus, FileText, Download, Trash2, X } from "lucide-react";
import { useDashboard } from "@/components/dashboard/UserContext";
import PageHeader from "@/components/dashboard/PageHeader";
import Field from "@/components/ui/Field";
import EmptyState from "@/components/ui/EmptyState";
import { createQuotation, deleteQuotation, listProjects, listQuotations } from "@/lib/data";
import { addDaysISO, fmtDate, naira, takeHome, todayISO } from "@/lib/format";
import { buildDocumentPDF } from "@/lib/invoice-pdf";

export default function QuotationsPage() {
  const { user, notify } = useDashboard();
  const [quotes, setQuotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const blank = { service_description: "", gross_amount: "", tax_rate: String(user.tax_rate ?? 7.5), expiry_date: addDaysISO(14), project_id: "", client_name: "" };
  const [form, setForm] = useState(blank);

  const load = () => listQuotations(user.id).then(setQuotes).catch((e) => notify(e.message, "error"));
  useEffect(() => {
    load();
    listProjects(user.id).then(setProjects).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const net = takeHome(form.gross_amount, form.tax_rate);

  const submit = async (e) => {
    e.preventDefault();
    if (!(parseFloat(form.gross_amount) > 0)) return notify("Enter a quoted amount above zero", "error");
    try {
      await createQuotation(user.id, form);
      setForm(blank);
      setShowForm(false);
      notify("Quotation saved");
      load();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  const download = async (q) => {
    const project = projects.find((p) => p.id === q.project_id);
    const doc = await buildDocumentPDF({
      kind: "QUOTATION",
      business_name: user.business_name,
      freelancer_name: `${user.first_name} ${user.last_name}`,
      freelancer_email: user.email,
      invoice_number: `QT-${q.id.slice(0, 6).toUpperCase()}`,
      client_name: "Prospective client",
      project_title: project?.project_name || q.service_description.slice(0, 40),
      issue_date: q.created_at,
      due_date: q.expiry_date,
      items: [{ description: q.service_description, quantity: 1, unit_price: q.gross_amount }],
      tax_rate: q.tax_rate,
    });
    doc.save(`Quotation-${q.id.slice(0, 6)}.pdf`);
  };

  const remove = async (q) => {
    if (!window.confirm("Delete this quotation?")) return;
    await deleteQuotation(q.id);
    notify("Quotation deleted");
    load();
  };

  const expired = (q) => q.expiry_date && q.expiry_date < todayISO();

  return (
    <>
      <PageHeader
        title="Quotations"
        subtitle="Price a job, see your net take-home, and send a clean PDF quote."
        action={
          <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
            {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? "Close" : "Create quotation"}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={submit} className="glass mb-6 grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <Field label="Services being quoted" className="sm:col-span-2">
            <textarea required rows={2} className="glass-input" value={form.service_description} onChange={(e) => setForm({ ...form, service_description: e.target.value })} placeholder="e.g. 5-page portfolio website with contact form" />
          </Field>
          <Field label="Gross amount (NGN)">
            <input type="number" min="0" required className="glass-input" value={form.gross_amount} onChange={(e) => setForm({ ...form, gross_amount: e.target.value })} />
          </Field>
          <Field label="Tax rate (%)">
            <input type="number" min="0" max="100" required className="glass-input" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
          </Field>
          <Field label="Valid until">
            <input type="date" className="glass-input" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
          </Field>
          <Field label="Link to project (optional)">
            <select className="glass-input" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              <option value="">— None —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </select>
          </Field>
          <div className="glass-soft flex items-center justify-between p-4 sm:col-span-2">
            <span className="text-sm text-white/60">Your net take-home</span>
            <span className="text-xl font-bold">{naira(net)}</span>
          </div>
          <button className="btn-primary sm:col-span-2">Save quotation</button>
        </form>
      )}

      {quotes.length === 0 ? (
        <EmptyState icon={FileText} title="No quotations yet">Create your first quotation to price a job.</EmptyState>
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <div key={q.id} className="glass flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{q.service_description}</p>
                <p className="mt-0.5 text-xs text-white/50">
                  Created {fmtDate(q.created_at)} · {expired(q) ? <span className="text-red-300">expired {fmtDate(q.expiry_date)}</span> : `valid until ${fmtDate(q.expiry_date)}`}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm sm:w-[340px]">
                <div><p className="text-[11px] text-white/45">Gross</p><p className="font-semibold">{naira(q.gross_amount)}</p></div>
                <div><p className="text-[11px] text-white/45">Tax</p><p>{q.tax_rate}%</p></div>
                <div><p className="text-[11px] text-white/45">Net</p><p className="font-semibold text-emerald-300">{naira(q.net_amount)}</p></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => download(q)} className="btn-ghost !py-2 text-xs"><Download size={14} /> PDF</button>
                <button onClick={() => remove(q)} className="btn-danger !px-2.5 !py-2" aria-label="Delete quotation"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
