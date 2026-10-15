import { db } from '@/lib/db'
import { notifications, studentAttendance, studentGuardians, students } from '@/lib/db/schema'
import { and, eq, gte, isNotNull, lt } from 'drizzle-orm'
import { ok, badRequest, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * POST /api/attendance/notifications { date }
 * → enqueues in-app notifications for the guardians of absent students.
 */
export async function POST(request: NextRequest) {
  return withV1('attendance:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const dateParam = body?.date as string | undefined
    if (!dateParam || Number.isNaN(new Date(dateParam).getTime())) return badRequest('date must be a valid date')
    const date = new Date(dateParam)
    date.setHours(0, 0, 0, 0)
    const end = new Date(date.getTime() + 86_400_000)

    const rows = await db
      .selectDistinct({
        studentId: studentAttendance.studentId,
        studentName: students.fullName,
        guardianUserId: studentGuardians.userId,
      })
      .from(studentAttendance)
      .innerJoin(students, and(
        eq(students.id, studentAttendance.studentId),
        eq(students.schoolId, schoolId)
      ))
      .innerJoin(studentGuardians, eq(studentGuardians.studentId, students.id))
      .where(and(
        eq(studentAttendance.schoolId, schoolId),
        eq(studentAttendance.status, 'absent'),
        gte(studentAttendance.date, date),
        lt(studentAttendance.date, end),
        isNotNull(studentGuardians.userId)
      ))
      .limit(500)

    let enqueued = 0
    for (const row of rows) {
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        schoolId,
        userId: row.guardianUserId!,
        title: 'Absence notice',
        message: `${row.studentName} was absent on ${dateParam}.`,
        notificationType: 'attendance',
        module: 'attendance',
        entityType: 'student',
        entityId: row.studentId,
        isRead: false,
      } as never)
      enqueued += 1
    }

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'attendance',
      entityType: 'attendance_notification',
      entityId: dateParam,
      changes: { enqueued },
    })

    return ok({ date: dateParam, notificationsQueued: enqueued })
  })(request)
}

