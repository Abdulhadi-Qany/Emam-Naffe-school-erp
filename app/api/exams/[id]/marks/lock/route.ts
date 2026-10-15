import { db } from '@/lib/db'
import { examSchedules, examMarks } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, badRequest, unprocessable, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * POST /api/exams/[id]/marks/lock { examScheduleId }
 * → freezes all mark rows for a schedule so late corrections are impossible
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('exams:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    void id
    void schoolId

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const examScheduleId = body?.examScheduleId as string | undefined
    if (!examScheduleId) return badRequest('examScheduleId is required')

    const [schedule] = await db
      .select({ id: examSchedules.id })
      .from(examSchedules)
      .where(eq(examSchedules.id, examScheduleId))
      .limit(1)
    if (!schedule) return badRequest('examScheduleId does not reference a schedule')

    const updated = await db
      .update(examMarks)
      .set({ status: 'locked', updatedAt: new Date() } as never)
      .where(eq(examMarks.examScheduleId, examScheduleId))
      .returning()

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'academics',
      entityType: 'exam_marks',
      entityId: examScheduleId,
      changes: { locked: updated.length },
    })

    if (updated.length === 0) return unprocessable('No marks entered yet for this schedule', 'NO_MARKS')

    return ok({ examScheduleId, rowsLocked: updated.length })
  })(request, context)
}
