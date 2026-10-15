import { db } from '@/lib/db'
import { exams, reportCards } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, created, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/exams/[id]/report-cards
 * → returns generated report cards for an exam
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('exams:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [exam] = await db.select({ id: exams.id }).from(exams).where(and(eq(exams.id, id), eq(exams.schoolId, schoolId))).limit(1)
    if (!exam) return notFound('Exam not found')

    const cards = await db.select().from(reportCards).where(eq(reportCards.examId, id)).orderBy(sql`${reportCards.studentId} asc`)

    return ok({ examId: id, reportCards: cards })
  })(request)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('exams:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [exam] = await db.select({ id: exams.id }).from(exams).where(and(eq(exams.id, id), eq(exams.schoolId, schoolId))).limit(1)
    if (!exam) return notFound('Exam not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['studentId', 'grade']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const [createdRow] = (await db
      .insert(reportCards)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        examId: id,
        studentId: body.studentId as string,
        grade: String(body.grade),
        teacherRemarks: (body.remarks as string) ?? null,
        generatedBy: user.id,
        generatedAt: new Date(),
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({ schoolId, userId: user.id, action: 'created', module: 'exams', entityType: 'exam_report_card', entityId: createdRow.id as string })

    return created(createdRow)
  })(request)
}
