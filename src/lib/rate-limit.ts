// Simple in-memory sliding-window rate limiter.
//
// This is intentionally lightweight and process-local: it resets if the
// server restarts, and it does NOT coordinate across multiple instances
// (e.g. if this app is ever run with PM2 cluster mode or behind a load
// balancer fanning out to several processes/containers). For a typical
// single-instance self-hosted deployment that's sufficient; if this app
// ever runs as more than one process, this should be swapped for a
// shared store (Redis, etc.) instead.

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Periodically forget old buckets so this map doesn't grow forever across
// a long-running process.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > 60 * 60 * 1000) buckets.delete(key);
  }
}, 10 * 60 * 1000);

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((windowMs - (now - bucket.windowStart)) / 1000),
    };
  }

  bucket.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}
