import { db } from '@/lib/db'
import { holidays } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { paged, parsePagination, parseFilters, isoDate, withV1 } from '@/lib/api'
import { createReferenceRoutes } from '@/lib/api/reference'
import type { NextRequest } from 'next/server'

/**
 * Holidays (national / religious / school / exam closures).
 * GET  /api/academic/holidays?holidayType&from&to&query
 * POST /api/academic/holidays { name, holidayType, startDate, endDate }
 */
export async function GET(request: NextRequest) {
  return withV1('academics:read', async ({ schoolId }, req) => {
  const { searchParams } = new URL(req.url)
  const pagination = parsePagination(searchParams)
  const filters = parseFilters(searchParams, ['holidayType'])
  const query = searchParams.get('query')

  const conditions = [eq(holidays.schoolId, schoolId)]
  if (filters.holidayType) conditions.push(eq(holidays.holidayType, filters.holidayType as never))
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  if (from) conditions.push(sql`${holidays.endDate} >= ${new Date(from)}`)
  if (to) conditions.push(sql`${holidays.startDate} <= ${new Date(to)}`)
  if (query) {
    const q = `%${query}%`
    conditions.push(sql`(${holidays.name} ilike ${q} or ${holidays.nameDari} ilike ${q} or ${holidays.namePashto} ilike ${q})`)
  }
  const where = conditions.length > 0 ? sql`${sql.join(conditions, sql` and `)}` : undefined

  const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(holidays).where(where)
  const totalCount = total?.count ?? 0

  const rows = await db
    .select()
    .from(holidays)
    .where(where)
    .orderBy(sql`${holidays.startDate} asc`)
    .limit(pagination.limit)
    .offset(pagination.offset)

  return paged(
    rows.map((holiday) => ({
      ...holiday,
      startDateLabel: isoDate(holiday.startDate),
      endDateLabel: isoDate(holiday.endDate),
    })),
    pagination,
    totalCount
  )
  })(request)
}

export const POST = createReferenceRoutes({
  table: holidays,
  module: 'academics',
  label: 'Holiday',
  requiredFields: ['name', 'holidayType', 'startDate'],
  searchableFields: ['name', 'nameDari', 'namePashto'],
  sortableFields: ['name', 'startDate'],
  softDelete: null,
  readPermission: 'academics:read',
  writePermission: 'academics:write',
}).POST
