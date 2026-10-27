"use client";
import { useCallback, useEffect, useState } from "react";
import { History } from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import MetricsPanel from "@/components/dashboard/MetricsPanel";
import EmptyState from "@/components/ui/EmptyState";
import { listMetricsSnapshots } from "@/lib/data";

export default function MetricsPage() {
  const [snaps, setSnaps] = useState([]);
  const load = useCallback(() => listMetricsSnapshots().then(setSnaps), []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="System Metrics"
        subtitle="Real-time API request counts and response latency from Upstash Redis."
      />
      <MetricsPanel onSnapshot={load} />

      <h2 className="mb-3 mt-8 flex items-center gap-2 text-lg font-bold">
        <History size={18} /> Snapshot log <span className="text-xs font-normal text-white/45">(system_metrics table)</span>
      </h2>
      {snaps.length === 0 ? (
        <EmptyState icon={History} title="No snapshots yet">Press Refresh to record a manual snapshot.</EmptyState>
      ) : (
        <div className="glass overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wide text-white/45">
              <tr className="border-b border-white/10">
                <th className="px-5 py-3">Recorded at</th>
                <th className="px-5 py-3 text-right">API requests</th>
                <th className="px-5 py-3 text-right">Avg latency</th>
              </tr>
            </thead>
            <tbody>
              {snaps.map((s) => (
                <tr key={s.id} className="border-b border-white/10 last:border-0">
                  <td className="px-5 py-3 text-white/75">{new Date(s.recorded_at).toLocaleString("en-NG")}</td>
                  <td className="px-5 py-3 text-right font-semibold">{s.api_request_count}</td>
                  <td className="px-5 py-3 text-right">{Number(s.avg_latency_ms).toFixed(1)} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
