"use client";
import { useEffect, useState } from "react";
import { Users, Eye, UserX, UserCheck, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useDashboard } from "@/components/dashboard/UserContext";
import PageHeader from "@/components/dashboard/PageHeader";
import Tabs from "@/components/dashboard/Tabs";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { listUsers, setUserActive } from "@/lib/data";
import { fmtDate } from "@/lib/format";

const PAGE = 8;

export default function UserManagement() {
  const { user: me, notify } = useDashboard();
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(0);
  const [viewing, setViewing] = useState(null);

  const load = () => listUsers().then(setUsers).catch((e) => notify(e.message, "error"));
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (u) => {
    try {
      await setUserActive(u.id, !u.is_active);
      notify(u.is_active ? `${u.first_name} deactivated` : `${u.first_name} reactivated`);
      load();
    } catch (e) {
      notify(e.message, "error");
    }
  };

  const filtered =
    tab === "freelancers" ? users.filter((u) => u.role === "freelancer")
    : tab === "inactive" ? users.filter((u) => !u.is_active)
    : users;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <>
      <PageHeader title="User Management" subtitle="View profiles and activate or deactivate accounts." />
      <Tabs
        value={tab}
        onChange={(t) => {
          setTab(t);
          setPage(0);
        }}
        tabs={[
          { value: "all", label: "All Users", count: users.length },
          { value: "freelancers", label: "Freelancers", count: users.filter((u) => u.role === "freelancer").length },
          { value: "inactive", label: "Inactive Accounts", count: users.filter((u) => !u.is_active).length },
        ]}
      />

      {shown.length === 0 ? (
        <EmptyState icon={Users} title="No users in this view" />
      ) : (
        <div className="glass overflow-hidden">
          {shown.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 border-b border-white/10 px-5 py-3.5 last:border-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xs font-bold">
                {u.first_name?.[0]}{u.last_name?.[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{u.first_name} {u.last_name}</p>
                <p className="truncate text-xs text-white/45">{u.email}</p>
              </div>
              <StatusBadge status={u.role} />
              {!u.is_active && <StatusBadge status="inactive" />}
              <div className="flex gap-2">
                <button onClick={() => setViewing(u)} className="btn-ghost !px-2.5 !py-1.5 text-xs"><Eye size={14} /> View Profile</button>
                {u.id !== me.id && (
                  u.is_active ? (
                    <button onClick={() => toggle(u)} className="btn-danger !px-2.5 !py-1.5 text-xs"><UserX size={14} /> Deactivate</button>
                  ) : (
                    <button onClick={() => toggle(u)} className="btn-ghost !px-2.5 !py-1.5 text-xs text-emerald-200"><UserCheck size={14} /> Reactivate</button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <button disabled={page === 0} onClick={() => setPage(page - 1)} className="btn-ghost !p-2"><ChevronLeft size={16} /></button>
          <span className="text-white/60">Page {page + 1} of {pages}</span>
          <button disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className="btn-ghost !p-2"><ChevronRight size={16} /></button>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setViewing(null)}>
          <div className="glass w-full max-w-sm bg-qq-deep/80 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">{viewing.first_name} {viewing.last_name}</p>
              <button onClick={() => setViewing(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <dl className="space-y-2.5 text-sm">
              {[
                ["Email", viewing.email],
                ["Role", viewing.role],
                ["Business name", viewing.business_name || "—"],
                ["Default tax rate", viewing.tax_rate != null ? `${viewing.tax_rate}%` : "—"],
                ["Status", viewing.is_active ? "Active" : "Inactive"],
                ["Registered", fmtDate(viewing.created_at)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-white/10 pb-2 last:border-0">
                  <dt className="text-white/50">{k}</dt>
                  <dd className="text-right capitalize-first">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </>
  );
}
