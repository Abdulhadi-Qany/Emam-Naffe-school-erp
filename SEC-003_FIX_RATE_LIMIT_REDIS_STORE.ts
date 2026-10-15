// NEW: src/infrastructure/http/rate-limit/redis-store.ts
import Redis from "ioredis";
import type { RateLimitResult, RateLimitStore } from "./types";

/**
 * Sliding window via sorted set + Lua.
 * KEYS[1] = bucket
 * ARGV    = now, windowMs, limit, member
 */
const LUA = `
local key   = KEYS[1]
local now   = tonumber(ARGV[1])
local win   = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local mem   = ARGV[4]

redis.call('ZREMRANGEBYSCORE', key, 0, now - win)
local count = redis.call('ZCARD', key)
if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local resetAt = now + win
  if oldest[2] then resetAt = tonumber(oldest[2]) + win end
  return {0, count, resetAt}
end
redis.call('ZADD', key, now, mem)
redis.call('PEXPIRE', key, win)
return {1, count + 1, now + win}
`;

export class RedisRateLimitStore implements RateLimitStore {
  private redis: Redis;
  private sha?: string;

  constructor(url = process.env.REDIS_URL!) {
    this.redis = new Redis(url, { maxRetriesPerRequest: 2 });
  }

  private async script(): Promise<string> {
    if (!this.sha) this.sha = (await this.redis.script("LOAD", LUA)) as string;
    return this.sha;
  }

  async hit(key: string, windowMs: number, limit: number): Promise<RateLimitResult> {
    const sha = await this.script();
    const member = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      const res = (await this.redis.evalsha(
        sha, 1, key, Date.now().toString(), windowMs.toString(), limit.toString(), member,
      )) as [number, number, number];
      return {
        allowed: res[0] === 1,
        limit,
        remaining: Math.max(0, limit - res[1]),
        resetAt: res[2],
      };
    } catch {
      // Fail-open on Redis outage, log elsewhere.
      return { allowed: true, limit, remaining: limit, resetAt: Date.now() + windowMs };
    }
  }
}