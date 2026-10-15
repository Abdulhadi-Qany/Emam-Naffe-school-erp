import { NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { grades, sections, students } from '@/lib/db/schema'
import { badRequest, deleted, notFound, ok, withV1, audit } from '@/lib/api'

type Context = { params: Promise<{ id: string }> }

const STATUSES = ['active', 'inactive', 'suspended', 'deleted', 'graduated', 'transferred', 'dropped_out'] as const
const GENDERS = ['male', 'female', 'other'] as const

export async function GET(request: NextRequest, context: Context) {
  return withV1('students:read', async ({ schoolId }, _req, ctx: Context) => {
    const { id } = await ctx.params
    const [student] = await db
      .select()
      .from(students)
      .where(and(eq(students.id, id), eq(students.schoolId, schoolId)))
      .limit(1)
    if (!student) return notFound('Student not found')
    return ok(student)
  })(request, context)
}

export async function PUT(request: NextRequest, context: Context) {
  return withV1('students:write', async ({ user, schoolId }, req, ctx: Context) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select()
      .from(students)
      .where(and(eq(students.id, id), eq(students.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Student not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const updates: Partial<typeof students.$inferInsert> = { updatedAt: new Date() }
    const nullableTextFields = [
      'grandfatherName', 'placeOfBirth', 'bloodGroup', 'nationalId', 'photo', 'address',
      'city', 'province', 'country', 'phone', 'email', 'religion',
    ] as const
    const requiredTextFields = ['firstName', 'fatherName', 'familyName', 'nationality'] as const
    for (const field of [...requiredTextFields, ...nullableTextFields]) {
      const value = body[field]
      if (value === undefined) continue
      if (value !== null && typeof value !== 'string') return badRequest(`${field} must be a string or null`)
      if ((requiredTextFields as readonly string[]).includes(field) && (typeof value !== 'string' || value.trim() === '')) {
        return badRequest(`${field} cannot be empty`)
      }
      if (field === 'email' && typeof value === 'string' && value.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim())) {
        return badRequest('email must be a valid email address')
      }
      Object.assign(updates, { [field]: typeof value === 'string' ? value.trim() : value })
    }
    if (body.gender !== undefined) {
      if (!GENDERS.includes(body.gender as (typeof GENDERS)[number])) return badRequest('gender is invalid')
      updates.gender = body.gender as (typeof GENDERS)[number]
    }
    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status as (typeof STATUSES)[number])) return badRequest('status is invalid')
      updates.status = body.status as (typeof STATUSES)[number]
    }
    if (body.dateOfBirth !== undefined) {
      if (typeof body.dateOfBirth !== 'string') return badRequest('dateOfBirth must be a valid date in the past')
      const date = new Date(body.dateOfBirth)
      if (Number.isNaN(date.getTime()) || date.getTime() > Date.now()) return badRequest('dateOfBirth must be a valid date in the past')
      updates.dateOfBirth = date
    }
    for (const field of ['currentGradeId', 'currentSectionId'] as const) {
      const value = body[field]
      if (value !== undefined && value !== null && typeof value !== 'string') {
        return badRequest(`${field} must be a string or null`)
      }
      if (value !== undefined) updates[field] = value as string | null
    }

    const nextGradeId = updates.currentGradeId === undefined ? existing.currentGradeId : updates.currentGradeId
    const nextSectionId = updates.currentSectionId === undefined ? existing.currentSectionId : updates.currentSectionId
    if (nextGradeId) {
      const [grade] = await db.select({ id: grades.id }).from(grades).where(and(
        eq(grades.id, nextGradeId),
        eq(grades.schoolId, schoolId)
      )).limit(1)
      if (!grade) return badRequest('currentGradeId is not a grade in this school')
    }
    if (nextSectionId) {
      const [section] = await db.select({ id: sections.id, gradeId: sections.gradeId }).from(sections).where(and(
        eq(sections.id, nextSectionId),
        eq(sections.schoolId, schoolId)
      )).limit(1)
      if (!section) return badRequest('currentSectionId is not a section in this school')
      if (nextGradeId && section.gradeId !== nextGradeId) return badRequest('currentSectionId must belong to currentGradeId')
    }

    if (updates.firstName !== undefined || updates.familyName !== undefined) {
      updates.fullName = `${updates.firstName ?? existing.firstName} ${updates.familyName ?? existing.familyName}`.trim()
    }
    const [updated] = await db
      .update(students)
      .set(updates)
      .where(and(eq(students.id, id), eq(students.schoolId, schoolId)))
      .returning()

    await audit({ schoolId, userId: user.id, action: 'updated', module: 'students', entityType: 'student', entityId: id })
    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: Context) {
  return withV1('students:write', async ({ user, schoolId }, _req, ctx: Context) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select({ id: students.id, status: students.status })
      .from(students)
      .where(and(eq(students.id, id), eq(students.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Student not found')
    if (existing.status === 'deleted') return badRequest('Student is already deleted')

    await db.update(students)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(and(eq(students.id, id), eq(students.schoolId, schoolId)))

    await audit({ schoolId, userId: user.id, action: 'deleted', module: 'students', entityType: 'student', entityId: id })
    return deleted('Student removed successfully')
  })(request, context)
}
