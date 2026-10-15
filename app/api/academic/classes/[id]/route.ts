import { db } from '@/lib/db'
import { classes, grades, sections, rooms, timetableEntries } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET    /api/academic/classes/[id]
 * PUT    /api/academic/classes/[id]
 * DELETE /api/academic/classes/[id]  (soft delete via `status = 'deleted'`)
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [row] = await db
      .select({
        id: classes.id,
        schoolId: classes.schoolId,
        name: classes.name,
        status: classes.status,
        capacity: classes.capacity,
        gradeId: grades.id,
        gradeName: grades.name,
        gradeLevel: grades.level,
        sectionId: sections.id,
        sectionName: sections.name,
        roomLabel: rooms.name,
      })
      .from(classes)
      .leftJoin(grades, eq(classes.gradeId, grades.id))
      .leftJoin(sections, eq(classes.sectionId, sections.id))
      .leftJoin(rooms, eq(classes.roomId, rooms.id))
      .where(and(eq(classes.id, id), eq(classes.schoolId, schoolId)))
      .limit(1)
    if (!row) return notFound('Class not found')
    return ok(row)
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(classes).where(and(eq(classes.id, id), eq(classes.schoolId, schoolId))).limit(1)
    if (!existing) return notFound('Class not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')
    const gradeId = typeof body.gradeId === 'string' ? body.gradeId : existing.gradeId
    const sectionId = typeof body.sectionId === 'string' ? body.sectionId : existing.sectionId
    const [section] = await db.select({ id: sections.id, gradeId: sections.gradeId }).from(sections)
      .where(and(eq(sections.id, sectionId), eq(sections.schoolId, schoolId))).limit(1)
    const [grade] = await db.select({ id: grades.id }).from(grades)
      .where(and(eq(grades.id, gradeId), eq(grades.schoolId, schoolId))).limit(1)
    if (!grade || !section || section.gradeId !== gradeId) {
      return badRequest('gradeId and sectionId must identify a matching grade and section in this school')
    }
    const capacity = body.capacity === undefined ? existing.capacity ?? 40 : Number(body.capacity)
    if (!Number.isInteger(capacity) || capacity < 1) return badRequest('capacity must be a positive integer')

    const [updated] = await db
      .update(classes)
      .set({
        name: typeof body.name === 'string' && body.name.trim() !== '' ? body.name.trim() : existing.name,
        gradeId,
        sectionId,
        capacity,
        roomId: body.roomId !== undefined ? (body.roomId as string | null) : existing.roomId,
        status: body.status !== undefined ? (body.status as never) : existing.status,
        updatedAt: new Date(),
      })
      .where(eq(classes.id, id))
      .returning()

    await audit({
      schoolId: existing.schoolId,
      userId: user.id,
      action: 'updated',
      module: 'academics',
      entityType: 'class',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(classes).where(and(eq(classes.id, id), eq(classes.schoolId, schoolId))).limit(1)
    if (!existing) return notFound('Class not found')

    const [hasTimetable] = await db
      .select({ id: timetableEntries.id })
      .from(timetableEntries)
      .where(eq(timetableEntries.classId, id))
      .limit(1)
    if (hasTimetable) {
      return badRequest('This class has timetable entries; remove them before deleting the class')
    }

    await db.update(classes).set({ status: 'deleted', updatedAt: new Date() }).where(eq(classes.id, id))

    await audit({
      schoolId: existing.schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'academics',
      entityType: 'class',
      entityId: id,
    })

    return deleted('Class deleted successfully')
  })(request, context)
}
