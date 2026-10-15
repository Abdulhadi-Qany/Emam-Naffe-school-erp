import { db } from '@/lib/db'
import { studentAttendance, students } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, badRequest, notFound, unprocessable, withV1, audit, created } from '@/lib/api'
import type { NextRequest } from 'next/server'

const STATUSES = ['present', 'absent', 'late', 'leave', 'holiday'] as const

export async function POST(request: NextRequest) {
  return withV1('attendance:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['studentId', 'date', 'status', 'deviceId']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const date = new Date(body.date as string)
    if (Number.isNaN(date.getTime())) return badRequest('date must be a valid date')
    date.setHours(9, 0, 0, 0)

    const [student] = await db.select({ id: students.id }).from(students).where(and(eq(students.id, body.studentId as string), eq(students.schoolId, schoolId))).limit(1)
    if (!student) return notFound('Student not found')

    const [existing] = await db.select({ id: studentAttendance.id }).from(studentAttendance).where(and(eq(studentAttendance.studentId, body.studentId as string), eq(studentAttendance.date, date))).limit(1)
    if (existing) return unprocessable('Attendance record already exists for this student on this date', 'DUPLICATE_ATTENDANCE')

    const [createdRow] = (await db
      .insert(studentAttendance)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        studentId: body.studentId as string,
        date,
        status: body.status as never,
        remarks: body.deviceId ? `device:${String(body.deviceId)}` : null,
        recordedBy: user.id,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'attendance',
      entityType: 'student_attendance',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}