import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { staff, departments } from '@/lib/db/schema'
import { and, eq, ilike, or, sql, count } from 'drizzle-orm'
import {
  paged,
  created,
  parsePagination,
  parseFilters,
  parseSort,
  badRequest,
  conflict,
  withV1,
  audit,
} from '@/lib/api'
import { generateEmployeeId } from '@/lib/utils/afghanistan'
import { afghanAcademicYear } from '@/lib/api/time'
import { nextInSequence } from '@/lib/api/sequence'

const SORTABLE = ['fullName', 'designation', 'joinDate', 'createdAt'] as const

/**
 * Staff directory.
 * GET  /api/staff?departmentId&designation&status&employmentType&query&page&limit
 * POST /api/staff (creates a staff record with a sequence-generated employee code)
 */
export async function GET(request: NextRequest) {
  return withV1('staff:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['departmentId', 'designation', 'status', 'employmentType'])
    const { sortBy, sortOrder } = parseSort(searchParams, SORTABLE, 'createdAt')
    const query = searchParams.get('query')

    const conditions = [eq(staff.schoolId, schoolId)]
    if (filters.departmentId) conditions.push(eq(staff.departmentId, filters.departmentId))
    if (filters.designation) conditions.push(eq(staff.designation, filters.designation))
    if (filters.status) conditions.push(eq(staff.status, filters.status as never))
    if (filters.employmentType) conditions.push(eq(staff.employmentType, filters.employmentType as never))
    if (query) {
      const q = `%${query}%`
      conditions.push(
        or(
          ilike(staff.firstName, q),
          ilike(staff.fatherName, q),
          ilike(staff.familyName, q),
          ilike(staff.fullName, q),
          ilike(staff.employeeCode, q),
          ilike(staff.email, q),
          ilike(staff.phone, q)
        )!
      )
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(staff)
      .where(and(...conditions))
    const total = totalResult?.count ?? 0

    const sortColumn = { fullName: staff.fullName, designation: staff.designation, joinDate: staff.joinDate, createdAt: staff.createdAt }[sortBy]

    const rows = await db
      .select({
        ...staffColumns(),
        departmentId: departments.id,
        departmentName: departments.name,
        departmentNameDari: departments.nameDari,
        departmentNamePashto: departments.namePashto,
      })
      .from(staff)
      .leftJoin(departments, eq(staff.departmentId, departments.id))
      .where(and(...conditions))
      .orderBy(sortOrder === 'asc' ? sql`${sortColumn} asc` : sql`${sortColumn} desc`)
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map((row) => ({
        ...row,
        designationKey: row.designation,
        departmentKey: row.departmentId,
      })),
      pagination,
      total
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('staff:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['firstName', 'fatherName', 'familyName'] as const) {
      if (typeof body[field] !== 'string' || body[field].trim() === '') return badRequest(`${field} is required`)
    }
    if (!['male', 'female', 'other'].includes(String(body.gender))) return badRequest('gender must be male, female, or other')
    if (!['full_time', 'part_time', 'contract', 'temporary'].includes(String(body.employmentType))) {
      return badRequest('employmentType must be full_time, part_time, contract, or temporary')
    }
    const joinDate = new Date(String(body.joinDate ?? ''))
    if (Number.isNaN(joinDate.getTime())) return badRequest('joinDate must be a valid date')
    for (const field of ['grandfatherName', 'bloodGroup', 'nationality', 'nationalId', 'photo', 'phone', 'email', 'address', 'city', 'province', 'designation'] as const) {
      if (body[field] !== undefined && body[field] !== null && typeof body[field] !== 'string') {
        return badRequest(`${field} must be a string or null`)
      }
    }
    if (body.departmentId !== undefined && body.departmentId !== null) {
      const [department] = await db.select({ id: departments.id }).from(departments)
        .where(and(eq(departments.id, String(body.departmentId)), eq(departments.schoolId, schoolId))).limit(1)
      if (!department) return badRequest('departmentId must belong to this school')
    }
    if (body.dateOfBirth !== undefined && body.dateOfBirth !== null && Number.isNaN(new Date(String(body.dateOfBirth)).getTime())) {
      return badRequest('dateOfBirth must be a valid date')
    }

    const academicYear = afghanAcademicYear(new Date())
    const sequence = await nextInSequence(`employee-${academicYear}`, schoolId)
    const employeeCode = generateEmployeeId(academicYear, sequence)

    const [existing] = await db.select({ id: staff.id }).from(staff).where(eq(staff.employeeCode, employeeCode)).limit(1)
    if (existing) return conflict('Employee code already exists')

    const [newStaff] = (await db
      .insert(staff)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        staffId: `STAFF-${Date.now()}`,
        employeeCode,
        firstName: (body.firstName as string).trim(),
        fatherName: (body.fatherName as string).trim(),
        grandfatherName: (body.grandfatherName as string) ?? null,
        familyName: (body.familyName as string).trim(),
        fullName: `${(body.firstName as string).trim()} ${(body.familyName as string).trim()}`,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth as string) : null,
        gender: body.gender as never,
        bloodGroup: (body.bloodGroup as string) ?? null,
        nationality: (body.nationality as string) ?? 'Afghan',
        nationalId: (body.nationalId as string) ?? null,
        photo: (body.photo as string) ?? null,
        phone: (body.phone as string) ?? null,
        email: (body.email as string) ?? null,
        address: (body.address as string) ?? null,
        city: (body.city as string) ?? null,
        province: (body.province as string) ?? null,
        departmentId: (body.departmentId as string) ?? null,
        designation: (body.designation as string) ?? null,
        employmentType: body.employmentType as never,
        joinDate,
        endDate: body.endDate ? new Date(body.endDate as string) : null,
        status: 'active',
      })
      .returning()) as unknown as (typeof staff.$inferSelect)[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'staff',
      entityType: 'staff',
      entityId: newStaff.id,
    })

    return created(newStaff)
  })(request)
}

function staffColumns() {
  return {
    id: staff.id,
    schoolId: staff.schoolId,
    staffId: staff.staffId,
    employeeCode: staff.employeeCode,
    firstName: staff.firstName,
    fatherName: staff.fatherName,
    familyName: staff.familyName,
    fullName: staff.fullName,
    designation: staff.designation,
    employmentType: staff.employmentType,
    employmentStatus: staff.status,
    joinDate: staff.joinDate,
    endDate: staff.endDate,
    phone: staff.phone,
    email: staff.email,
    photo: staff.photo,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
  }
}
