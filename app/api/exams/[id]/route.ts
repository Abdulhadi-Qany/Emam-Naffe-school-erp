import { db } from '@/lib/db'
import { exams, academicYears, terms, examSchedules, examMarks, examResults } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, unprocessable, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET    /api/exams/[id]  → exam + schedules (with subject/class/room) + progress
 * PUT    /api/exams/[id]
 * DELETE /api/exams/[id]
 * POST   /api/exams/[id]/publish → flips status to `completed` (publishes results)
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('exams:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [row] = await db
      .select({
        exam: exams,
        academicYearName: academicYears.name,
        termName: terms.name,
      })
      .from(exams)
      .leftJoin(academicYears, eq(exams.academicYearId, academicYears.id))
      .leftJoin(terms, eq(exams.termId, terms.id))
      .where(and(eq(exams.id, id), eq(exams.schoolId, schoolId)))
      .limit(1)
    if (!row) return notFound('Exam not found')

    const schedules = await db
      .select()
      .from(examSchedules)
      .where(eq(examSchedules.examId, id))
      .orderBy(sql`${examSchedules.date} asc`)

    const [marks] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(examMarks)
      .innerJoin(examSchedules, eq(examMarks.examScheduleId, examSchedules.id))
      .where(eq(examSchedules.examId, id))

    return ok({
      ...row.exam,
      academicYearName: row.academicYearName,
      termName: row.termName,
      schedules,
      marksEntered: marks?.count ?? 0,
    })
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('exams:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(exams).where(and(eq(exams.id, id), eq(exams.schoolId, schoolId))).limit(1)
    if (!existing) return notFound('Exam not found')
    if (existing.status === 'completed') return badRequest('Published exams cannot be edited')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const startDate = body.startDate === undefined ? existing.startDate : new Date(String(body.startDate))
    const endDate = body.endDate === undefined ? existing.endDate : new Date(String(body.endDate))
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return badRequest('startDate and endDate must be valid dates')
    }
    if (endDate < startDate) return badRequest('endDate must be on or after startDate')

    const parsedTotalMarks = body.totalMarks === undefined ? Number(existing.totalMarks) : Number(body.totalMarks)
    const parsedPassMarks = body.passMarks === undefined ? Number(existing.passMarks) : Number(body.passMarks)
    if (!Number.isFinite(parsedTotalMarks) || parsedTotalMarks <= 0) return badRequest('totalMarks must be greater than zero')
    if (!Number.isFinite(parsedPassMarks) || parsedPassMarks < 0 || parsedPassMarks > parsedTotalMarks) {
      return badRequest('passMarks must be between zero and totalMarks')
    }
    if (body.status !== undefined && !['scheduled', 'ongoing', 'cancelled'].includes(String(body.status))) {
      return badRequest('status must be scheduled, ongoing or cancelled')
    }

    const [updated] = (await db
      .update(exams)
      .set({
        name: typeof body.name === 'string' && body.name.trim() !== '' ? body.name.trim() : existing.name,
        examType: typeof body.examType === 'string' && body.examType !== '' ? body.examType : existing.examType,
        termId: body.termId !== undefined ? (body.termId as string | null) : existing.termId,
        startDate,
        endDate,
        totalMarks: parsedTotalMarks.toFixed(2),
        passMarks: parsedPassMarks.toFixed(2),
        description: body.description !== undefined ? (body.description as string | null) : existing.description,
        status: body.status !== undefined ? (body.status as never) : existing.status,
        updatedAt: new Date(),
      })
      .where(eq(exams.id, id))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'academics',
      entityType: 'exam',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('exams:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select({ id: exams.id }).from(exams).where(and(eq(exams.id, id), eq(exams.schoolId, schoolId))).limit(1)
    if (!existing) return notFound('Exam not found')

    await db.delete(exams).where(eq(exams.id, id))

    await audit({
      schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'academics',
      entityType: 'exam',
      entityId: id,
    })

    return deleted('Exam deleted successfully')
  })(request, context)
}
