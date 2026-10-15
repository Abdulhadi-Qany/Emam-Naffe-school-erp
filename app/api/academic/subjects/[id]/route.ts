import { db } from '@/lib/db'
import { subjects, timetableEntries } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:read', async (_ctx, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [row] = await db
      .select({
        subject: subjects,
        weeklyPeriods: sql<number>`(
          select count(*)::int from ${timetableEntries} te where te.subject_id = ${subjects.id}
        )`,
      })
      .from(subjects)
      .where(eq(subjects.id, id))
      .limit(1)
    if (!row) return notFound('Subject not found')
    return ok({
      ...row.subject,
      weeklyPeriods: row.weeklyPeriods ?? 0,
      type: row.subject.isElective ? 'elective' : 'core',
    })
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:write', async ({ user }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1)
    if (!existing) return notFound('Subject not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    if (typeof body.code === 'string' && body.code.trim() !== '' && body.code.trim() !== existing.code) {
      const [duplicate] = await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.code, body.code.trim())).limit(1)
      if (duplicate) return badRequest('A subject with this code already exists')
    }

    const [updated] = await db
      .update(subjects)
      .set({
        name: typeof body.name === 'string' && body.name.trim() !== '' ? body.name.trim() : existing.name,
        code: typeof body.code === 'string' && body.code.trim() !== '' ? body.code.trim() : existing.code,
        description: body.description !== undefined ? (body.description as string | null) : existing.description,
        creditHours: body.creditHours !== undefined ? String(body.creditHours) : existing.creditHours,
        isElective: body.isElective !== undefined ? Boolean(body.isElective) : existing.isElective,
        status: body.status !== undefined ? (body.status as never) : existing.status,
        updatedAt: new Date(),
      })
      .where(eq(subjects.id, id))
      .returning()

    await audit({
      schoolId: existing.schoolId,
      userId: user.id,
      action: 'updated',
      module: 'academics',
      entityType: 'subject',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:write', async ({ user }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1)
    if (!existing) return notFound('Subject not found')

    const [used] = await db.select({ id: timetableEntries.id }).from(timetableEntries).where(eq(timetableEntries.subjectId, id)).limit(1)
    if (used) return badRequest('This subject is used in the timetable; remove those entries first')

    await db.update(subjects).set({ status: 'deleted', updatedAt: new Date() }).where(eq(subjects.id, id))

    await audit({
      schoolId: existing.schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'academics',
      entityType: 'subject',
      entityId: id,
    })

    return deleted('Subject deleted successfully')
  })(request, context)
}
