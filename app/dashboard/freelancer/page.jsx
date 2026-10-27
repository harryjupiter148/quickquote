"use client";
import { useEffect, useState } from "react";
import { Wallet, Clock3, FolderKanban, FileText, BarChart3, PieChart } from "lucide-react";
import { useDashboard } from "@/components/dashboard/UserContext";
import PageHeader from "@/components/dashboard/PageHeader";
import StatTile from "@/components/dashboard/StatTile";
import TaxEstimator from "@/components/bento/TaxEstimator";
import TimeValueCalculator from "@/components/bento/TimeValueCalculator";
import ProjectHealthTile from "@/components/bento/ProjectHealthTile";
import InvoiceTile from "@/components/bento/InvoiceTile";
import EarningsChart from "@/components/charts/EarningsChart";
import RevenueByProjectChart from "@/components/charts/RevenueByProjectChart";
import { listInvoices, listProjects, listQuotations } from "@/lib/data";
import { naira } from "@/lib/format";

export default function FreelancerDashboard() {
  const { user } = useDashboard();
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    Promise.all([listInvoices(user.id), listProjects(user.id), listQuotations(user.id)])
      .then(([i, p, q]) => {
        setInvoices(i);
        setProjects(p);
        setQuotes(q);
      })
      .catch(console.error);
  }, [user.id]);

  const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total_amount), 0);
  const outstanding = invoices
    .filter((i) => i.status === "sent" || i.status === "approved")
    .reduce((s, i) => s + Number(i.total_amount), 0);
  const active = projects.filter((p) => p.status === "active").length;
  const atRisk = projects.filter((p) => p.status === "active" && p.health_status !== "green").length;

  return (
    <>
      <PageHeader
        title={`Hi, ${user.first_name} 👋`}
        subtitle={user.business_name ? `${user.business_name} · Freelancer dashboard` : "Freelancer dashboard"}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Wallet} label="Total earned" value={naira(paid)} hint="Paid invoices" />
        <StatTile icon={Clock3} label="Outstanding" value={naira(outstanding)} hint="Sent + approved" />
        <StatTile icon={FolderKanban} label="Active projects" value={active} hint={`${atRisk} need attention`} />
        <StatTile icon={FileText} label="Quotations" value={quotes.length} hint="Created so far" />
      </div>

      {/* Bento Tile grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TaxEstimator defaultRate={user.tax_rate ?? 7.5} />
        <TimeValueCalculator />
        <ProjectHealthTile projects={projects} className="md:col-span-2 lg:col-span-1" />
        <div className="glass p-6 md:col-span-2">
          <div className="tile-title mb-3">
            <BarChart3 size={18} className="text-sky-300" /> Earnings — last 6 months
          </div>
          <EarningsChart invoices={invoices} />
        </div>
        <InvoiceTile invoices={invoices} className="md:col-span-1 lg:col-span-1" />
        <div className="glass p-6 md:col-span-1 lg:col-span-3">
          <div className="tile-title mb-3">
            <PieChart size={18} className="text-violet-300" /> Revenue by project
          </div>
          <RevenueByProjectChart invoices={invoices} />
        </div>
      </div>
    </>
  );
}
