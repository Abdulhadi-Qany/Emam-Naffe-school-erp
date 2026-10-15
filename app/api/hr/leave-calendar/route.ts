import { db } from '@/lib/db'
import { leaveCalendars } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, notFound, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withV1('hr:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['year', 'status'])
    const query = searchParams.get('query')

    const conditions = [eq(leaveCalendars.schoolId, schoolId)]
    if (filters.year) {
      const year = Number(filters.year)
      if (!Number.isInteger(year)) return badRequest('year must be an integer')
      conditions.push(eq(leaveCalendars.year, year))
    }
    if (filters.status) conditions.push(eq(leaveCalendars.status, filters.status))
    if (query) conditions.push(sql`${leaveCalendars.name} ilike ${'%' + query + '%'}`)

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(leaveCalendars).where(and(...conditions))
    const rows = await db.select().from(leaveCalendars).where(and(...conditions)).orderBy(desc(leaveCalendars.createdAt)).limit(pagination.limit).offset(pagination.offset)

    return paged(rows, pagination, total)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('hr:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['name', 'year', 'startDate', 'endDate']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const startDate = new Date(body.startDate as string)
    const endDate = new Date(body.endDate as string)
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return badRequest('startDate and endDate must be valid dates')
    if (endDate < startDate) return badRequest('endDate must be on or after startDate')

    const [createdRow] = (await db
      .insert(leaveCalendars)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        name: String(body.name).trim(),
        year: Number(body.year),
        startDate,
        endDate,
        isActive: body.isActive !== false,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({ schoolId, userId: user.id, action: 'created', module: 'hr', entityType: 'leave_calendar', entityId: createdRow.id as string })

    return created(createdRow)
  })(request)
}