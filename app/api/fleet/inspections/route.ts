import { db } from '@/lib/db'
import { complianceInspections, vehicles } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, notFound, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Fleet inspections (backed by compliance_inspections; the inspected vehicle
 * id and pass/fail flag live in the evidence jsonb column).
 * GET  /api/fleet/inspections?vehicleId&status
 * POST /api/fleet/inspections { vehicleId, items, findings?, passed?, notes? }
 */
export async function GET(request: NextRequest) {
  return withV1('transport:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['vehicleId', 'status'])
    const query = searchParams.get('query')

    const conditions = [eq(complianceInspections.schoolId, schoolId)]
    if (filters.vehicleId) conditions.push(sql`${complianceInspections.evidence} ->> 'vehicleId' = ${filters.vehicleId}`)
    if (filters.status) conditions.push(eq(complianceInspections.status, filters.status as never))
    if (query) conditions.push(sql`${complianceInspections.inspector} ilike ${'%' + query + '%'}`)

    const [totalResult] = await db.select({ count: sql<number>`count(*)::int` }).from(complianceInspections).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select()
      .from(complianceInspections)
      .where(and(...conditions))
      .orderBy(desc(complianceInspections.conductedAt))
      .limit(pagination.limit)
      .offset(pagination.offset)

    // v1 response shape: hoist vehicle linkage / items out of the jsonb columns.
    return paged(
      rows.map((row) => {
        const evidence = (row.evidence ?? {}) as Record<string, unknown>
        return {
          ...row,
          vehicleId: evidence.vehicleId ?? null,
          items: row.checklist,
          passed: evidence.passed ?? null,
          notes: evidence.notes ?? null,
          dateLabel: row.conductedAt ? row.conductedAt.toISOString().slice(0, 10) : null,
        }
      }),
      pagination,
      total,
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('transport:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['vehicleId', 'items']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, body.vehicleId as string)).limit(1)
    if (!vehicle) return notFound('Vehicle not found')

    const [createdRow] = (await db
      .insert(complianceInspections)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        title: `Vehicle inspection — ${vehicle.registrationNumber}`,
        conductedAt: new Date(),
        checklist: (body.items as never) ?? [],
        findings: (body.findings as never) ?? [],
        status: 'completed',
        inspector: String(body.inspector ?? user.id),
        evidence: {
          vehicleId: body.vehicleId,
          passed: body.passed !== false,
          notes: (body.notes as string) ?? null,
        },
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({ schoolId, userId: user.id, action: 'created', module: 'fleet', entityType: 'vehicle_inspection', entityId: createdRow.id as string })

    return created(createdRow)
  })(request)
}
