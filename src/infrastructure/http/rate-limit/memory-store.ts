// NEW: src/infrastructure/http/rate-limit/memory-store.ts
import type { RateLimitResult, RateLimitStore } from "./types";

export class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, number[]>();
  private lastSweep = 0;

  async hit(key: string, windowMs: number, limit: number): Promise<RateLimitResult> {
    const now = Date.now();
    this.sweep(now);

    let arr = this.buckets.get(key);
    if (!arr) {
      arr = [];
      this.buckets.set(key, arr);
    }

    const cutoff = now - windowMs;
    // drop expired entries (arr is ascending)
    let drop = 0;
    while (drop < arr.length && arr[drop] <= cutoff) drop++;
    if (drop > 0) arr.splice(0, drop);

    if (arr.length >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt: arr[0] + windowMs,
      };
    }

    arr.push(now);
    return {
      allowed: true,
      limit,
      remaining: limit - arr.length,
      resetAt: now + windowMs,
    };
  }

  private sweep(now: number) {
    // Bound memory: sweep at most once every 60s.
    if (now - this.lastSweep < 60_000) return;
    this.lastSweep = now;
    const hardCutoff = now - 60 * 60_000; // drop anything older than 1h
    for (const [k, arr] of this.buckets) {
      const first = arr[0];
      if (first !== undefined && first < hardCutoff) this.buckets.delete(k);
    }
  }
}