import { db } from '@/lib/db'
import { homework, homeworkSubmissions } from '@/lib/db/schema'
import { and, eq, inArray } from 'drizzle-orm'
import { ok, badRequest, notFound, unprocessable, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * POST /api/homework/[id]/submissions/grade
 * { submissions: [{ id, marks, feedback? }] } — grades individual submissions
 * and validates marks against the homework's max marks.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('homework:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [assignment] = await db
      .select({ id: homework.id, maxMarks: homework.maxMarks })
      .from(homework)
      .where(and(eq(homework.id, id), eq(homework.schoolId, schoolId)))
      .limit(1)
    if (!assignment) return notFound('Homework not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const submissions = body?.submissions as { id: string; marks: number; feedback?: string }[] | undefined
    if (!Array.isArray(submissions) || submissions.length === 0) {
      return badRequest('submissions must be a non-empty array')
    }

    const maxMarks = Number(assignment.maxMarks ?? 0)
    const invalid = submissions.find((s) => !s?.id || !Number.isFinite(Number(s.marks)) || Number(s.marks) < 0 || Number(s.marks) > maxMarks)
    if (invalid) return unprocessable(`Marks must be between 0 and ${maxMarks}`, 'INVALID_MARKS')
    const submissionIds = submissions.map((submission) => submission.id)
    if (new Set(submissionIds).size !== submissionIds.length) return badRequest('submission ids must be unique')
    const existingRows = await db.select({ id: homeworkSubmissions.id }).from(homeworkSubmissions)
      .where(and(eq(homeworkSubmissions.homeworkId, id), inArray(homeworkSubmissions.id, submissionIds)))
    if (existingRows.length !== submissionIds.length) return unprocessable('Every submission must belong to this homework assignment', 'INVALID_SUBMISSION')

    const updated = await db.transaction(async (tx) => {
      const results: Record<string, unknown>[] = []
      for (const submission of submissions) {
        const [row] = (await tx
          .update(homeworkSubmissions)
          .set({
            marks: String(submission.marks),
            feedback: submission.feedback ?? null,
            status: 'graded',
            gradedBy: user.id,
            gradedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(homeworkSubmissions.id, submission.id))
          .returning()) as unknown as Record<string, unknown>[]
        results.push(row)
      }
      return results
    })

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'academics',
      entityType: 'homework_submission',
      entityId: id,
      changes: { graded: updated.length },
    })

    return ok({ homeworkId: id, graded: updated.length })
  })(request, context)
}
