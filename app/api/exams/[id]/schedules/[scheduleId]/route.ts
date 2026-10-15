import { db } from '@/lib/db'
import { exams, examSchedules } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * PUT    /api/exams/[id]/schedules/[scheduleId]
 * DELETE /api/exams/[id]/schedules/[scheduleId]
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string; scheduleId: string }> }) {
  return withV1('exams:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string; scheduleId: string }> }) => {
    const { id, scheduleId } = await ctx.params

    const [exam] = await db.select({ id: exams.id, status: exams.status }).from(exams).where(and(eq(exams.id, id), eq(exams.schoolId, schoolId))).limit(1)
    if (!exam) return notFound('Exam not found')
    if (exam.status === 'completed') return badRequest('Schedules cannot change after the exam is published')

    const [existing] = await db
      .select()
      .from(examSchedules)
      .where(and(eq(examSchedules.id, scheduleId), eq(examSchedules.examId, id)))
      .limit(1)
    if (!existing) return notFound('Schedule not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const [updated] = (await db
      .update(examSchedules)
      .set({
        date: body.date !== undefined ? new Date(body.date as string) : existing.date,
        startTime: body.startTime !== undefined ? String(body.startTime) : existing.startTime,
        endTime: body.endTime !== undefined ? String(body.endTime) : existing.endTime,
        duration: body.duration !== undefined ? Number(body.duration) : existing.duration,
        roomId: body.roomId !== undefined ? (body.roomId as string | null) : existing.roomId,
        maxMarks: body.maxMarks !== undefined ? String(body.maxMarks) : existing.maxMarks,
        passMarks: body.passMarks !== undefined ? String(body.passMarks) : existing.passMarks,
        invigilators: body.invigilators !== undefined ? (body.invigilators as never[]) : existing.invigilators,
        updatedAt: new Date(),
      })
      .where(eq(examSchedules.id, scheduleId))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'academics',
      entityType: 'exam_schedule',
      entityId: scheduleId,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string; scheduleId: string }> }) {
  return withV1('exams:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string; scheduleId: string }> }) => {
    const { id, scheduleId } = await ctx.params

    const [exam] = await db.select({ id: exams.id, status: exams.status }).from(exams).where(and(eq(exams.id, id), eq(exams.schoolId, schoolId))).limit(1)
    if (!exam) return notFound('Exam not found')
    if (exam.status === 'completed') return badRequest('Schedules cannot change after the exam is published')

    await db.delete(examSchedules).where(eq(examSchedules.id, scheduleId))

    await audit({
      schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'academics',
      entityType: 'exam_schedule',
      entityId: scheduleId,
    })

    return deleted('Schedule deleted successfully')
  })(request, context)
}
