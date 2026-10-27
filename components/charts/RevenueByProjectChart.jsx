"use client";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SERIES, AXIS, GRID, TOOLTIP, compactNaira } from "./chartTheme";
import { naira } from "@/lib/format";

// Revenue breakdown by project (single series — the title names it, no legend).
export default function RevenueByProjectChart({ invoices = [] }) {
  const data = useMemo(() => {
    const map = new Map();
    invoices
      .filter((i) => i.status !== "draft")
      .forEach((i) => {
        const k = i.project_title || "Other";
        map.set(k, (map.get(k) || 0) + Number(i.total_amount));
      });
    return [...map.entries()]
      .map(([name, value]) => ({ name, short: name.length > 14 ? name.slice(0, 13) + "…" : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [invoices]);

  if (!data.length) return <p className="py-10 text-center text-sm text-white/50">No revenue yet.</p>;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }} barCategoryGap={6}>
        <CartesianGrid {...GRID} vertical horizontal={false} />
        <XAxis type="number" tickFormatter={compactNaira} {...AXIS} />
        <YAxis type="category" dataKey="short" {...AXIS} width={104} />
        <Tooltip
          {...TOOLTIP}
          cursor={{ fill: "rgba(255,255,255,0.06)" }}
          formatter={(v) => [naira(v), "Revenue"]}
          labelFormatter={(_, p) => p?.[0]?.payload?.name}
        />
        <Bar dataKey="value" fill={SERIES[0]} radius={[0, 4, 4, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
