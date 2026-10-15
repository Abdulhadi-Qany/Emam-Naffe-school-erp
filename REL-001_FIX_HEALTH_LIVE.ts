// NEW: app/api/health/live/route.ts
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { status: "ok", ts: Date.now() },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}