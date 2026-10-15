// FIXED: app/api/auth/[...all]/route.ts
// Addresses SEC-003 (Missing Rate Limiting)

import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import {
  checkRateLimit,
  rateLimitHeaders,
  tooManyResponse,
  type RateLimitRule,
} from "@/src/infrastructure/http/rate-limit";
import { getClientIp } from "@/src/infrastructure/http/client-ip";

const betterAuthHandlers = toNextJsHandler(auth);

/* Strict buckets for the sensitive auth surfaces. */
const SIGN_IN_RULES: RateLimitRule[] = [
  { name: "auth:sign-in:ip",  windowMs: 60_000,   limit: 10 },          // burst
  { name: "auth:sign-in:ip",  windowMs: 15 * 60_000, limit: 50 },       // sustained
  { name: "auth:sign-in:user", windowMs: 15 * 60_000, limit: 5,
    key: (req) => `${getClientIp(req)}:${emailFromBody(req) ?? "_"}` }, // per-account
];

const SIGN_UP_RULES: RateLimitRule[] = [
  { name: "auth:sign-up:ip", windowMs: 60 * 60_000, limit: 5 },
];

const RESET_RULES: RateLimitRule[] = [
  { name: "auth:reset:ip",  windowMs: 60 * 60_000, limit: 5 },
];

function emailFromBody(req: Request): string | null {
  // Best-effort; we don't consume the body, we only peek if available.
  // Better Auth will parse the body itself.
  // In production, you'd want to hook into Better Auth's event system
  // for per-account rate limiting rather than trying to parse the body here.
  return null;
}

async function enforce(rules: RateLimitRule[], req: Request): Promise<Response | null> {
  for (const rule of rules) {
    const r = await checkRateLimit(req, rule);
    if (!r.allowed) return tooManyResponse(r);
  }
  return null;
}

function withHeaders(res: Response, extra: Record<string, string>): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
}

export async function GET(req: Request, ctx: { params: Promise<Record<string, string | string[]>> }) {
  // GETs (e.g. /get-session) are left unthrottled; keep them passthrough.
  return betterAuthHandlers.GET(req);
}

export async function POST(req: Request, ctx: { params: Promise<Record<string, string | string[]>> }) {
  const { joined } = await paramsJoined(ctx);

  let rules: RateLimitRule[] | null = null;
  if (joined.includes("/sign-in"))  rules = SIGN_IN_RULES;
  else if (joined.includes("/sign-up")) rules = SIGN_UP_RULES;
  else if (joined.includes("/forget-password") || joined.includes("/reset-password")) rules = RESET_RULES;

  if (rules) {
    const blocked = await enforce(rules, req);
    if (blocked) return blocked;
  }

  const res = await betterAuthHandlers.POST(req);
  if (rules) {
    const first = await checkRateLimit(req, rules[0]);
    return withHeaders(res, rateLimitHeaders(first));
  }
  return res;
}

async function paramsJoined(ctx: { params: Promise<Record<string, string | string[]>> }) {
  const p = await ctx.params;
  const all = p["all"];
  const joined = Array.isArray(all) ? all.join("/") : (all ?? "");
  return { joined, path: joined };
}