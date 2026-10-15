import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { terms, academicYears } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { paged, parsePagination, parseFilters, created, badRequest, withV1, audit } from '@/lib/api'

/**
 * Terms within an academic year.
 * GET  /api/academic/terms?academicYearId&isCurrent&query
 * POST /api/academic/terms { name, termNumber, startDate, endDate, academicYearId }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pagination = parsePagination(searchParams)
  const filters = parseFilters(searchParams, ['academicYearId', 'isCurrent', 'termType'])
  const query = searchParams.get('query')

  const conditions = []
  if (filters.academicYearId) conditions.push(eq(terms.academicYearId, filters.academicYearId))
  if (filters.isCurrent === 'true') conditions.push(eq(terms.isCurrent, true))
  if (filters.isCurrent === 'false') conditions.push(eq(terms.isCurrent, false))
  if (filters.termType) conditions.push(eq(terms.termType, filters.termType as never))
  if (query) {
    const q = `%${query}%`
    conditions.push(sql`${terms.name} ilike ${q}`)
  }
  const where = conditions.length > 0 ? sql`${sql.join(conditions, sql` and `)}` : undefined

  const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(terms).where(where)
  const totalCount = total?.count ?? 0

  const rows = await db
    .select({
      term: terms,
      academicYearName: academicYears.name,
      academicYearStart: academicYears.startDate,
    })
    .from(terms)
    .leftJoin(academicYears, eq(terms.academicYearId, academicYears.id))
    .where(where)
    .orderBy(sql`${terms.termNumber} asc`)
    .limit(pagination.limit)
    .offset(pagination.offset)

  return paged(
    rows.map(({ term, academicYearName, academicYearStart }) => ({
      ...term,
      academicYearName,
      academicYearStart,
    })),
    pagination,
    totalCount
  )
}

export async function POST(request: NextRequest) {
  return withV1('academics:write', async ({ user }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['name', 'termNumber', 'startDate', 'endDate', 'academicYearId']) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return badRequest(`${field} is required`)
      }
    }

    const startDate = new Date(body.startDate as string)
    const endDate = new Date(body.endDate as string)
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return badRequest('startDate and endDate must be valid dates')
    }
    if (endDate <= startDate) return badRequest('endDate must be after startDate')

    const duplicate = await db
      .select({ id: terms.id })
      .from(terms)
      .where(sql`${terms.academicYearId} = ${body.academicYearId} and ${terms.name} = ${String(body.name).trim()}`)
      .limit(1)
    if (duplicate.length > 0) return badRequest('A term with this name already exists in the academic year')

    const [createdRow] = await db
      .insert(terms)
      .values({
        id: crypto.randomUUID(),
        academicYearId: body.academicYearId as string,
        name: String(body.name).trim(),
        termNumber: Number(body.termNumber),
        startDate,
        endDate,
        isCurrent: body.isCurrent === true,
        termType: (body.termType as never) ?? 'semester',
      })
      .returning()

    await audit({
      schoolId: createdRow.academicYearId,
      userId: user.id,
      action: 'created',
      module: 'academics',
      entityType: 'term',
      entityId: createdRow.id,
    })

    return created(createdRow)
  })(request)
}
