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
  /** logical bucket, e.g. "auth:login" */
  name: string;
  windowMs: number;
  limit: number;
  /** derive bucket key from request; defaults to client ip */
  key?: (req: Request) => string;
}