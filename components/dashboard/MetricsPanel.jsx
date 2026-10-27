"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Gauge, Zap, Timer, AlertTriangle, CheckCircle2, LineChart as LineIcon } from "lucide-react";
import LatencyChart from "@/components/charts/LatencyChart";
import { fetchMetrics, saveMetricsSnapshot } from "@/lib/data";
import { useDashboard } from "./UserContext";

const REFRESH_MS = 30_000;

// >500ms amber, >1000ms red — always paired with an icon + label (not colour alone)
function latencyTone(ms) {
  if (ms > 1000) return { cls: "text-red-300", label: "Critical", Icon: AlertTriangle };
  if (ms > 500) return { cls: "text-amber-300", label: "Slow", Icon: AlertTriangle };
  return { cls: "text-emerald-300", label: "Healthy", Icon: CheckCircle2 };
}

export default function MetricsPanel({ onSnapshot }) {
  const { user, notify } = useDashboard();
  const [m, setM] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_MS / 1000);
  const nextAt = useRef(Date.now() + REFRESH_MS);

  const load = useCallback(async (manual = false) => {
    setLoading(true);
    const data = await fetchMetrics();
    setM(data);
    setHistory((h) =>
      [...h, { ...data, time: new Date(data.timestamp).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }].slice(-30)
    );
    nextAt.current = Date.now() + REFRESH_MS;
    setLoading(false);
    if (manual) {
      await saveMetricsSnapshot(user.id, data);
      onSnapshot?.();
      notify("Metrics refreshed & snapshot logged");
    }
  }, [user.id, notify, onSnapshot]);

  // setInterval polling pattern (every 30 seconds)
  useEffect(() => {
    load();
    const poll = setInterval(() => load(), REFRESH_MS);
    const tick = setInterval(() => setCountdown(Math.max(0, Math.round((nextAt.current - Date.now()) / 1000))), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [load]);

  const avg = latencyTone(m?.avgLatency || 0);
  const peak = latencyTone(m?.peakLatency || 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-white/50">
          Source: <span className="font-semibold text-white/75">{m?.source === "upstash" ? "Upstash Redis (live)" : "Simulated (add Upstash keys for live data)"}</span>
          {" · "}auto-refresh in {countdown}s
        </p>
        <button onClick={() => load(true)} disabled={loading} className="btn-ghost !py-2 text-xs">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/55"><Zap size={14} /> API requests</p>
          <p className="mt-2 text-3xl font-extrabold">{m ? m.requestCount : "--"}</p>
          <p className="text-xs text-white/45">in the last 60-second window</p>
        </div>
        <div className="glass p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/55"><Gauge size={14} /> Avg response latency</p>
          <p className={`mt-2 text-3xl font-extrabold ${avg.cls}`}>{m ? `${m.avgLatency.toFixed(0)}ms` : "--"}</p>
          <p className={`flex items-center gap-1 text-xs ${avg.cls}`}><avg.Icon size={12} /> {avg.label}</p>
        </div>
        <div className="glass p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/55"><Timer size={14} /> Peak latency</p>
          <p className={`mt-2 text-3xl font-extrabold ${peak.cls}`}>{m ? `${m.peakLatency.toFixed(0)}ms` : "--"}</p>
          <p className={`flex items-center gap-1 text-xs ${peak.cls}`}><peak.Icon size={12} /> {peak.label}</p>
        </div>
      </div>

      <div className="glass p-5 sm:p-6">
        <div className="tile-title mb-3">
          <LineIcon size={18} className="text-cyan-300" /> Latency this session
        </div>
        {history.length < 2 ? (
          <p className="py-10 text-center text-sm text-white/50">Collecting data points… (one every 30s, or press Refresh)</p>
        ) : (
          <LatencyChart history={history} />
        )}
      </div>
    </div>
  );
}
