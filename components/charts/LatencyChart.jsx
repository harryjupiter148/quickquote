"use client";
import {
  CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { SERIES, AXIS, GRID, TOOLTIP } from "./chartTheme";

// Average vs peak latency across the polling session (one axis: milliseconds).
export default function LatencyChart({ history = [] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={history} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="time" {...AXIS} minTickGap={24} />
        <YAxis {...AXIS} unit="ms" width={58} />
        <Tooltip {...TOOLTIP} formatter={(v) => `${Number(v).toFixed(1)} ms`} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,.75)" }} />
        <ReferenceLine y={500} stroke="rgba(251,191,36,.5)" strokeDasharray="4 4" label={{ value: "500ms", fill: "rgba(251,191,36,.8)", fontSize: 10, position: "insideTopRight" }} />
        <Line type="monotone" name="Avg latency" dataKey="avgLatency" stroke={SERIES[1]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
        <Line type="monotone" name="Peak latency" dataKey="peakLatency" stroke={SERIES[0]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
