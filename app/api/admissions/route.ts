import { db } from '@/lib/db'
import { admissionApplications, grades, users, userProfiles } from '@/lib/db/schema'
import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { paged, created, badRequest, conflict, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

const STAGES = ['submitted', 'document_verification', 'assessment', 'interview', 'approved', 'waitlisted', 'rejected', 'enrolled'] as const

/**
 * Admissions pipeline.
 * GET  /api/admissions?status&gradeId&query ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ joined pipeline rows
 * POST /api/admissions { firstName, fatherName, familyName, applyingForGradeId, dateOfBirth?, gender? }
 *      ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ creates an application with a sequence-generated application number
 */
export async function GET(request: NextRequest) {
  return withV1('admissions:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['status', 'applyingForGradeId'])
    const query = searchParams.get('query')

    const conditions = [eq(admissionApplications.schoolId, schoolId)]
    if (filters.status) conditions.push(eq(admissionApplications.status, filters.status))
    if (filters.applyingForGradeId) conditions.push(eq(admissionApplications.applyingForGradeId, filters.applyingForGradeId))
    if (query) {
      const q = `%${query}%`
      conditions.push(
        or(
          ilike(admissionApplications.firstName, q),
          ilike(admissionApplications.familyName, q),
          ilike(admissionApplications.applicationNumber, q)
        )!
      )
    }

    const [totalResult] = await db.select({ count: count() }).from(admissionApplications).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select({
        application: admissionApplications,
        gradeLevel: grades.level,
        gradeName: grades.name,
        reviewedByName: userProfiles.fullName,
      })
      .from(admissionApplications)
      .leftJoin(grades, and(
        eq(admissionApplications.applyingForGradeId, grades.id),
        eq(grades.schoolId, schoolId)
      ))
      .leftJoin(users, eq(admissionApplications.reviewedBy, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(and(...conditions))
      .orderBy(desc(admissionApplications.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ application, gradeLevel, gradeName, reviewedByName }) => ({
        ...application,
        fullName: `${application.firstName} ${application.familyName}`,
        gradeNumber: gradeLevel !== null ? String(gradeLevel) : null,
        gradeName,
        reviewedByName,
        dateLabel: application.createdAt ? application.createdAt.toISOString().slice(0, 10) : null,
      })),
      pagination,
      total
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('admissions:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['firstName', 'fatherName', 'familyName', 'applyingForGradeId', 'dateOfBirth']) {
      if (typeof body[field] !== 'string' || !body[field].trim()) return badRequest(`${field} is required`)
    }
    if (body.gender !== undefined && !['male', 'female', 'other'].includes(body.gender as string)) {
      return badRequest('gender must be male, female, or other')
    }
    for (const field of ['grandfatherName', 'previousSchool']) {
      if (body[field] !== undefined && body[field] !== null && typeof body[field] !== 'string') {
        return badRequest(`${field} must be a string`)
      }
    }

    const dateOfBirth = new Date(body.dateOfBirth as string)
    if (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth.getTime() >= Date.now()) {
      return badRequest('dateOfBirth must be a valid date in the past')
    }
    const [grade] = await db.select({ id: grades.id }).from(grades)
      .where(and(
        eq(grades.id, body.applyingForGradeId as string),
        eq(grades.schoolId, schoolId)
      ))
      .limit(1)
    if (!grade) return badRequest('applyingForGradeId must belong to the current school')

    const applicationNumber = `APP-1403-${crypto.randomUUID().slice(0, 6).toUpperCase()}`

    const [duplicate] = await db
      .select({ id: admissionApplications.id })
      .from(admissionApplications)
      .where(eq(admissionApplications.applicationNumber, applicationNumber))
      .limit(1)
    if (duplicate) return conflict('Application number already exists')

    const [createdRow] = (await db
      .insert(admissionApplications)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        applicationNumber,
        firstName: (body.firstName as string).trim(),
        fatherName: (body.fatherName as string).trim(),
        grandfatherName: (body.grandfatherName as string | null) ?? null,
        familyName: (body.familyName as string).trim(),
        dateOfBirth,
        gender: (body.gender as never) ?? 'male',
        applyingForGradeId: body.applyingForGradeId as string,
        previousSchool: (body.previousSchool as string | null) ?? null,
        status: 'submitted',
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'admissions',
      entityType: 'admission_application',
      entityId: createdRow.id as string,
      changes: { applicationNumber },
    })

    return created(createdRow)
  })(request)
}
