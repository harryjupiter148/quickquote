"use client";
import { useMemo } from "react";
import {
  Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { SERIES, AXIS, GRID, TOOLTIP, compactNaira } from "./chartTheme";
import { naira } from "@/lib/format";

// Earnings over the last 6 months: invoiced (all non-draft) vs paid.
export default function EarningsChart({ invoices = [] }) {
  const data = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: d.toLocaleDateString("en-NG", { month: "short" }),
        invoiced: 0,
        paid: 0,
      });
    }
    invoices.forEach((inv) => {
      if (inv.status === "draft") return;
      const d = new Date(inv.issue_date);
      const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (!m) return;
      m.invoiced += Number(inv.total_amount);
      if (inv.status === "paid") m.paid += Number(inv.total_amount);
    });
    return months;
  }, [invoices]);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          {SERIES.map((c, i) => (
            <linearGradient key={c} id={`earn${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity={0.35} />
              <stop offset="100%" stopColor={c} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="month" {...AXIS} />
        <YAxis tickFormatter={compactNaira} {...AXIS} width={52} />
        <Tooltip {...TOOLTIP} formatter={(v) => naira(v)} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,.75)" }} />
        <Area type="monotone" name="Invoiced" dataKey="invoiced" stroke={SERIES[0]} strokeWidth={2} fill="url(#earn0)" dot={false} activeDot={{ r: 4 }} />
        <Area type="monotone" name="Paid" dataKey="paid" stroke={SERIES[1]} strokeWidth={2} fill="url(#earn1)" dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
