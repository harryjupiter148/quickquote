"use client";
import { useEffect } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [toast, onDone]);

  if (!toast) return null;
  const ok = toast.type !== "error";
  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 px-4">
      <div
        className={`glass flex items-center gap-2.5 px-4 py-3 text-sm ${
          ok ? "border-emerald-300/40" : "border-red-300/40"
        }`}
      >
        {ok ? (
          <CheckCircle2 size={18} className="text-emerald-300" />
        ) : (
          <AlertTriangle size={18} className="text-red-300" />
        )}
        <span className="text-white/90">{toast.message}</span>
      </div>
    </div>
  );
}
