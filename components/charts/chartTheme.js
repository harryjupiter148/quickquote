// Shared Recharts styling (palette validated for CVD separation on the dark glass surface)
export const SERIES = ["#a855f7", "#0ea5c4"]; // violet, cyan — fixed order
export const AXIS = { stroke: "rgba(255,255,255,0.35)", fontSize: 11, tickLine: false, axisLine: false };
export const GRID = { stroke: "rgba(255,255,255,0.08)", vertical: false };
export const TOOLTIP = {
  contentStyle: {
    background: "rgba(18,24,69,0.92)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 12,
    color: "#fff",
    fontSize: 12,
    backdropFilter: "blur(8px)",
  },
  labelStyle: { color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  itemStyle: { color: "#fff" },
  cursor: { stroke: "rgba(255,255,255,0.25)", strokeWidth: 1 },
};

export const compactNaira = (v) =>
  v >= 1e6 ? `₦${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `₦${Math.round(v / 1e3)}k` : `₦${v}`;
