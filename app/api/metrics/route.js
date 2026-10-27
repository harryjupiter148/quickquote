// app/api/metrics/route.js — Upstash Redis metrics endpoint for the Admin Dashboard
import { NextResponse } from "next/server";
import { redis, isUpstashConfigured } from "@/lib/upstash";

export const dynamic = "force-dynamic";

// Used only when Upstash keys are not configured (demo mode).
function simulated() {
  const t = Date.now() / 1000;
  const avg = 120 + 60 * Math.sin(t / 40) + Math.random() * 40;
  return {
    requestCount: Math.round(15 + 10 * Math.sin(t / 25) + Math.random() * 6),
    avgLatency: +avg.toFixed(2),
    peakLatency: +(avg * (1.8 + Math.random() * 2.5)).toFixed(2),
  };
}

export async function GET() {
  try {
    if (!isUpstashConfigured) {
      return NextResponse.json({ ...simulated(), timestamp: new Date().toISOString(), source: "simulated" });
    }
    const [requestCount, avgLatency, peakLatency] = await Promise.all([
      redis.get("metrics:request_count"),
      redis.get("metrics:avg_latency_ms"),
      redis.get("metrics:peak_latency_ms"),
    ]);
    return NextResponse.json({
      requestCount: Number(requestCount ?? 0),
      avgLatency: Number(avgLatency ?? 0),
      peakLatency: Number(peakLatency ?? 0),
      timestamp: new Date().toISOString(),
      source: "upstash",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch metrics", detail: err.message },
      { status: 500 }
    );
  }
}
