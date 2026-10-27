"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Receipt, Download } from "lucide-react";
import { useDashboard } from "@/components/dashboard/UserContext";
import PageHeader from "@/components/dashboard/PageHeader";
import Tabs from "@/components/dashboard/Tabs";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { listInvoices, updateInvoiceStatus } from "@/lib/data";
import { fmtDate, naira } from "@/lib/format";
import { buildDocumentPDF } from "@/lib/invoice-pdf";

const TABS = ["all", "draft", "sent", "approved", "paid"];

export default function InvoicesPage() {
  const { user, notify } = useDashboard();
  const [invoices, setInvoices] = useState([]);
  const [tab, setTab] = useState("all");

  const load = () => listInvoices(user.id).then(setInvoices).catch((e) => notify(e.message, "error"));
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setStatus = async (inv, status) => {
    try {
      await updateInvoiceStatus(inv.id, status);
      notify(`Invoice marked ${status}`);
      load();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const download = async (inv) => {
    const doc = await buildDocumentPDF({
      ...inv,
      kind: "INVOICE",
      business_name: user.business_name,
      freelancer_name: `${user.first_name} ${user.last_name}`,
      freelancer_email: user.email,
      items: inv.invoice_line_items || [],
    });
    doc.save(`${inv.invoice_number || "invoice"}.pdf`);
  };

  const shown = tab === "all" ? invoices : invoices.filter((i) => i.status === tab);

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Every invoice you've generated, with its payment status."
        action={
          <Link href="/dashboard/freelancer/invoices/new" className="btn-primary">
            <Plus size={16} /> Create New Invoice
          </Link>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={TABS.map((t) => ({
          value: t,
          label: t === "all" ? "All Invoices" : t[0].toUpperCase() + t.slice(1),
          count: t === "all" ? invoices.length : invoices.filter((i) => i.status === t).length,
        }))}
      />

      {shown.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices here">Generate an invoice and it will appear in this list.</EmptyState>
      ) : (
        <div className="glass overflow-hidden">
          <div className="hidden grid-cols-12 gap-3 border-b border-white/10 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-white/45 md:grid">
            <span className="col-span-3">Client</span>
            <span className="col-span-3">Project</span>
            <span className="col-span-2">Issued / Due</span>
            <span className="col-span-2 text-right">Total</span>
            <span className="col-span-2 text-right">Status</span>
          </div>
          {shown.map((inv) => (
            <div key={inv.id} className="grid grid-cols-2 items-center gap-3 border-b border-white/10 px-5 py-4 last:border-0 md:grid-cols-12">
              <div className="md:col-span-3">
                <p className="font-semibold">{inv.client_name}</p>
                <p className="font-mono text-[11px] text-white/45">{inv.invoice_number}</p>
              </div>
              <p className="truncate text-sm text-white/70 md:col-span-3">{inv.project_title}</p>
              <p className="text-xs text-white/55 md:col-span-2">
                {fmtDate(inv.issue_date)}<br />{fmtDate(inv.due_date)}
              </p>
              <p className="text-right font-bold md:col-span-2">{naira(inv.total_amount)}</p>
              <div className="col-span-2 flex items-center justify-end gap-2 md:col-span-2">
                <select
                  value={inv.status}
                  onChange={(e) => setStatus(inv, e.target.value)}
                  className="rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-xs outline-none"
                  aria-label="Invoice status"
                >
                  {TABS.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <StatusBadge status={inv.status} />
                <button onClick={() => download(inv)} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Download PDF">
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
