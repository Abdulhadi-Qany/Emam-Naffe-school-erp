import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { academicYears } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { paged, parsePagination, parseFilters, ok, created, deleted, badRequest, notFound, conflict, withV1, audit, afghanAcademicYear } from '@/lib/api'

/**
 * Academic years (Afghan calendar — year starts in Farvardin/March).
 * GET   /api/academic/years?isCurrent&isActive&query
 * POST  /api/academic/years { name, startDate, endDate, solarHijriYear? }
 * GET   /api/academic/years/current → the active year
 * POST  /api/academic/years/[id]/activate → flips `isCurrent`
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pagination = parsePagination(searchParams)
  const filters = parseFilters(searchParams, ['isCurrent', 'isActive'])
  const query = searchParams.get('query')

  const conditions = []
  if (filters.isCurrent === 'true') conditions.push(eq(academicYears.isCurrent, true))
  if (filters.isCurrent === 'false') conditions.push(eq(academicYears.isCurrent, false))
  if (filters.isActive === 'true') conditions.push(eq(academicYears.isActive, true))
  if (filters.isActive === 'false') conditions.push(eq(academicYears.isActive, false))
  if (query) {
    const q = `%${query}%`
    conditions.push(sql`(${academicYears.name} ilike ${q} or cast(${academicYears.solarHijriYear} as text) ilike ${q})`)
  }
  const where = conditions.length > 0 ? sql`${sql.join(conditions, sql` and `)}` : undefined

  const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(academicYears).where(where)
  const totalCount = total?.count ?? 0

  const rows = await db
    .select()
    .from(academicYears)
    .where(where)
    .orderBy(sql`${academicYears.startDate} desc`)
    .limit(pagination.limit)
    .offset(pagination.offset)

  return paged(rows, pagination, totalCount)
}

export async function POST(request: NextRequest) {
  return withV1('academics:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const startDate = typeof body.startDate === 'string' ? new Date(body.startDate) : null
    const endDate = typeof body.endDate === 'string' ? new Date(body.endDate) : null
    if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return badRequest('startDate and endDate are required dates')
    }
    if (endDate <= startDate) return badRequest('endDate must be after startDate')

    const name = typeof body.name === 'string' && body.name.trim() !== ''
      ? body.name.trim()
      : `AY ${afghanAcademicYear(startDate)}`

    const [duplicate] = await db
      .select({ id: academicYears.id })
      .from(academicYears)
      .where(sql`${academicYears.schoolId} = ${schoolId} and ${academicYears.name} = ${name}`)
      .limit(1)
    if (duplicate) return conflict('An academic year with this name already exists')

    const isCurrent = body.isCurrent === true
    if (isCurrent) {
      await db.update(academicYears).set({ isCurrent: false, updatedAt: new Date() }).where(eq(academicYears.isCurrent, true))
    }

    const [createdRow] = await db
      .insert(academicYears)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        name,
        startDate,
        endDate,
        solarHijriYear: body.solarHijriYear !== undefined ? Number(body.solarHijriYear) : afghanAcademicYear(startDate),
        solarHijriStartDate: startDate,
        solarHijriEndDate: endDate,
        isCurrent,
        isActive: body.isActive !== false,
      })
      .returning()

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'academics',
      entityType: 'academic_year',
      entityId: createdRow.id,
    })

    return created(createdRow)
  })(request)
}
