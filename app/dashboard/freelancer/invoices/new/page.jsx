"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useDashboard } from "@/components/dashboard/UserContext";
import PageHeader from "@/components/dashboard/PageHeader";
import InvoiceGenerator from "@/components/bento/InvoiceGenerator";
import { listProjects } from "@/lib/data";

export default function NewInvoicePage() {
  const { user, notify } = useDashboard();
  const router = useRouter();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    listProjects(user.id).then((p) => setProjects(p.filter((x) => x.status === "active"))).catch(() => {});
  }, [user.id]);

  const onSaved = (invoice, status, message) => {
    if (status === "error") return notify(message || "Could not save invoice", "error");
    notify(status === "draft" ? "Draft saved" : "PDF downloaded · invoice saved as Sent");
    setTimeout(() => router.push("/dashboard/freelancer/invoices"), 900);
  };

  return (
    <>
      <PageHeader
        title="Instant Invoice Generator"
        subtitle="Complete the form on the left — the PDF preview updates as you type."
        action={
          <Link href="/dashboard/freelancer/invoices" className="btn-ghost">
            <ArrowLeft size={16} /> All invoices
          </Link>
        }
      />
      <InvoiceGenerator user={user} projects={projects} onSaved={onSaved} />
    </>
  );
}
