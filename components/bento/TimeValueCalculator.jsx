// components/bento/TimeValueCalculator.jsx
"use client";
import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { naira, requiredHourlyRate } from "@/lib/format";

export default function TimeValueCalculator({ className = "" }) {
  const [income, setIncome] = useState("");
  const [hours, setHours] = useState("");

  // Derived during render (no setState in render) — zero-hours guard included.
  const { value, error } = requiredHourlyRate(income, hours);

  return (
    <div className={`glass flex flex-col gap-4 p-6 ${className}`}>
      <div className="tile-title">
        <TrendingUp size={18} className="text-emerald-300" />
        <span>Time-to-Value Calculator</span>
      </div>
      <input
        type="number"
        min="0"
        placeholder="Target Monthly Income (NGN)"
        value={income}
        onChange={(e) => setIncome(e.target.value)}
        className="glass-input"
      />
      <input
        type="number"
        min="0"
        placeholder="Available Monthly Hours"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        className={`glass-input ${error ? "invalid" : ""}`}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="mt-auto text-white/90">
        <p className="text-sm text-white/60">Required Hourly Rate</p>
        <p className="text-2xl font-bold">{value !== null ? `${naira(value)}/hr` : "--"}</p>
        {value !== null && (
          <p className="mt-0.5 text-xs text-white/50">Use this as your minimum pricing floor.</p>
        )}
      </div>
    </div>
  );
}
