// lib/upstash.js — Upstash Redis client + request/latency tracking
// "/cloudflare" is the fetch-based build: runs in both the Edge middleware and Node routes
import { Redis } from "@upstash/redis/cloudflare";

export const isUpstashConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

export const redis = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const WINDOW_SECONDS = 60; // "requests in the last 60-second window"
const SAMPLE_SIZE = 100; // latency samples kept for the average/peak

/**
 * Records one API/page request and its latency.
 * Keys read by app/api/metrics/route.js:
 *   metrics:request_count, metrics:avg_latency_ms, metrics:peak_latency_ms
 */
export async function trackRequest(latencyMs) {
  if (!redis) return;
  try {
    const count = await redis.incr("metrics:request_count");
    if (count === 1) await redis.expire("metrics:request_count", WINDOW_SECONDS);

    await redis.lpush("metrics:latency_samples", Math.round(latencyMs));
    await redis.ltrim("metrics:latency_samples", 0, SAMPLE_SIZE - 1);

    const samples = (await redis.lrange("metrics:latency_samples", 0, -1)).map(Number);
    const avg = samples.reduce((a, b) => a + b, 0) / (samples.length || 1);
    const peak = Math.max(0, ...samples);

    await redis.set("metrics:avg_latency_ms", avg.toFixed(2), { ex: WINDOW_SECONDS * 5 });
    await redis.set("metrics:peak_latency_ms", peak, { ex: WINDOW_SECONDS * 5 });
  } catch (err) {
    console.error("[upstash] trackRequest failed:", err.message);
  }
}
