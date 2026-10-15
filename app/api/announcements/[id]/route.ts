import { db } from '@/lib/db'
import { announcements } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

const CATEGORIES = ['academic', 'general', 'event', 'urgent'] as const
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
const STATUSES = ['draft', 'published', 'scheduled', 'archived'] as const

/**
 * GET    /api/announcements/[id]
 * PUT    /api/announcements/[id]
 * DELETE /api/announcements/[id]
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('announcements:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [row] = await db
      .select()
      .from(announcements)
      .where(and(eq(announcements.id, id), eq(announcements.schoolId, schoolId)))
      .limit(1)
    if (!row) return notFound('Announcement not found')
    return ok(row)
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('announcements:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select()
      .from(announcements)
      .where(and(eq(announcements.id, id), eq(announcements.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Announcement not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    if (body.category !== undefined && !CATEGORIES.includes(body.category as (typeof CATEGORIES)[number])) {
      return badRequest(`category must be one of: ${CATEGORIES.join(', ')}`)
    }
    if (body.priority !== undefined && !PRIORITIES.includes(body.priority as (typeof PRIORITIES)[number])) {
      return badRequest(`priority must be one of: ${PRIORITIES.join(', ')}`)
    }
    if (body.status !== undefined && !STATUSES.includes(body.status as (typeof STATUSES)[number])) {
      return badRequest(`status must be one of: ${STATUSES.join(', ')}`)
    }
    if (body.isPinned !== undefined && typeof body.isPinned !== 'boolean') return badRequest('isPinned must be a boolean')
    if (body.targetAudience !== undefined && (!Array.isArray(body.targetAudience) || body.targetAudience.some((value) => typeof value !== 'string'))) {
      return badRequest('targetAudience must be an array of strings')
    }
    if (body.expiryDate !== undefined && body.expiryDate !== null && (typeof body.expiryDate !== 'string' || Number.isNaN(new Date(body.expiryDate).getTime()))) {
      return badRequest('expiryDate must be a valid date or null')
    }

    const [updated] = (await db
      .update(announcements)
      .set({
        title: typeof body.title === 'string' && body.title.trim() !== '' ? body.title.trim() : existing.title,
        titleDari: body.titleDari !== undefined ? (body.titleDari as string | null) : existing.titleDari,
        titlePashto: body.titlePashto !== undefined ? (body.titlePashto as string | null) : existing.titlePashto,
        description: body.description !== undefined ? String(body.description) : existing.description,
        descriptionDari: body.descriptionDari !== undefined ? (body.descriptionDari as string | null) : existing.descriptionDari,
        descriptionPashto: body.descriptionPashto !== undefined ? (body.descriptionPashto as string | null) : existing.descriptionPashto,
        category: body.category !== undefined ? (body.category as string) : existing.category,
        priority: body.priority !== undefined ? (body.priority as never) : existing.priority,
        status: body.status !== undefined ? (body.status as string) : existing.status,
        targetAudience: body.targetAudience !== undefined ? (body.targetAudience as never[]) : existing.targetAudience,
        isPinned: body.isPinned !== undefined ? body.isPinned : existing.isPinned,
        expiryDate: body.expiryDate !== undefined ? (body.expiryDate ? new Date(body.expiryDate as string) : null) : existing.expiryDate,
        attachment: body.attachment !== undefined ? (body.attachment as string | null) : existing.attachment,
        updatedAt: new Date(),
      })
      .where(and(eq(announcements.id, id), eq(announcements.schoolId, schoolId)))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'engagement',
      entityType: 'announcement',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('announcements:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select({ id: announcements.id })
      .from(announcements)
      .where(and(eq(announcements.id, id), eq(announcements.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Announcement not found')

    await db.delete(announcements).where(and(eq(announcements.id, id), eq(announcements.schoolId, schoolId)))

    await audit({
      schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'engagement',
      entityType: 'announcement',
      entityId: id,
    })

    return deleted('Announcement deleted successfully')
  })(request, context)
}
