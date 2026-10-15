import { db } from '@/lib/db'
import { students, studentTimeline, grades as gradesTable } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { ok, badRequest, notFound, unprocessable, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Promotion history.
 * GET  /api/students/[id]/promotion → timeline events of type promotion/transfer
 *      plus the pending-workflow summary used by the promote button.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('students:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [student] = await db
      .select({ id: students.id, currentGradeId: students.currentGradeId, currentSectionId: students.currentSectionId })
      .from(students)
      .where(and(eq(students.id, id), eq(students.schoolId, schoolId)))
      .limit(1)
    if (!student) return notFound('Student not found')

    const events = await db
      .select()
      .from(studentTimeline)
      .where(
        and(
          eq(studentTimeline.studentId, id),
          sql`${studentTimeline.eventType} in ('promotion', 'transfer', 'enrolled')`
        )
      )
      .orderBy(desc(studentTimeline.recordedAt))
      .limit(50)

    return ok({ events, currentGradeId: student.currentGradeId, currentSectionId: student.currentSectionId })
  })(request, context)
}

/**
 * POST /api/students/[id]/promotion { gradeId, sectionId, reason? }
 * → moves the student to the target grade/section and records the timeline event.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('students:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [student] = await db
      .select()
      .from(students)
      .where(and(eq(students.id, id), eq(students.schoolId, schoolId)))
      .limit(1)
    if (!student) return notFound('Student not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const gradeId = body.gradeId as string | undefined
    const sectionId = body.sectionId as string | undefined
    if (!gradeId || !sectionId) return badRequest('gradeId and sectionId are required')

    if (gradeId === student.currentGradeId && sectionId === student.currentSectionId) {
      return unprocessable('The student is already in that grade and section', 'NO_CHANGE')
    }

    if (student.status === 'dropped_out' || student.status === 'deleted') {
      return unprocessable(`A ${student.status} student cannot be promoted`, 'INVALID_STATUS')
    }

    const [targetGrade] = await db.select({ id: gradesTable.id, level: gradesTable.level }).from(gradesTable).where(eq(gradesTable.id, gradeId)).limit(1)
    if (!targetGrade) return badRequest('gradeId does not reference a grade')

    await db.transaction(async (tx) => {
      await tx
        .update(students)
        .set({ currentGradeId: gradeId, currentSectionId: sectionId, updatedAt: new Date() })
        .where(eq(students.id, id))

      await tx.insert(studentTimeline).values({
        id: crypto.randomUUID(),
        studentId: id,
        eventType: 'promotion',
        title: `Promoted to grade ${targetGrade.level}`,
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
      entityType: 'student_promotion',
      entityId: id,
      changes: { fromGradeId: student.currentGradeId, toGradeId: gradeId, fromSectionId: student.currentSectionId, toSectionId: sectionId },
    })

    return ok({ studentId: id, gradeId, sectionId, status: student.status })
  })(request, context)
}
