import { db } from '@/lib/db'
import { students, studentGuardians } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, created, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET    /api/students/[id]/guardians
 * POST   /api/students/[id]/guardians { name, relationship, phone, email, isPrimary }
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('students:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [student] = await db.select({ id: students.id }).from(students).where(and(eq(students.id, id), eq(students.schoolId, schoolId))).limit(1)
    if (!student) return notFound('Student not found')

    const guardians = await db.select().from(studentGuardians).where(eq(studentGuardians.studentId, id)).orderBy(sql`${studentGuardians.createdAt} asc`)

    return ok({ guardians })
  })(request, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('students:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [student] = await db.select({ id: students.id }).from(students).where(and(eq(students.id, id), eq(students.schoolId, schoolId))).limit(1)
    if (!student) return notFound('Student not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['name', 'relationship']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    if (body.isPrimary === true) {
      await db.update(studentGuardians).set({ isPrimary: false }).where(eq(studentGuardians.studentId, id))
    }

    const [createdRow] = (await db
      .insert(studentGuardians)
      .values({
        id: crypto.randomUUID(),
        studentId: id,
        userId: (body.userId as string) ?? null,
        name: String(body.name).trim(),
        relationship: String(body.relationship),
        mobile: (body.mobile as string) ?? null,
        phone: (body.phone as string) ?? null,
        email: (body.email as string) ?? null,
        occupation: (body.occupation as string) ?? null,
        isPrimary: body.isPrimary === true,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'students',
      entityType: 'student_guardian',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request, context)
}