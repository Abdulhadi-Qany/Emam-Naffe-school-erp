import { db } from '@/lib/db'
import { communications } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { paged, ok, created, badRequest, withV1, parsePagination, parseFilters, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/communications/parent-meetings?date&studentId
 * POST /api/communications/parent-meetings { studentId, date, time, agenda, notes }
 */
export async function GET(request: NextRequest) {
  return withV1('communications:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['studentId', 'status'])
    const date = searchParams.get('date')

    const conditions = [eq(communications.schoolId, schoolId)]
    if (filters.studentId) conditions.push(eq(communications.studentId, filters.studentId))
    if (filters.status) conditions.push(eq(communications.status, filters.status))
    if (date) conditions.push(sql`date(${communications.date}) = ${date}`)

    const [totalResult] = await db.select({ count: sql<number>`count(*)::int` }).from(communications).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select()
      .from(communications)
      .where(and(...conditions))
      .orderBy(desc(communications.date))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(rows.map(r => ({ ...r, dateLabel: r.date ? r.date.toISOString().slice(0, 10) : null })), pagination, total)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('communications:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['studentId', 'date', 'time', 'agenda']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const [createdRow] = (await db
      .insert(communications)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        type: 'parent_meeting',
        studentId: body.studentId as string,
        date: new Date(body.date as string),
        time: body.time as string,
        agenda: String(body.agenda),
        notes: (body.notes as string) ?? null,
        status: 'scheduled',
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({ schoolId, userId: user.id, action: 'created', module: 'communications', entityType: 'parent_meeting', entityId: createdRow.id as string })

    return created(createdRow)
  })(request)
}