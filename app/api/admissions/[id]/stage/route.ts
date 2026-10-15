import { db } from '@/lib/db'
import { admissionApplications } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, badRequest, notFound, unprocessable, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

const STAGES = ['submitted', 'document_verification', 'assessment', 'interview', 'approved', 'waitlisted', 'rejected', 'enrolled'] as const
const ORDER: Record<string, number> = {
  submitted: 0,
  document_verification: 1,
  assessment: 2,
  interview: 3,
  approved: 4,
  enrolled: 5,
  waitlisted: 6,
  rejected: 7,
}

/**
 * POST /api/admissions/[id]/stage { status }
 * → advances the pipeline stage. Rejections and waitlisting are always
 *   allowed; forward transitions must not move backwards.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('admissions:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [existing] = await db
      .select({ id: admissionApplications.id, status: admissionApplications.status })
      .from(admissionApplications)
      .where(and(eq(admissionApplications.id, id), eq(admissionApplications.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Application not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const status = body?.status as string | undefined
    if (!status || !STAGES.includes(status as (typeof STAGES)[number])) {
      return badRequest(`status must be one of: ${STAGES.join(', ')}`)
    }

    const terminal = ['rejected', 'waitlisted', 'enrolled']
    const isForward = ORDER[status] >= ORDER[existing.status]
    if (!isForward && !terminal.includes(status)) {
      return unprocessable(`Cannot move from ${existing.status} back to ${status}`, 'INVALID_TRANSITION')
    }

    const [updated] = (await db
      .update(admissionApplications)
      .set({ status, reviewedBy: user.id, reviewedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(admissionApplications.id, id), eq(admissionApplications.schoolId, schoolId)))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'admissions',
      entityType: 'admission_application',
      entityId: id,
      changes: { from: existing.status, to: status },
    })

    return ok(updated)
  })(request, context)
}
