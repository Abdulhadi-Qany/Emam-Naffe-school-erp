import { db } from '@/lib/db'
import { studentHealthRecords, students } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { ok, created, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Student health records (confidential).
 * GET  /api/students/[id]/health
 * POST /api/students/[id]/health { condition?, allergy?, medication?, dosage?, physicianName?, physicianPhone?, bloodGroup? }
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('students:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [student] = await db
      .select({ id: students.id, bloodGroup: students.bloodGroup })
      .from(students)
      .where(and(eq(students.id, id), eq(students.schoolId, schoolId)))
      .limit(1)
    if (!student) return notFound('Student not found')

    const records = await db
      .select()
      .from(studentHealthRecords)
      .where(eq(studentHealthRecords.studentId, id))
      .orderBy(desc(studentHealthRecords.createdAt))

    return ok({ bloodGroup: student.bloodGroup, records })
  })(request, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('students:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [student] = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.id, id), eq(students.schoolId, schoolId)))
      .limit(1)
    if (!student) return notFound('Student not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    if (body.bloodGroup) {
      await db.update(students).set({ bloodGroup: String(body.bloodGroup), updatedAt: new Date() }).where(eq(students.id, id))
    }

    const [createdRow] = (await db
      .insert(studentHealthRecords)
      .values({
        id: crypto.randomUUID(),
        studentId: id,
        condition: (body.condition as string) ?? null,
        allergy: (body.allergy as string) ?? null,
        medication: (body.medication as string) ?? null,
        dosage: (body.dosage as string) ?? null,
        physicianName: (body.physicianName as string) ?? null,
        physicianPhone: (body.physicianPhone as string) ?? null,
        notes: (body.notes as string) ?? null,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'students',
      entityType: 'student_health_record',
      entityId: createdRow.id as string,
      changes: { studentId: id },
    })

    return created(createdRow)
  })(request)
}
