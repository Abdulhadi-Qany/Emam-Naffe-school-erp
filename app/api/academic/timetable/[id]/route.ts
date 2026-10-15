import { db } from '@/lib/db'
import { timetableEntries } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, conflict, withV1, audit } from '@/lib/api'
import { checkConflicts } from '../route'
import type { NextRequest } from 'next/server'

/**
 * PUT    /api/academic/timetable/[id]  (move/change teacher or room)
 * DELETE /api/academic/timetable/[id]
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select()
      .from(timetableEntries)
      .where(and(eq(timetableEntries.id, id), eq(timetableEntries.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Timetable entry not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const next = {
      classId: (body.classId as string) ?? existing.classId,
      teacherId: (body.teacherId as string) ?? existing.teacherId,
      subjectId: (body.subjectId as string) ?? existing.subjectId,
      periodId: (body.periodId as string) ?? existing.periodId,
      roomId: (body.roomId as string | undefined) ?? existing.roomId ?? undefined,
      dayOfWeek: (body.dayOfWeek as string) ?? existing.dayOfWeek,
    }

    const clash = await checkConflicts(schoolId, existing.academicYearId ?? '', { ...next, excludeId: id })
    if (clash) return clash

    const [updated] = (await db
      .update(timetableEntries)
      .set({
        classId: next.classId,
        teacherId: next.teacherId,
        subjectId: next.subjectId,
        periodId: next.periodId,
        roomId: next.roomId ?? null,
        dayOfWeek: next.dayOfWeek as never,
        updatedAt: new Date(),
      })
      .where(eq(timetableEntries.id, id))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'academics',
      entityType: 'timetable_entry',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select({ id: timetableEntries.id })
      .from(timetableEntries)
      .where(and(eq(timetableEntries.id, id), eq(timetableEntries.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Timetable entry not found')

    await db.delete(timetableEntries).where(eq(timetableEntries.id, id))

    await audit({
      schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'academics',
      entityType: 'timetable_entry',
      entityId: id,
    })

    return deleted('Timetable entry deleted successfully')
  })(request, context)
}
