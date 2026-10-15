import { db } from '@/lib/db'
import { exams, examSchedules, examMarks, examResults, students } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, created, badRequest, notFound, unprocessable, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Exam marks entry.
 * POST /api/exams/[id]/marks { examScheduleId, marks: [{ studentId, theoryMarks?, practicalMarks?, internalAssessment?, totalMarks, remarks? }] }
 *   → upserts every student's row for one schedule (transaction) and validates
 *     that totals do not exceed the schedule max marks.
 * POST /api/exams/[id]/marks/lock { examScheduleId } → locks the schedule
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('exams:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [exam] = await db
      .select({ id: exams.id, status: exams.status })
      .from(exams)
      .where(and(eq(exams.id, id), eq(exams.schoolId, schoolId)))
      .limit(1)
    if (!exam) return notFound('Exam not found')
    if (exam.status === 'completed') return unprocessable('Marks cannot change after the exam is published', 'EXAM_PUBLISHED')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const examScheduleId = body.examScheduleId as string
    const marks = body.marks as
      | { studentId: string; theoryMarks?: number; practicalMarks?: number; internalAssessment?: number; totalMarks?: number; remarks?: string }[]
      | undefined

    if (!examScheduleId || !Array.isArray(marks) || marks.length === 0) {
      return badRequest('examScheduleId and marks are required')
    }

    const [schedule] = await db
      .select()
      .from(examSchedules)
      .where(and(eq(examSchedules.id, examScheduleId), eq(examSchedules.examId, id)))
      .limit(1)
    if (!schedule) return notFound('Exam schedule not found')

    const maxMarks = Number(schedule.maxMarks ?? 100)

    const invalid = marks.find((mark) => {
      if (!mark.studentId) return true
      const total = Number(mark.totalMarks ?? ((mark.theoryMarks ?? 0) + (mark.practicalMarks ?? 0) + (mark.internalAssessment ?? 0)))
      return !Number.isFinite(total) || total < 0 || total > maxMarks
    })
    if (invalid) return unprocessable(`Each mark row must have a studentId and a totalMarks between 0 and ${maxMarks}`, 'INVALID_MARKS')

    const [locked] = await db
      .select({ id: examMarks.id })
      .from(examMarks)
      .where(and(eq(examMarks.examScheduleId, examScheduleId), sql`${examMarks.status} = 'locked'`))
      .limit(1)
    if (locked) return unprocessable('This schedule is locked', 'MARKS_LOCKED')

    const result = await db.transaction(async (tx) => {
      let written = 0
      for (const mark of marks) {
        const total = Number(mark.totalMarks ?? ((mark.theoryMarks ?? 0) + (mark.practicalMarks ?? 0) + (mark.internalAssessment ?? 0)))
        const values = {
          theoryMarks: mark.theoryMarks !== undefined ? String(mark.theoryMarks) : null,
          practicalMarks: mark.practicalMarks !== undefined ? String(mark.practicalMarks) : null,
          internalAssessment: mark.internalAssessment !== undefined ? String(mark.internalAssessment) : null,
          totalMarks: total.toFixed(2),
          remarks: mark.remarks ?? null,
          enteredBy: user.id,
          updatedAt: new Date(),
        }

        const [existing] = await tx
          .select({ id: examMarks.id })
          .from(examMarks)
          .where(and(eq(examMarks.examScheduleId, examScheduleId), eq(examMarks.studentId, mark.studentId)))
          .limit(1)

        if (existing) {
          await tx.update(examMarks).set(values as never).where(eq(examMarks.id, existing.id))
        } else {
          await tx.insert(examMarks).values({
            id: crypto.randomUUID(),
            examScheduleId,
            studentId: mark.studentId,
            ...values,
          } as never)
        }
        written += 1
      }
      return written
    })

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'academics',
      entityType: 'exam_marks',
      entityId: examScheduleId,
      changes: { examId: id, rows: result },
    })

    return created({ examScheduleId, rowsWritten: result })
  })(request)
}
