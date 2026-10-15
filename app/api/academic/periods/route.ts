import { db } from '@/lib/db'
import { periods, timetableEntries } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import type { NextRequest } from 'next/server'
import { paged, parsePagination, parseFilters, withV1, createReferenceRoutes } from '@/lib/api'

/**
 * Periods (timetable slots per shift).
 * GET  /api/academic/periods?query ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ marks how many timetable slots use each
 * POST /api/academic/periods { name, periodNumber, startTime, endTime, duration, isBreak? }
 */
export async function GET(request: NextRequest) {
  return withV1('academics:read', async ({ schoolId }, req) => {
  const { searchParams } = new URL(req.url)
  const pagination = parsePagination(searchParams)
  const filters = parseFilters(searchParams, ['isBreak'])
  const query = searchParams.get('query')

  const conditions = [eq(periods.schoolId, schoolId)]
  if (filters.isBreak === 'true') conditions.push(eq(periods.isBreak, true))
  if (filters.isBreak === 'false') conditions.push(eq(periods.isBreak, false))
  if (query) {
    const q = `%${query}%`
    conditions.push(sql`(${periods.name} ilike ${q} or ${periods.startTime} ilike ${q} or ${periods.endTime} ilike ${q})`)
  }
  const where = conditions.length > 0 ? sql`${sql.join(conditions, sql` and `)}` : undefined

  const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(periods).where(where)
  const totalCount = total?.count ?? 0

  const rows = await db
    .select({
      period: periods,
      entryCount: sql<number>`(
        select count(*)::int from ${timetableEntries} te
        where te.period_id = "periods"."id"
      )`,
    })
    .from(periods)
    .where(where)
    .orderBy(sql`${periods.periodNumber} asc`)
    .limit(pagination.limit)
    .offset(pagination.offset)

  return paged(
    rows.map(({ period, entryCount }) => ({ ...period, entryCount })),
    pagination,
    totalCount
  )
  })(request)
}

const reference = createReferenceRoutes({
  table: periods,
  module: 'academics',
  label: 'Period',
  requiredFields: ['name', 'periodNumber', 'startTime', 'endTime', 'duration'],
  searchableFields: ['name'],
  filterFields: ['isBreak'],
  sortableFields: ['periodNumber', 'name'],
  softDelete: null,
  readPermission: 'academics:read',
  writePermission: 'academics:write',
})

export const POST = reference.POST
