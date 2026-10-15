import { db } from '@/lib/db'
import { transportRoutes, vehicles, staff } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit, parsePagination, parseFilters, num } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * PUT /api/transport/routes/[id] → update route details
 * DELETE /api/transport/routes/[id] → delete route
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('transport:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(transportRoutes).where(and(eq(transportRoutes.id, id), eq(transportRoutes.schoolId, schoolId))).limit(1)
    if (!existing) return notFound('Route not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const [updated] = (await db
      .update(transportRoutes)
      .set({
        name: typeof body.name === 'string' && body.name.trim() !== '' ? body.name.trim() : existing.name,
        description: body.description !== undefined ? (body.description as string | null) : existing.description,
        startPoint: typeof body.startPoint === 'string' && body.startPoint.trim() !== '' ? body.startPoint : existing.startPoint,
        endPoint: typeof body.endPoint === 'string' && body.endPoint.trim() !== '' ? body.endPoint : existing.endPoint,
        distance: body.distance !== undefined ? String(body.distance) : existing.distance,
        estimatedTime: body.estimatedTime !== undefined ? (body.estimatedTime as string | null) : existing.estimatedTime,
        vehicleId: body.vehicleId !== undefined ? (body.vehicleId as string | null) : existing.vehicleId,
        driverId: body.driverId !== undefined ? (body.driverId as string | null) : existing.driverId,
        isActive: body.status !== undefined ? String(body.status) === 'active' : existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(transportRoutes.id, id))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({ schoolId, userId: user.id, action: 'updated', module: 'transport', entityType: 'route', entityId: id })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('transport:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select({ id: transportRoutes.id }).from(transportRoutes).where(and(eq(transportRoutes.id, id), eq(transportRoutes.schoolId, schoolId))).limit(1)
    if (!existing) return notFound('Route not found')

    await db.delete(transportRoutes).where(eq(transportRoutes.id, id))

    await audit({ schoolId, userId: user.id, action: 'deleted', module: 'transport', entityType: 'route', entityId: id })

    return deleted('Route deleted successfully')
  })(request, context)
}

