/**
 * Fixed-window per-key limiter kept in process memory.
 *
 * Good enough to stop a single visitor from burning through model credits.
 * Known limitation: on serverless each instance keeps its own counters, so
 * the effective limit is "per instance" and resets on cold start. Swap for
 * Upstash/KV when roasts get persisted (the "Shareable" tier).
 */
const WINDOW_MS = 60 * 60 * 1000;
export const ROASTS_PER_WINDOW = 5;

const buckets = new Map<string, { count: number; resetAt: number }>();

export function takeToken(key: string): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    sweep(now);
    return { ok: true, retryAfterSec: 0 };
  }

  if (bucket.count >= ROASTS_PER_WINDOW) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

function sweep(now: number) {
  if (buckets.size < 2000) return;
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";
  return ip;
}
