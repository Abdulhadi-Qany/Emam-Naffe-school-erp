import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { rooms, classes } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { paged, parsePagination, parseFilters, withV1 } from '@/lib/api'
import { createReferenceRoutes } from '@/lib/api/reference'

/**
 * Rooms ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â capacity, type, building and current usage.
 * GET  /api/academic/rooms?roomType&isActive&query
 * POST /api/academic/rooms { name, roomType?, capacity?, building?, floor? }
 */
export async function GET(request: NextRequest) {
  return withV1('academics:read', async ({ schoolId }, req) => {
  const { searchParams } = new URL(req.url)
  const pagination = parsePagination(searchParams)
  const filters = parseFilters(searchParams, ['roomType', 'isActive'])
  const query = searchParams.get('query')

  const conditions = [eq(rooms.schoolId, schoolId)]
  if (filters.roomType) conditions.push(eq(rooms.roomType, filters.roomType))
  if (filters.isActive === 'true') conditions.push(eq(rooms.isActive, true))
  if (filters.isActive === 'false') conditions.push(eq(rooms.isActive, false))
  if (query) {
    const q = `%${query}%`
    conditions.push(sql`(${rooms.name} ilike ${q} or ${rooms.roomType} ilike ${q} or ${rooms.building} ilike ${q})`)
  }
  const where = conditions.length > 0 ? sql`${sql.join(conditions, sql` and `)}` : undefined

  const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(rooms).where(where)
  const totalCount = total?.count ?? 0

  const rows = await db
    .select({
      room: rooms,
      classCount: sql<number>`(
        select count(*)::int from ${classes} c
        where c.room_id = "rooms"."id" and c.status <> 'deleted'
      )`,
    })
    .from(rooms)
    .where(where)
    .orderBy(sql`${rooms.name} asc`)
    .limit(pagination.limit)
    .offset(pagination.offset)

  return paged(
    rows.map(({ room, classCount }) => ({ ...room, classCount })),
    pagination,
    totalCount
  )
  })(request)
}

const reference = createReferenceRoutes({
  table: rooms,
  module: 'academics',
  label: 'Room',
  requiredFields: ['name'],
  uniqueFields: ['name'],
  searchableFields: ['name', 'roomType', 'building'],
  filterFields: ['roomType', 'isActive'],
  sortableFields: ['name', 'capacity'],
  softDelete: 'isActive',
  readPermission: 'academics:read',
  writePermission: 'academics:write',
})

export const POST = reference.POST
