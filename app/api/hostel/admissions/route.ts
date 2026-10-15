import { db } from '@/lib/db'
import { hostelRooms, hostelAllocations, students, hostels } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, created, badRequest, notFound, unprocessable, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Hostel admissions.
 * GET  /api/hostel/admissions?status → active allocations with room/student detail
 * POST /api/hostel/admissions { studentId, roomId, checkInDate?, reason? }
 *      → allocates a bed (rejects when the room or hostel is full).
 */
export async function GET(request: NextRequest) {
  return withV1('hostel:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? 'active'

    const rows = await db
      .select({
        allocation: hostelAllocations,
        studentName: students.fullName,
        admissionNumber: students.admissionNumber,
        roomNumber: hostelRooms.roomNumber,
        hostelName: hostels.name,
      })
      .from(hostelAllocations)
      .innerJoin(students, eq(hostelAllocations.studentId, students.id))
      .innerJoin(hostelRooms, eq(hostelAllocations.roomId, hostelRooms.id))
      .innerJoin(hostels, eq(hostelRooms.hostelId, hostels.id))
      .where(and(eq(hostelAllocations.schoolId, schoolId), eq(hostelAllocations.status, status)))
      .orderBy(sql`${hostels.name} asc, ${hostelRooms.roomNumber} asc`)
      .limit(500)

    return ok({
      admissions: rows.map(({ allocation, studentName, admissionNumber, roomNumber, hostelName }) => ({
        ...allocation,
        studentName,
        admissionNumber,
        roomNumber,
        hostelName,
        checkInDateLabel: allocation.allocationDate ? allocation.allocationDate.toISOString().slice(0, 10) : null,
      })),
    })
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('hostel:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['studentId', 'roomId']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const [room] = await db.select().from(hostelRooms).where(eq(hostelRooms.id, body.roomId as string)).limit(1)
    if (!room) return notFound('Room not found')
    if (room.occupiedBeds >= room.capacity) {
      return unprocessable('This room has no free beds', 'ROOM_FULL')
    }

    const [student] = await db
      .select({ id: students.id, status: students.status })
      .from(students)
      .where(and(eq(students.id, body.studentId as string), eq(students.schoolId, schoolId)))
      .limit(1)
    if (!student) return notFound('Student not found')
    if (student.status === 'deleted' || student.status === 'dropped_out') {
      return unprocessable('Only active students can be allocated a bed', 'INVALID_STATUS')
    }

    const [existing] = await db
      .select({ id: hostelAllocations.id })
      .from(hostelAllocations)
      .where(and(eq(hostelAllocations.studentId, student.id), eq(hostelAllocations.status, 'active')))
      .limit(1)
    if (existing) return unprocessable('This student already has an active bed', 'ALREADY_ALLOCATED')

    const [allocation] = (await db
      .insert(hostelAllocations)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        studentId: student.id,
        roomId: room.id,
        bedNumber: (body.bedNumber as string) ?? null,
        allocationDate: new Date(),
        status: 'active',
        messFee: body.monthlyFee !== undefined ? String(body.monthlyFee) : '0',
      })
      .returning()) as unknown as Record<string, unknown>[]

    await db.update(hostelRooms).set({ occupiedBeds: room.occupiedBeds + 1, updatedAt: new Date() }).where(eq(hostelRooms.id, room.id))

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'hostel',
      entityType: 'hostel_allocation',
      entityId: allocation.id as string,
      changes: { studentId: student.id, roomId: room.id },
    })

    return created(allocation)
  })(request)
}
