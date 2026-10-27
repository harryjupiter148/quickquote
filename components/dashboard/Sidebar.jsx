"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FolderKanban, FileText, Receipt, Settings, Users, Activity,
  ServerCog, LogOut, Menu, X,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import StatusBadge from "@/components/ui/StatusBadge";
import { signOut } from "@/lib/data";

const MENUS = {
  freelancer: [
    { href: "/dashboard/freelancer", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/freelancer/projects", label: "My Projects", icon: FolderKanban },
    { href: "/dashboard/freelancer/quotations", label: "Quotations", icon: FileText },
    { href: "/dashboard/freelancer/invoices", label: "Invoices", icon: Receipt },
    { href: "/dashboard/freelancer/settings", label: "Profile & Settings", icon: Settings },
  ],
  admin: [
    { href: "/dashboard/admin", label: "System Dashboard", icon: ServerCog, exact: true },
    { href: "/dashboard/admin/users", label: "User Management", icon: Users },
    { href: "/dashboard/admin/metrics", label: "System Metrics", icon: Activity },
    { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
  ],
};

export default function Sidebar({ role, user }) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = MENUS[role] || [];

  const isActive = (it) => (it.exact ? pathname === it.href : pathname.startsWith(it.href));

  const logout = async () => {
    await signOut();
    router.replace("/login");
  };

  const nav = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-6 pt-6">
        <Link href={items[0]?.href || "/"} onClick={() => setOpen(false)}>
          <Logo size={34} />
        </Link>
        <button className="text-white/70 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X size={22} />
        </button>
      </div>

      <div className="mx-4 mb-5 glass-soft flex items-center gap-3 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-qq-gradient text-sm font-bold">
          {(user?.first_name?.[0] || "") + (user?.last_name?.[0] || "")}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {user ? `${user.first_name} ${user.last_name}` : "…"}
          </p>
          <StatusBadge status={role} />
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((it) => {
          const Icon = it.icon;
          const active = isActive(it);
          return (
            <Link
              key={it.href}
              href={it.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                active ? "bg-white/20 text-white shadow-glass" : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/65 transition hover:bg-red-500/15 hover:text-red-200">
          <LogOut size={18} /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-qq-night/70 px-4 py-3 backdrop-blur-md lg:hidden">
        <Logo size={30} />
        <button onClick={() => setOpen(true)} className="rounded-lg border border-white/20 bg-white/10 p-2" aria-label="Open menu">
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-white/15 bg-qq-deep/90 backdrop-blur-xl">
            {nav}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-white/10 bg-white/[.04] backdrop-blur-xl lg:block">
        {nav}
      </aside>
    </>
  );
}
