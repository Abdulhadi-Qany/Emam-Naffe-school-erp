import { db } from '@/lib/db'
import { facilityBookings, rooms, users, userProfiles } from '@/lib/db/schema'
import { and, count, desc, eq, ilike, sql } from 'drizzle-orm'
import { paged, created, badRequest, conflict, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Facility room bookings.
 * GET  /api/facilities/bookings?status&roomId&from&to&query
 * POST /api/facilities/bookings { roomId, title, startAt, endAt, notes? }
 *      â†’ rejects overlapping confirmed bookings for the same room (409).
 */
export async function GET(request: NextRequest) {
  return withV1('facilities:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['status', 'roomId'])
    const query = searchParams.get('query')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const conditions = [eq(facilityBookings.schoolId, schoolId)]
    if (filters.status) conditions.push(eq(facilityBookings.status, filters.status))
    if (filters.roomId) conditions.push(eq(facilityBookings.roomId, filters.roomId))
    if (from) conditions.push(sql`${facilityBookings.endAt} >= ${new Date(from)}`)
    if (to) conditions.push(sql`${facilityBookings.startAt} <= ${new Date(to)}`)
    if (query) conditions.push(ilike(facilityBookings.title, `%${query}%`))

    const [totalResult] = await db.select({ count: count() }).from(facilityBookings).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select({
        booking: facilityBookings,
        roomLabel: rooms.name,
        roomType: rooms.roomType,
        bookedByName: userProfiles.fullName,
      })
      .from(facilityBookings)
      .leftJoin(rooms, eq(facilityBookings.roomId, rooms.id))
      .leftJoin(users, eq(facilityBookings.bookedBy, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(and(...conditions))
      .orderBy(desc(facilityBookings.startAt))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ booking, roomLabel, roomType, bookedByName }) => ({
        ...booking,
        roomLabel,
        roomType,
        bookedByName,
        startLabel: booking.startAt ? booking.startAt.toISOString().slice(0, 16).replace('T', ' ') : null,
        endLabel: booking.endAt ? booking.endAt.toISOString().slice(0, 16).replace('T', ' ') : null,
      })),
      pagination,
      total
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('facilities:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['roomId', 'title', 'startAt', 'endAt']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const startAt = new Date(body.startAt as string)
    const endAt = new Date(body.endAt as string)
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      return badRequest('startAt and endAt must be valid dates')
    }
    if (endAt <= startAt) return badRequest('endAt must be after startAt')

    const [clash] = await db
      .select({ id: facilityBookings.id })
      .from(facilityBookings)
      .where(
        and(
          eq(facilityBookings.roomId, String(body.roomId)),
          sql`${facilityBookings.status} <> 'cancelled'`,
          sql`${facilityBookings.startAt} < ${endAt}`,
          sql`${facilityBookings.endAt} > ${startAt}`
        )
      )
      .limit(1)
    if (clash) return conflict('This room is already booked for that time slot')

    const [createdRow] = (await db
      .insert(facilityBookings)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        roomId: String(body.roomId),
        title: String(body.title).trim(),
        bookedBy: user.id,
        startAt,
        endAt,
        isRecurring: body.isRecurring === true,
        recurrenceRule: (body.recurrenceRule as string) ?? null,
        status: (body.status as string) ?? 'confirmed',
        notes: (body.notes as string) ?? null,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'facilities',
      entityType: 'facility_booking',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}
