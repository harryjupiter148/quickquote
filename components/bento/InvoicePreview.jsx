"use client";
import { LogoMark } from "@/components/ui/Logo";
import { naira, fmtDate, invoiceTotals } from "@/lib/format";

// HTML mirror of the jsPDF layout — shown on browsers that cannot display PDFs
// inline (e.g. Chrome on Android). The downloaded file is always the jsPDF one.
export default function InvoicePreview({ data }) {
  const { subtotal, tax_amount, total_amount } = invoiceTotals(data.items, data.tax_rate);
  return (
    <div className="overflow-hidden rounded-lg bg-white text-[11px] text-slate-800 shadow-2xl">
      <div className="flex items-center justify-between bg-[#181b34] px-4 py-4 text-white">
        <div className="flex items-center gap-2">
          <LogoMark size={26} />
          <div>
            <p className="text-sm font-bold">{data.business_name || data.freelancer_name || "Your business"}</p>
            <p className="text-[9px] text-white/60">{data.freelancer_email}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold tracking-wide">INVOICE</p>
          <p className="text-[9px] text-white/60">No. {data.invoice_number}</p>
        </div>
      </div>
      <div className="h-[3px] bg-[#6d4ce6]" />
      <div className="grid grid-cols-3 gap-3 px-4 py-3">
        <div>
          <p className="text-[8px] font-bold uppercase text-slate-400">Bill to</p>
          <p className="font-medium">{data.client_name || "--"}</p>
          <p className="text-slate-500">{data.client_email}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase text-slate-400">Project</p>
          <p className="font-medium">{data.project_title || "--"}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase text-slate-400">Issued / Due</p>
          <p>{fmtDate(data.issue_date)}</p>
          <p>{fmtDate(data.due_date)}</p>
        </div>
      </div>
      <div className="px-4">
        <div className="grid grid-cols-12 bg-violet-50 px-2 py-1.5 text-[8px] font-bold text-[#6d4ce6]">
          <span className="col-span-5">DESCRIPTION</span>
          <span className="col-span-2 text-right">QTY</span>
          <span className="col-span-2 text-right">UNIT</span>
          <span className="col-span-3 text-right">AMOUNT</span>
        </div>
        {data.items.map((it, i) => (
          <div key={i} className="grid grid-cols-12 border-b border-slate-100 px-2 py-1.5">
            <span className="col-span-5 break-words">{it.description || "—"}</span>
            <span className="col-span-2 text-right">{it.quantity || 0}</span>
            <span className="col-span-2 text-right">{naira(parseFloat(it.unit_price) || 0)}</span>
            <span className="col-span-3 text-right">
              {naira((parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0))}
            </span>
          </div>
        ))}
      </div>
      <div className="ml-auto w-3/5 space-y-1 px-4 py-3">
        <div className="flex justify-between text-slate-500"><span>Subtotal</span><span className="text-slate-800">{naira(subtotal)}</span></div>
        <div className="flex justify-between text-slate-500"><span>Tax ({parseFloat(data.tax_rate) || 0}%)</span><span className="text-slate-800">{naira(tax_amount)}</span></div>
        <div className="flex justify-between bg-[#6d4ce6] px-2 py-1.5 text-xs font-bold text-white"><span>Total due</span><span>{naira(total_amount)}</span></div>
      </div>
      {data.notes && (
        <div className="px-4 pb-3">
          <p className="text-[8px] font-bold uppercase text-slate-400">Notes</p>
          <p className="whitespace-pre-wrap">{data.notes}</p>
        </div>
      )}
      <p className="border-t border-slate-100 px-4 py-2 text-[8px] text-slate-400">
        Generated with QuickQuote — Freelance Service Quotation System
      </p>
    </div>
  );
}
