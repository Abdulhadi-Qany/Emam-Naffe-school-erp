import { db } from '@/lib/db'
import { admissionApplications, students, grades, sections, admissionOffers } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { created, badRequest, notFound, unprocessable, withV1, audit, admissionNumber } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * POST /api/admissions/[id]/convert
 * → converts an approved application into an enrolled student
 *   (admission number from the sequence, offer closed, timeline entry).
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('admissions:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [application] = await db
      .select()
      .from(admissionApplications)
      .where(and(eq(admissionApplications.id, id), eq(admissionApplications.schoolId, schoolId)))
      .limit(1)
    if (!application) return notFound('Application not found')

    if (application.status !== 'approved') {
      return unprocessable(`Only approved applications can be converted (current: ${application.status})`, 'INVALID_STATE')
    }

    if (!application.applyingForGradeId) {
      return badRequest('The application has no applying-for grade')
    }

    const [grade] = await db.select().from(grades).where(eq(grades.id, application.applyingForGradeId)).limit(1)
    if (!grade) return badRequest('The applying-for grade no longer exists')

    const [section] = await db
      .select()
      .from(sections)
      .where(and(eq(sections.gradeId, grade.id), sql`${sections.status} <> 'deleted'`))
      .orderBy(sql`${sections.name} asc`)
      .limit(1)
    if (!section) return badRequest('No section exists for the applying-for grade')

    const admissionNumberValue = await admissionNumber(schoolId, grade.level)

    const studentId = crypto.randomUUID()
    await db.transaction(async (tx) => {
      await tx.insert(students).values({
        id: studentId,
        schoolId,
        studentId: admissionNumberValue,
        admissionNumber: admissionNumberValue,
        registrationNumber: application.applicationNumber,
        firstName: application.firstName,
        fatherName: application.fatherName,
        grandfatherName: application.grandfatherName,
        familyName: application.familyName,
        fullName: `${application.firstName} ${application.familyName}`,
        dateOfBirth: application.dateOfBirth,
        gender: application.gender,
        currentGradeId: grade.id,
        currentSectionId: section.id,
        enrollmentDate: new Date(),
        status: 'active',
      } as never)

      await tx
        .update(admissionApplications)
        .set({ status: 'enrolled', reviewedBy: user.id, reviewedAt: new Date(), updatedAt: new Date() })
        .where(eq(admissionApplications.id, id))

      await tx
        .update(admissionOffers)
        .set({ status: 'admitted', admittedAt: new Date(), studentId, updatedAt: new Date() })
        .where(and(eq(admissionOffers.applicationId, id), sql`${admissionOffers.status} = 'issued'`))
    })

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'admissions',
      entityType: 'student_conversion',
      entityId: id,
      changes: { admissionNumber: admissionNumberValue, studentId },
    })

    return created({ studentId, admissionNumber: admissionNumberValue, applicationId: id })
  })(request)
}
