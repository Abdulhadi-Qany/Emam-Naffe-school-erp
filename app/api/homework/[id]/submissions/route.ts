import { db } from '@/lib/db'
import { homework, homeworkSubmissions, students, staff, classes } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, created, badRequest, notFound, unprocessable, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Homework submissions.
 * GET  /api/homework/[id]/submissions → per-student submission rows
 * POST /api/homework/[id]/submissions { submissions: [{ studentId, content?, attachments? }] }
 *      → upserts submissions for one homework (transaction)
 * POST /api/homework/[id]/submissions/grade { submissions: [{ id, marks, feedback? }] }
 *      → grades submissions (validated against the homework max marks)
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('homework:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [assignment] = await db
      .select({ id: homework.id })
      .from(homework)
      .where(and(eq(homework.id, id), eq(homework.schoolId, schoolId)))
      .limit(1)
    if (!assignment) return notFound('Homework not found')

    const rows = await db
      .select({
        submission: homeworkSubmissions,
        studentName: students.fullName,
        admissionNumber: students.admissionNumber,
        gradedByName: staff.fullName,
      })
      .from(homeworkSubmissions)
      .leftJoin(students, and(eq(homeworkSubmissions.studentId, students.id), eq(students.schoolId, schoolId)))
      .leftJoin(staff, and(eq(homeworkSubmissions.gradedBy, staff.id), eq(staff.schoolId, schoolId)))
      .where(eq(homeworkSubmissions.homeworkId, id))
      .orderBy(sql`${students.fullName} asc`)

    return ok({
      submissions: rows.map(({ submission, studentName, admissionNumber, gradedByName }) => ({
        ...submission,
        studentName,
        admissionNumber,
        gradedByName,
        submissionDateLabel: submission.submissionDate ? submission.submissionDate.toISOString().slice(0, 10) : null,
      })),
    })
  })(request, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('homework:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [assignment] = await db
      .select({ id: homework.id, classId: homework.classId, schoolId: homework.schoolId })
      .from(homework)
      .where(and(eq(homework.id, id), eq(homework.schoolId, schoolId)))
      .limit(1)
    if (!assignment) return notFound('Homework not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const submissions = body?.submissions as
      | { studentId: string; content?: string; attachments?: unknown[] }[]
      | undefined

    if (!Array.isArray(submissions) || submissions.length === 0) {
      return badRequest('submissions must be a non-empty array')
    }
    if (submissions.some((submission) => !submission || typeof submission.studentId !== 'string' || !submission.studentId)) {
      return badRequest('each submission requires a studentId')
    }
    const studentIds = submissions.map((submission) => submission.studentId)
    if (new Set(studentIds).size !== studentIds.length) return badRequest('studentId values must be unique')
    const [assignmentClass] = await db.select({ gradeId: classes.gradeId, sectionId: classes.sectionId }).from(classes)
      .where(and(eq(classes.id, assignment.classId), eq(classes.schoolId, schoolId))).limit(1)
    if (!assignmentClass) return notFound('Homework class not found')
    const validStudents = await db.select({ id: students.id }).from(students)
      .where(and(
        eq(students.schoolId, schoolId),
        eq(students.status, 'active'),
        eq(students.currentGradeId, assignmentClass.gradeId),
        eq(students.currentSectionId, assignmentClass.sectionId)
      ))
    const validStudentIds = new Set(validStudents.map((student) => student.id))
    if (studentIds.some((studentId) => !validStudentIds.has(studentId))) {
      return unprocessable('All students must be active members of the assigned class', 'INVALID_STUDENT')
    }

    const written = await db.transaction(async (tx) => {
      let count = 0
      for (const submission of submissions) {
        const values = {
          content: submission.content ?? null,
          attachments: (submission.attachments ?? []) as never[],
          submissionDate: new Date(),
          marks: null,
          feedback: null,
          gradedBy: null,
          gradedAt: null,
          status: 'submitted',
          updatedAt: new Date(),
        }
        const [existing] = await tx
          .select({ id: homeworkSubmissions.id })
          .from(homeworkSubmissions)
          .where(and(eq(homeworkSubmissions.homeworkId, id), eq(homeworkSubmissions.studentId, submission.studentId)))
          .limit(1)

        if (existing) {
          await tx.update(homeworkSubmissions).set(values as never).where(eq(homeworkSubmissions.id, existing.id))
        } else {
          await tx.insert(homeworkSubmissions).values({
            id: crypto.randomUUID(),
            homeworkId: id,
            studentId: submission.studentId,
            ...values,
          } as never)
        }
        count += 1
      }
      return count
    })

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'academics',
      entityType: 'homework_submission',
      entityId: id,
      changes: { rows: written },
    })

    return created({ homeworkId: id, rowsWritten: written })
  })(request)
}
