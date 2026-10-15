import { db } from '@/lib/db'
import { students, studentTimeline } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { ok, badRequest, notFound, unprocessable, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/** GET /api/students/withdrawals → withdrawn/transferred students. */
export async function GET(request: NextRequest) {
  return withV1('students:read', async ({ schoolId }) => {
    const rows = await db
      .select({
        id: students.id,
        studentId: students.studentId,
        fullName: students.fullName,
        status: students.status,
        currentGradeId: students.currentGradeId,
        updatedAt: students.updatedAt,
      })
      .from(students)
      .where(and(eq(students.schoolId, schoolId), sql`${students.status} in ('transferred', 'dropped_out', 'inactive', 'graduated')`))
      .orderBy(desc(students.updatedAt))
      .limit(500)

    return ok({ students: rows })
  })(request)
}

/** POST /api/students/withdrawals { studentId, status, reason } → withdrawal workflow. */
export async function POST(request: NextRequest) {
  return withV1('students:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const studentId = body.studentId as string
    const status = body.status as string
    if (!studentId) return badRequest('studentId is required')
    if (!['transferred', 'dropped_out', 'graduated', 'inactive'].includes(status)) {
      return badRequest("status must be transferred, dropped_out, graduated or inactive")
    }

    const [student] = await db
      .select({ id: students.id, status: students.status })
      .from(students)
      .where(and(eq(students.id, studentId), eq(students.schoolId, schoolId)))
      .limit(1)
    if (!student) return notFound('Student not found')

    await db.transaction(async (tx) => {
      await tx.update(students).set({ status: status as never, updatedAt: new Date() }).where(eq(students.id, studentId))
      await tx.insert(studentTimeline).values({
        id: crypto.randomUUID(),
        studentId,
        eventType: status === 'transferred' ? 'transfer' : 'dropout',
        title: status === 'transferred' ? 'Transferred out' : status === 'graduated' ? 'Graduated' : 'Withdrawn',
        description: (body.reason as string) ?? null,
        recordedBy: user.id,
        recordedAt: new Date(),
      } as never)
    })

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'students',
      entityType: 'student_withdrawal',
      entityId: studentId,
      changes: { status, reason: body.reason ?? null },
    })

    return ok({ studentId, status, previousStatus: student.status })
  })(request)
}