import { db } from '@/lib/db'
import { shifts } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { paged, parsePagination, parseFilters, withV1 } from '@/lib/api'
import { createReferenceRoutes } from '@/lib/api/reference'
import type { NextRequest } from 'next/server'

/**
 * Shifts (morning / afternoon / evening) with applicable grades.
 * GET  /api/academic/shifts?shiftType&isActive&query
 * POST /api/academic/shifts { name, shiftType, startTime, endTime, applicableGrades? }
 */
export async function GET(request: NextRequest) {
  return withV1('academics:read', async ({ schoolId }, req) => {
  const { searchParams } = new URL(req.url)
  const pagination = parsePagination(searchParams)
  const filters = parseFilters(searchParams, ['shiftType', 'isActive'])
  const query = searchParams.get('query')

  const conditions = [eq(shifts.schoolId, schoolId)]
  if (filters.shiftType) conditions.push(eq(shifts.shiftType, filters.shiftType as never))
  if (filters.isActive === 'true') conditions.push(eq(shifts.isActive, true))
  if (filters.isActive === 'false') conditions.push(eq(shifts.isActive, false))
  if (query) {
    const q = `%${query}%`
    conditions.push(sql`${shifts.name} ilike ${q}`)
  }
  const where = conditions.length > 0 ? sql`${sql.join(conditions, sql` and `)}` : undefined

  const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(shifts).where(where)
  const totalCount = total?.count ?? 0

  const rows = await db
    .select()
    .from(shifts)
    .where(where)
    .orderBy(sql`${shifts.startTime} asc`)
    .limit(pagination.limit)
    .offset(pagination.offset)

  return paged(rows, pagination, totalCount)
  })(request)
}

export const POST = createReferenceRoutes({
  table: shifts,
  module: 'academics',
  label: 'Shift',
  requiredFields: ['name', 'shiftType', 'startTime', 'endTime'],
  searchableFields: ['name'],
  sortableFields: ['name', 'startTime'],
  softDelete: 'isActive',
  readPermission: 'academics:read',
  writePermission: 'academics:write',
}).POST
