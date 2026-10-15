import { db } from '@/lib/db'
import { events } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit, num } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('events:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [row] = await db.select().from(events).where(and(eq(events.id, id), eq(events.schoolId, schoolId))).limit(1)
    if (!row) return notFound('Event not found')
    return ok(row)
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('events:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(events).where(and(eq(events.id, id), eq(events.schoolId, schoolId))).limit(1)
    if (!existing) return notFound('Event not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const [updated] = (await db
      .update(events)
      .set({
        title: typeof body.title === 'string' && body.title.trim() !== '' ? body.title.trim() : existing.title,
        titleDari: body.titleDari !== undefined ? (body.titleDari as string | null) : existing.titleDari,
        titlePashto: body.titlePashto !== undefined ? (body.titlePashto as string | null) : existing.titlePashto,
        description: body.description !== undefined ? (body.description as string | null) : existing.description,
        eventType: typeof body.eventType === 'string' && body.eventType !== '' ? (body.eventType as never) : existing.eventType,
        startDate: body.startDate !== undefined ? new Date(body.startDate as string) : existing.startDate,
        endDate: body.endDate !== undefined ? new Date(body.endDate as string) : existing.endDate,
        venue: body.venue !== undefined ? (body.venue as string | null) : existing.venue,
        organizer: body.organizer !== undefined ? (body.organizer as string | null) : existing.organizer,
        budget: body.budget !== undefined ? String(body.budget) : existing.budget,
        actualCost: body.actualCost !== undefined ? num(body.actualCost).toFixed(2) : existing.actualCost,
        chiefGuest: body.chiefGuest !== undefined ? (body.chiefGuest as string | null) : existing.chiefGuest,
        isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : existing.isPublished,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({ schoolId, userId: user.id, action: 'updated', module: 'engagement', entityType: 'event', entityId: id })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('events:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(events).where(and(eq(events.id, id), eq(events.schoolId, schoolId))).limit(1)
    if (!existing) return notFound('Event not found')

    await db.delete(events).where(eq(events.id, id))

    await audit({ schoolId, userId: user.id, action: 'deleted', module: 'engagement', entityType: 'event', entityId: id })

    return deleted('Event deleted successfully')
  })(request, context)
}