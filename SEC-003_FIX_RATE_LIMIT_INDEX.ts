// NEW: src/infrastructure/http/rate-limit/index.ts
import { getClientIp } from "../client-ip";
import { MemoryRateLimitStore } from "./memory-store";
import { RedisRateLimitStore } from "./redis-store";
import type { RateLimitResult, RateLimitRule, RateLimitStore } from "./types";

const driver = process.env.RATE_LIMIT_DRIVER ?? "memory";

let store: RateLimitStore;
if (driver === "redis" && process.env.REDIS_URL) {
  store = new RedisRateLimitStore();
} else {
  store = new MemoryRateLimitStore();
}

export function checkRateLimit(
  req: Request,
  rule: RateLimitRule,
): Promise<RateLimitResult> {
  const id = rule.key ? rule.key(req) : getClientIp(req);
  const bucket = `rl:${rule.name}:${id}`;
  return store.hit(bucket, rule.windowMs, rule.limit);
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    "RateLimit-Limit":     String(r.limit),
    "RateLimit-Remaining": String(r.remaining),
    "RateLimit-Reset":     String(Math.ceil(r.resetAt / 1000)),
  };
}

export function tooManyResponse(r: RateLimitResult, message = "Too many requests") {
  const retryAfter = Math.max(1, Math.ceil((r.resetAt - Date.now()) / 1000));
  return new Response(
    JSON.stringify({ error: "rate_limited", message, retryAfter }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        ...rateLimitHeaders(r),
      },
    },
  );
}

export type { RateLimitRule, RateLimitResult } from "./types";