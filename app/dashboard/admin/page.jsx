"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserCheck, UserX, Database, HardDrive, Server, ArrowRight, CheckCircle2, CircleDashed } from "lucide-react";
import { useDashboard } from "@/components/dashboard/UserContext";
import PageHeader from "@/components/dashboard/PageHeader";
import StatTile from "@/components/dashboard/StatTile";
import MetricsPanel from "@/components/dashboard/MetricsPanel";
import StatusBadge from "@/components/ui/StatusBadge";
import { isDemo, listUsers } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export default function AdminDashboard() {
  const { user } = useDashboard();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    listUsers().then(setUsers).catch(console.error);
  }, []);

  const freelancers = users.filter((u) => u.role === "freelancer");
  const inactive = users.filter((u) => !u.is_active);

  const services = [
    { name: "Supabase (Postgres + Auth + RLS)", icon: Database, live: !isDemo },
    { name: "Upstash Redis (metrics)", icon: HardDrive, live: null },
    { name: "Next.js middleware (route protection)", icon: Server, live: true },
  ];

  return (
    <>
      <PageHeader title="System Dashboard" subtitle={`Signed in as ${user.first_name} · Administrator`} />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Users} label="Total users" value={users.length} />
        <StatTile icon={UserCheck} label="Freelancers" value={freelancers.length} />
        <StatTile icon={UserX} label="Inactive" value={inactive.length} hint="Deactivated accounts" />
        <StatTile icon={Server} label="Mode" value={isDemo ? "Demo" : "Live"} hint={isDemo ? "Browser data store" : "Supabase connected"} />
      </div>

      <MetricsPanel />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="glass p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="tile-title">Newest users</p>
            <Link href="/dashboard/admin/users" className="text-xs text-white/60 hover:text-white">
              Manage <ArrowRight size={12} className="inline" />
            </Link>
          </div>
          {users.slice(0, 5).map((u) => (
            <div key={u.id} className="flex items-center justify-between border-b border-white/10 py-2.5 last:border-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{u.first_name} {u.last_name}</p>
                <p className="text-[11px] text-white/45">{u.email} · {fmtDate(u.created_at)}</p>
              </div>
              <StatusBadge status={u.is_active ? u.role : "inactive"} />
            </div>
          ))}
        </div>

        <div className="glass p-5 sm:p-6">
          <p className="tile-title mb-3">System health</p>
          {services.map(({ name, icon: Icon, live }) => (
            <div key={name} className="flex items-center justify-between border-b border-white/10 py-3 last:border-0">
              <span className="flex items-center gap-2.5 text-sm"><Icon size={16} className="text-white/60" /> {name}</span>
              {live === false ? (
                <span className="flex items-center gap-1 text-xs text-amber-300"><CircleDashed size={13} /> Demo</span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-emerald-300"><CheckCircle2 size={13} /> {live === null ? "See metrics source" : "Operational"}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
