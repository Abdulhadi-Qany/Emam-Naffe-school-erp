import { db } from '@/lib/db'
import { admissionApplications, grades, interviews } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, unprocessable, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

const STAGES = ['submitted', 'document_verification', 'assessment', 'interview', 'approved', 'waitlisted', 'rejected', 'enrolled'] as const

/** Transitions that may only move forward. */
const ORDER: Record<string, number> = {
  submitted: 0,
  document_verification: 1,
  assessment: 2,
  interview: 3,
  approved: 4,
  enrolled: 5,
  waitlisted: 6,
  rejected: 7,
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('admissions:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [row] = await db
      .select({
        application: admissionApplications,
        gradeLevel: grades.level,
        gradeName: grades.name,
      })
      .from(admissionApplications)
      .leftJoin(grades, eq(admissionApplications.applyingForGradeId, grades.id))
      .where(and(eq(admissionApplications.id, id), eq(admissionApplications.schoolId, schoolId)))
      .limit(1)
    if (!row) return notFound('Application not found')

    const interviewRows = await db
      .select()
      .from(interviews)
      .where(eq(interviews.applicationId, id))
      .orderBy(desc(interviews.interviewDate))

    return ok({
      ...row.application,
      fullName: `${row.application.firstName} ${row.application.familyName}`,
      gradeNumber: row.gradeLevel !== null ? String(row.gradeLevel) : null,
      gradeName: row.gradeName,
      interviews: interviewRows,
    })
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('admissions:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select()
      .from(admissionApplications)
      .where(and(eq(admissionApplications.id, id), eq(admissionApplications.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Application not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    if (body.status !== undefined && !STAGES.includes(body.status as (typeof STAGES)[number])) {
      return badRequest(`status must be one of: ${STAGES.join(', ')}`)
    }

    const [updated] = (await db
      .update(admissionApplications)
      .set({
        firstName: typeof body.firstName === 'string' && body.firstName.trim() !== '' ? body.firstName.trim() : existing.firstName,
        fatherName: typeof body.fatherName === 'string' && body.fatherName.trim() !== '' ? body.fatherName.trim() : existing.fatherName,
        familyName: typeof body.familyName === 'string' && body.familyName.trim() !== '' ? body.familyName.trim() : existing.familyName,
        grandfatherName: body.grandfatherName !== undefined ? (body.grandfatherName as string | null) : existing.grandfatherName,
        applyingForGradeId: typeof body.applyingForGradeId === 'string' && body.applyingForGradeId !== '' ? body.applyingForGradeId : existing.applyingForGradeId,
        previousSchool: body.previousSchool !== undefined ? (body.previousSchool as string | null) : existing.previousSchool,
        status: body.status !== undefined ? (body.status as string) : existing.status,
        reviewedBy: user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(admissionApplications.id, id))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'admissions',
      entityType: 'admission_application',
      entityId: id,
      changes: { status: body.status ?? null },
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('admissions:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select()
      .from(admissionApplications)
      .where(and(eq(admissionApplications.id, id), eq(admissionApplications.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Application not found')

    await db.delete(admissionApplications).where(eq(admissionApplications.id, id))

    await audit({
      schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'admissions',
      entityType: 'admission_application',
      entityId: id,
    })

    return deleted('Application deleted successfully')
  })(request, context)
}
