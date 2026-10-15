import { db } from '@/lib/db'
import { hostels, hostelRooms, hostelAllocations, staff, students } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, withV1 } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/hostel — hostel dashboard (buildings, rooms, occupancy).
 */
export async function GET(request: NextRequest) {
  return withV1('hostel:read', async ({ schoolId }) => {
    const buildings = await db
      .select({
        hostel: hostels,
        wardenName: staff.fullName,
        roomCount: sql<number>`(
          select count(*)::int from ${hostelRooms} where ${hostelRooms.hostelId} = "hostels"."id"
        )`,
        occupiedBeds: sql<number>`coalesce((
          select sum(${hostelRooms.occupiedBeds}) from ${hostelRooms} where ${hostelRooms.hostelId} = "hostels"."id"
        ), 0)`,
        totalBeds: sql<number>`coalesce((
          select sum(${hostelRooms.capacity}) from ${hostelRooms} where ${hostelRooms.hostelId} = "hostels"."id"
        ), 0)`,
        allocations: sql<number>`(
          select count(*)::int from ${hostelAllocations}
          where ${hostelAllocations.roomId} in (
            select ${hostelRooms.id} from ${hostelRooms} where ${hostelRooms.hostelId} = "hostels"."id"
          ) and ${hostelAllocations.status} = 'active' and ${hostelAllocations.isActive} = true
        )`,
      })
      .from(hostels)
      .leftJoin(staff, eq(hostels.wardenId, staff.id))
      .where(and(eq(hostels.schoolId, schoolId), eq(hostels.isActive, true)))
      .orderBy(sql`${hostels.name} asc`)

    const rooms = await db
      .select({
        room: hostelRooms,
        hostelName: hostels.name,
      })
      .from(hostelRooms)
      .leftJoin(hostels, eq(hostelRooms.hostelId, hostels.id))
      .where(sql`${hostels.schoolId} = ${schoolId}`)
      .orderBy(sql`${hostels.name} asc, ${hostelRooms.roomNumber} asc`)
      .limit(500)

    void students
    return ok({
      buildings: buildings.map(({ hostel, wardenName, roomCount, occupiedBeds, totalBeds, allocations }) => ({
        id: hostel.id,
        schoolId: hostel.schoolId,
        name: hostel.name,
        hostelType: hostel.hostelType,
        occupancyRate: Number(totalBeds ?? 0) > 0 ? Math.round((Number(occupiedBeds ?? 0) / Number(totalBeds)) * 100) : 0,
        wardenName,
        roomCount: Number(roomCount ?? 0),
        occupiedBeds: Number(occupiedBeds ?? 0),
        totalBeds: Number(totalBeds ?? 0),
        allocations: Number(allocations ?? 0),
      })),
      rooms: rooms.map(({ room, hostelName }) => ({
        ...room,
        hostelName,
        occupancyRate: room.capacity > 0 ? Math.round((room.occupiedBeds / room.capacity) * 100) : 0,
      })),
    })
  })(request)
}
