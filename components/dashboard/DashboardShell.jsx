"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FlaskConical } from "lucide-react";
import Sidebar from "./Sidebar";
import Toast from "@/components/ui/Toast";
import { UserContext } from "./UserContext";
import { getCurrentUser, isDemo, signOut } from "@/lib/data";

const HOME = { freelancer: "/dashboard/freelancer", admin: "/dashboard/admin" };

// Role-specific layout shell. Middleware already protects these routes on the
// server; this is the client-side guard + shared user context.
export default function DashboardShell({ role, children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let alive = true;
    getCurrentUser().then(async (u) => {
      if (!alive) return;
      if (!u) return router.replace("/login");
      if (!u.is_active) {
        await signOut();
        return router.replace("/login");
      }
      if (u.role !== role) return router.replace(HOME[u.role] || "/login");
      setUser(u);
    });
    return () => {
      alive = false;
    };
  }, [role, router]);

  const notify = useCallback((message, type = "success") => setToast({ message, type }), []);
  const clearToast = useCallback(() => setToast(null), []);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white/60">
        <Loader2 className="mr-2 animate-spin" size={20} /> Loading your dashboard…
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, setUser, notify }}>
      <Sidebar role={role} user={user} />
      <main className="min-h-screen px-4 pb-16 pt-5 sm:px-6 lg:ml-64 lg:px-10 lg:pt-8">
        {isDemo && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3.5 py-2 text-xs text-amber-100">
            <FlaskConical size={15} />
            Demo mode — data is saved in this browser. Add Supabase & Upstash keys in .env.local for live mode.
          </div>
        )}
        {children}
      </main>
      <Toast toast={toast} onDone={clearToast} />
    </UserContext.Provider>
  );
}
