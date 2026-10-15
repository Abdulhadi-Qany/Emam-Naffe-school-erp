import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { staff, departments } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit } from '@/lib/api'

/**
 * GET    /api/staff/[id]
 * PUT    /api/staff/[id]
 * DELETE /api/staff/[id]  (soft delete via `status = 'deleted'`)
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('staff:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [row] = await db
      .select({
        id: staff.id,
        schoolId: staff.schoolId,
        staffId: staff.staffId,
        employeeCode: staff.employeeCode,
        firstName: staff.firstName,
        fatherName: staff.fatherName,
        grandfatherName: staff.grandfatherName,
        familyName: staff.familyName,
        fullName: staff.fullName,
        dateOfBirth: staff.dateOfBirth,
        gender: staff.gender,
        bloodGroup: staff.bloodGroup,
        nationality: staff.nationality,
        nationalId: staff.nationalId,
        photo: staff.photo,
        phone: staff.phone,
        email: staff.email,
        address: staff.address,
        city: staff.city,
        province: staff.province,
        departmentId: departments.id,
        departmentName: departments.name,
        departmentNameDari: departments.nameDari,
        departmentNamePashto: departments.namePashto,
        designation: staff.designation,
        employmentType: staff.employmentType,
        employmentStatus: staff.status,
        joinDate: staff.joinDate,
        endDate: staff.endDate,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
      })
      .from(staff)
      .leftJoin(departments, eq(staff.departmentId, departments.id))
      .where(and(eq(staff.id, id), eq(staff.schoolId, schoolId)))
      .limit(1)

    if (!row) return notFound('Staff member not found')
    return ok(row)
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('staff:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select()
      .from(staff)
      .where(and(eq(staff.id, id), eq(staff.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Staff member not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['firstName', 'fatherName', 'familyName', 'grandfatherName', 'bloodGroup', 'nationality', 'nationalId', 'photo', 'phone', 'email', 'address', 'city', 'province', 'designation'] as const) {
      if (body[field] !== undefined && body[field] !== null && typeof body[field] !== 'string') {
        return badRequest(`${field} must be a string or null`)
      }
    }
    for (const field of ['dateOfBirth', 'joinDate', 'endDate'] as const) {
      if (body[field] !== undefined && body[field] !== null && body[field] !== '' && Number.isNaN(new Date(String(body[field])).getTime())) {
        return badRequest(`${field} must be a valid date`)
      }
    }
    if (body.gender !== undefined && !['male', 'female', 'other'].includes(String(body.gender))) {
      return badRequest('gender must be male, female, or other')
    }
    if (body.employmentType !== undefined && !['full_time', 'part_time', 'contract', 'temporary'].includes(String(body.employmentType))) {
      return badRequest('employmentType must be full_time, part_time, contract, or temporary')
    }
    if (body.status !== undefined && !['active', 'inactive', 'suspended', 'deleted', 'graduated', 'transferred', 'dropped_out'].includes(String(body.status))) {
      return badRequest('status is not valid')
    }
    if (body.departmentId !== undefined && body.departmentId !== null) {
      const [department] = await db.select({ id: departments.id }).from(departments)
        .where(and(eq(departments.id, String(body.departmentId)), eq(departments.schoolId, schoolId))).limit(1)
      if (!department) return badRequest('departmentId must belong to this school')
    }

    const nextFirstName =
      typeof body.firstName === 'string' && body.firstName.trim() !== '' ? body.firstName.trim() : existing.firstName
    const nextFamilyName =
      typeof body.familyName === 'string' && body.familyName.trim() !== '' ? body.familyName.trim() : existing.familyName

    const [updated] = (await db
      .update(staff)
      .set({
        firstName: nextFirstName,
        fatherName: typeof body.fatherName === 'string' && body.fatherName.trim() !== '' ? body.fatherName.trim() : existing.fatherName,
        familyName: nextFamilyName,
        grandfatherName: body.grandfatherName !== undefined ? (body.grandfatherName as string | null) : existing.grandfatherName,
        dateOfBirth: body.dateOfBirth !== undefined ? (body.dateOfBirth ? new Date(body.dateOfBirth as string) : null) : existing.dateOfBirth,
        gender: body.gender !== undefined ? (body.gender as never) : existing.gender,
        bloodGroup: body.bloodGroup !== undefined ? (body.bloodGroup as string | null) : existing.bloodGroup,
        nationality: body.nationality !== undefined && body.nationality !== null ? (body.nationality as string) : existing.nationality,
        nationalId: body.nationalId !== undefined ? (body.nationalId as string | null) : existing.nationalId,
        photo: body.photo !== undefined ? (body.photo as string | null) : existing.photo,
        phone: body.phone !== undefined ? (body.phone as string | null) : existing.phone,
        email: body.email !== undefined ? (body.email as string | null) : existing.email,
        address: body.address !== undefined ? (body.address as string | null) : existing.address,
        city: body.city !== undefined ? (body.city as string | null) : existing.city,
        province: body.province !== undefined ? (body.province as string | null) : existing.province,
        departmentId: body.departmentId !== undefined ? (body.departmentId as string | null) : existing.departmentId,
        designation: body.designation !== undefined ? (body.designation as string | null) : existing.designation,
        employmentType: body.employmentType !== undefined ? (body.employmentType as never) : existing.employmentType,
        status: body.status !== undefined ? (body.status as never) : existing.status,
        joinDate: body.joinDate !== undefined ? new Date(body.joinDate as string) : existing.joinDate,
        endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate as string) : null) : existing.endDate,
        fullName: `${nextFirstName} ${nextFamilyName}`,
        updatedAt: new Date(),
      })
      .where(and(eq(staff.id, id), eq(staff.schoolId, schoolId)))
      .returning()) as unknown as (typeof staff.$inferSelect)[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'staff',
      entityType: 'staff',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('staff:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select({ id: staff.id })
      .from(staff)
      .where(and(eq(staff.id, id), eq(staff.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Staff member not found')

    await db.update(staff).set({ status: 'deleted', updatedAt: new Date() }).where(and(eq(staff.id, id), eq(staff.schoolId, schoolId)))

    await audit({
      schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'staff',
      entityType: 'staff',
      entityId: id,
    })

    return deleted('Staff member removed successfully')
  })(request, context)
}
