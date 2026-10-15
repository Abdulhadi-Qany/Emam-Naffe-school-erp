import { db } from '@/lib/db'
import { facilityBookings } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * PUT /api/facilities/[id] → confirm or cancel a booking
 * DELETE /api/facilities/[id] → cancels a booking
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('facilities:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(facilityBookings).where(and(eq(facilityBookings.id, id), eq(facilityBookings.schoolId, schoolId))).limit(1)
    if (!existing) return notFound('Booking not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const [updated] = (await db
      .update(facilityBookings)
      .set({
        title: typeof body.title === 'string' && body.title.trim() !== '' ? body.title.trim() : existing.title,
        status: body.status !== undefined ? (body.status as string) : existing.status,
        notes: body.notes !== undefined ? (body.notes as string | null) : existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(facilityBookings.id, id))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({ schoolId, userId: user.id, action: 'updated', module: 'facilities', entityType: 'facility_booking', entityId: id })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('facilities:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select({ id: facilityBookings.id }).from(facilityBookings).where(and(eq(facilityBookings.id, id), eq(facilityBookings.schoolId, schoolId))).limit(1)
    if (!existing) return notFound('Booking not found')

    await db.delete(facilityBookings).where(eq(facilityBookings.id, id))

    await audit({ schoolId: schoolId, userId: user.id, action: 'deleted', module: 'facilities', entityType: 'facility_booking', entityId: id })

    return deleted('Booking cancelled successfully')
  })(request, context)
}
