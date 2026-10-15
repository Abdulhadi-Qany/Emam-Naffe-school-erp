// NEW: app/api/health/ready/route.ts
import { sql } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};
  let ok = true;

  // DB
  const t0 = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    checks.db = { ok: true, latencyMs: Date.now() - t0 };
  } catch (e) {
    ok = false;
    checks.db = { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }

  // Permission cache reachability (in-memory → always ok; swap to Redis ping if used)
  checks.permissionCache = { ok: true };

  return Response.json(
    { status: ok ? "ready" : "degraded", checks, ts: Date.now() },
    {
      status: ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}