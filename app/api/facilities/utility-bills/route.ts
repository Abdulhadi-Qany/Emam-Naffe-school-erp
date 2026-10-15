import { db } from '@/lib/db'
import { utilityBills } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { paged, parsePagination, parseFilters, withV1 } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/facilities/utility-bills?type&from&to
 * → utility bills with filtering
 */
export async function GET(request: NextRequest) {
  return withV1('facilities:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['type', 'status'])
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const conditions = [eq(utilityBills.schoolId, schoolId)]
    if (filters.type) conditions.push(eq(utilityBills.utilityType, filters.type))
    if (filters.status) conditions.push(eq(utilityBills.status, filters.status))
    if (from) conditions.push(sql`${utilityBills.billDate} >= ${new Date(from)}`)
    if (to) conditions.push(sql`${utilityBills.billDate} <= ${new Date(to)}`)

    const [totalResult] = await db.select({ count: sql<number>`count(*)::int` }).from(utilityBills).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select()
      .from(utilityBills)
      .where(and(...conditions))
      .orderBy(sql`${utilityBills.billDate} desc`)
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(rows, pagination, total)
  })(request)
}