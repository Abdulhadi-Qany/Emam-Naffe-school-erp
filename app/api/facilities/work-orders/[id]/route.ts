import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { facilityWorkOrders } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, badRequest, notFound, withV1, audit } from '@/lib/api'

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('facilities:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select()
      .from(facilityWorkOrders)
      .where(and(eq(facilityWorkOrders.id, id), eq(facilityWorkOrders.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Work order not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const [updated] = (await db
      .update(facilityWorkOrders)
      .set({
        title: typeof body.title === 'string' && body.title.trim() !== '' ? body.title.trim() : existing.title,
        description: body.description !== undefined ? (body.description as string | null) : existing.description,
        priority: body.priority !== undefined ? (body.priority as never) : existing.priority,
        status: body.status !== undefined ? (body.status as never) : existing.status,
        assignedTo: body.assignedTo !== undefined ? (body.assignedTo as string | null) : existing.assignedTo,
        cost: body.cost !== undefined ? String(body.cost) : existing.cost,
        completedAt: body.status === 'completed' ? new Date() : existing.completedAt,
        updatedAt: new Date(),
      })
      .where(eq(facilityWorkOrders.id, id))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'facilities',
      entityType: 'facility_work_order',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}
