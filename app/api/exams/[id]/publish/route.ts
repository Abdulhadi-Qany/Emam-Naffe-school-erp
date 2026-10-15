import { db } from '@/lib/db'
import { exams, examSchedules, examMarks, examResults } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, badRequest, notFound, unprocessable, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * POST /api/exams/[id]/publish — computes per-student results from entered
 * marks (totals, percentage, grade, pass/fail, rank) and marks the exam as
 * completed. Idempotent: recomputes and replaces `exam_results` for the exam.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('exams:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, id), eq(exams.schoolId, schoolId)))
      .limit(1)
    if (!exam) return notFound('Exam not found')

    if (exam.status === 'cancelled') return unprocessable('Cannot publish a cancelled exam', 'INVALID_STATE')

    const schedules = await db.select().from(examSchedules).where(eq(examSchedules.examId, id))
    if (schedules.length === 0) return unprocessable('Add exam schedules before publishing', 'NO_SCHEDULES')

    const marks = await db
      .select({
        examScheduleId: examMarks.examScheduleId,
        studentId: examMarks.studentId,
        totalMarks: examMarks.totalMarks,
      })
      .from(examMarks)
      .innerJoin(examSchedules, eq(examMarks.examScheduleId, examSchedules.id))
      .where(eq(examSchedules.examId, id))
      .limit(5000)

    if (marks.length === 0) return unprocessable('No marks entered yet; publish requires marks', 'NO_MARKS')

    const scheduleById = new Map(schedules.map((schedule) => [schedule.id, schedule]))
    const byStudent = new Map<string, { obtained: number; max: number }>()
    for (const mark of marks) {
      const schedule = scheduleById.get(mark.examScheduleId)
      const obtained = Number(mark.totalMarks ?? 0)
      const max = Number(schedule?.maxMarks ?? exam.totalMarks ?? 0)
      const entry = byStudent.get(mark.studentId) ?? { obtained: 0, max: 0 }
      entry.obtained += obtained
      entry.max += max
      byStudent.set(mark.studentId, entry)
    }

    const totalMarks = Number(exam.totalMarks ?? 0)
    const passMarks = Number(exam.passMarks ?? 0)
    const passPercentage = totalMarks > 0 ? (passMarks / totalMarks) * 100 : 40

    const resultRows = Array.from(byStudent.entries())
      .map(([studentId, value]) => {
        const percentage = value.max > 0 ? Number(((value.obtained / value.max) * 100).toFixed(2)) : 0
        return {
          id: crypto.randomUUID(),
          schoolId,
          examId: id,
          studentId,
          totalMarks: value.obtained.toFixed(2),
          maxMarks: value.max.toFixed(2),
          percentage: percentage.toFixed(2),
          grade: percentageToGrade(percentage),
          result: percentage >= passPercentage ? 'pass' : 'fail',
          rank: 0,
        }
      })
      .sort((a, b) => Number(b.totalMarks) - Number(a.totalMarks))
      .map((row, index) => ({ ...row, rank: index + 1 }))

    await db.transaction(async (tx) => {
      await tx.delete(examResults).where(eq(examResults.examId, id))
      await tx.insert(examResults).values(resultRows as never)
      await tx.update(exams).set({ status: 'completed', updatedAt: new Date() }).where(eq(exams.id, id))
    })

    await audit({
      schoolId,
      userId: user.id,
      action: 'published',
      module: 'academics',
      entityType: 'exam',
      entityId: id,
      changes: { studentsGraded: resultRows.length },
    })

    return ok({ examId: id, studentsGraded: resultRows.length, published: true })
  })(request, context)
}

function percentageToGrade(percentage: number): string {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  return 'F'
}
