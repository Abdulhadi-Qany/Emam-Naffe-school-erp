import { db } from '@/lib/db'
import { vehicles } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('transport:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(vehicles).where(and(eq(vehicles.id, id), eq(vehicles.schoolId, schoolId))).limit(1)
    if (!existing) return notFound('Vehicle not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const [updated] = (await db
      .update(vehicles)
      .set({
        vehicleType: typeof body.vehicleType === 'string' && body.vehicleType !== '' ? body.vehicleType : existing.vehicleType,
        make: body.make !== undefined ? (body.make as string | null) : existing.make,
        model: body.model !== undefined ? (body.model as string | null) : existing.model,
        year: body.year !== undefined ? Number(body.year) : existing.year,
        capacity: body.capacity !== undefined ? Number(body.capacity) : existing.capacity,
        color: body.color !== undefined ? (body.color as string | null) : existing.color,
        engineNumber: body.engineNumber !== undefined ? (body.engineNumber as string | null) : existing.engineNumber,
        chassisNumber: body.chassisNumber !== undefined ? (body.chassisNumber as string | null) : existing.chassisNumber,
        insuranceExpiry: body.insuranceExpiry !== undefined ? (body.insuranceExpiry ? new Date(body.insuranceExpiry as string) : null) : existing.insuranceExpiry,
        registrationExpiry: body.registrationExpiry !== undefined ? (body.registrationExpiry ? new Date(body.registrationExpiry as string) : null) : existing.registrationExpiry,
        fitnessExpiry: body.fitnessExpiry !== undefined ? (body.fitnessExpiry ? new Date(body.fitnessExpiry as string) : null) : existing.fitnessExpiry,
        purchasePrice: body.purchasePrice !== undefined ? String(body.purchasePrice) : existing.purchasePrice,
        status: body.status !== undefined ? (body.status as never) : existing.status,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, id))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({ schoolId, userId: user.id, action: 'updated', module: 'transport', entityType: 'vehicle', entityId: id })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('transport:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(vehicles).where(and(eq(vehicles.id, id), eq(vehicles.schoolId, schoolId))).limit(1)
    if (!existing) return notFound('Vehicle not found')

    await db.delete(vehicles).where(eq(vehicles.id, id))

    await audit({ schoolId, userId: user.id, action: 'deleted', module: 'transport', entityType: 'vehicle', entityId: id })

    return deleted('Vehicle deleted successfully')
  })(request, context)
}