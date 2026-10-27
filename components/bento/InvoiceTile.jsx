"use client";
import Link from "next/link";
import { Receipt, Plus } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { naira, fmtDate } from "@/lib/format";

// Dashboard tile: click to open the Instant Invoice Generator.
export default function InvoiceTile({ invoices = [], className = "" }) {
  return (
    <div className={`glass flex flex-col gap-4 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="tile-title">
          <Receipt size={18} className="text-violet-300" />
          <span>Instant Invoice Generator</span>
        </div>
        <Link href="/dashboard/freelancer/invoices/new" className="btn-primary !px-3 !py-2 text-xs">
          <Plus size={14} /> New invoice
        </Link>
      </div>
      <p className="text-sm text-white/60">
        Fill a form, watch the PDF render live, download in one click.
      </p>
      <div className="space-y-2">
        {invoices.slice(0, 4).map((inv) => (
          <div key={inv.id} className="glass-soft flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{inv.client_name}</p>
              <p className="text-[11px] text-white/45">{inv.invoice_number} · {fmtDate(inv.issue_date)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{naira(inv.total_amount)}</p>
              <StatusBadge status={inv.status} />
            </div>
          </div>
        ))}
        {invoices.length === 0 && <p className="text-sm text-white/50">No invoices yet.</p>}
      </div>
    </div>
  );
}
