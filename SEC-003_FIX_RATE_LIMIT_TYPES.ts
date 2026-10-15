// NEW: src/infrastructure/http/rate-limit/types.ts
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // epoch ms
}

export interface RateLimitStore {
  hit(key: string, windowMs: number, limit: number): Promise<RateLimitResult>;
}

export interface RateLimitRule {
  name: string;
  windowMs: number;
  limit: number;
  key?: (req: Request) => string;
}