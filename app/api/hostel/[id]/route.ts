import { db } from '@/lib/db'
import { hostels, hostelRooms, hostelAllocations, students } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, notFound, withV1, num } from '@/lib/api'
import type { NextRequest } from 'next/server'

/** GET /api/hostel/[id] → hostel detail with rooms and current residents. */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('hostel:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [hostel] = await db
      .select()
      .from(hostels)
      .where(and(eq(hostels.id, id), eq(hostels.schoolId, schoolId)))
      .limit(1)
    if (!hostel) return notFound('Hostel not found')

    const rooms = await db
      .select()
      .from(hostelRooms)
      .where(eq(hostelRooms.hostelId, id))
      .orderBy(sql`${hostelRooms.roomNumber} asc`)
      .limit(300)

    const residents = await db
      .select({
        allocation: hostelAllocations,
        studentName: students.fullName,
        admissionNumber: students.admissionNumber,
        roomNumber: hostelRooms.roomNumber,
      })
      .from(hostelAllocations)
      .innerJoin(students, eq(hostelAllocations.studentId, students.id))
      .innerJoin(hostelRooms, eq(hostelAllocations.roomId, hostelRooms.id))
      .where(and(eq(hostelAllocations.schoolId, schoolId), eq(hostelAllocations.status, 'active')))
      .limit(500)

    const totalBeds = rooms.reduce((sum, room) => sum + room.capacity, 0)
    const occupiedBeds = rooms.reduce((sum, room) => sum + room.occupiedBeds, 0)

    return ok({
      ...hostel,
      rooms: rooms.map((room) => ({ ...room, occupancyRate: room.capacity > 0 ? Math.round((room.occupiedBeds / room.capacity) * 100) : 0 })),
      residents: residents.map(({ allocation, studentName, admissionNumber, roomNumber }) => ({
        ...allocation,
        studentName,
        admissionNumber,
        roomNumber,
      })),
      totals: {
        rooms: rooms.length,
        totalBeds,
        occupiedBeds,
        freeBeds: Math.max(0, totalBeds - occupiedBeds),
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      },
    })
  })(request, context)
}