import { db } from '@/lib/db'
import { homework, subjects, classes, staff } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('homework:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [row] = await db
      .select({
        assignment: homework,
        subjectId: subjects.id,
        subjectName: subjects.name,
        classId: classes.id,
        className: classes.name,
        teacherId: staff.id,
        teacherName: staff.fullName,
      })
      .from(homework)
      .leftJoin(subjects, eq(homework.subjectId, subjects.id))
      .leftJoin(classes, eq(homework.classId, classes.id))
      .leftJoin(staff, eq(homework.teacherId, staff.id))
      .where(and(eq(homework.id, id), eq(homework.schoolId, schoolId)))
      .limit(1)

    if (!row) return notFound('Homework not found')
    return ok({
      ...row.assignment,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      classId: row.classId,
      className: row.className,
      teacherId: row.teacherId,
      teacherName: row.teacherName,
    })
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('homework:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(homework).where(and(eq(homework.id, id), eq(homework.schoolId, schoolId))).limit(1)
    if (!existing) return notFound('Homework not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const [updated] = (await db
      .update(homework)
      .set({
        title: typeof body.title === 'string' && body.title.trim() !== '' ? body.title.trim() : existing.title,
        description: body.description !== undefined ? (body.description as string | null) : existing.description,
        dueDate: body.dueDate !== undefined ? new Date(body.dueDate as string) : existing.dueDate,
        maxMarks: body.maxMarks !== undefined ? String(body.maxMarks) : existing.maxMarks,
        status: body.status !== undefined ? (body.status as string) : existing.status,
        updatedAt: new Date(),
      })
      .where(eq(homework.id, id))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'academics',
      entityType: 'homework',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('homework:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(homework).where(and(eq(homework.id, id), eq(homework.schoolId, schoolId))).limit(1)
    if (!existing) return notFound('Homework not found')

    await db.delete(homework).where(eq(homework.id, id))

    await audit({
      schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'academics',
      entityType: 'homework',
      entityId: id,
    })

    return deleted('Homework deleted successfully')
  })(request, context)
}
