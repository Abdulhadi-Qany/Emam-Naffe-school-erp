import { db } from '@/lib/db'
import { staffPayrollProfiles } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { ok, paged, badRequest, notFound, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withV1('hr:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['staffId', 'payrollPeriod'])

    const conditions = [eq(staffPayrollProfiles.schoolId, schoolId)]
    if (filters.staffId) conditions.push(eq(staffPayrollProfiles.staffId, filters.staffId))
    if (filters.payrollPeriod) conditions.push(eq(staffPayrollProfiles.payrollPeriod, filters.payrollPeriod))

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(staffPayrollProfiles).where(and(...conditions))
    const rows = await db.select().from(staffPayrollProfiles).where(and(...conditions)).orderBy(desc(staffPayrollProfiles.createdAt)).limit(pagination.limit).offset(pagination.offset)

    return paged(rows, pagination, total)
  })(request)
}

export async function PUT(request: NextRequest) {
  return withV1('hr:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(staffPayrollProfiles).where(and(eq(staffPayrollProfiles.id, id), eq(staffPayrollProfiles.schoolId, schoolId))).limit(1)
    if (!existing) return notFound('Payroll profile not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const [updated] = (await db
      .update(staffPayrollProfiles)
      .set({
        basicSalary: body.basicSalary !== undefined ? String(body.basicSalary) : existing.basicSalary,
        houseAllowance: body.houseAllowance !== undefined ? String(body.houseAllowance) : existing.houseAllowance,
        transportAllowance: body.transportAllowance !== undefined ? String(body.transportAllowance) : existing.transportAllowance,
        foodAllowance: body.foodAllowance !== undefined ? String(body.foodAllowance) : existing.foodAllowance,
        taxExemption: body.taxExemption !== undefined ? String(body.taxExemption) : existing.taxExemption,
        bankAccount: body.bankAccount !== undefined ? (body.bankAccount as string | null) : existing.bankAccount,
        updatedAt: new Date(),
      })
      .where(eq(staffPayrollProfiles.id, id))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({ schoolId, userId: user.id, action: 'updated', module: 'hr', entityType: 'staff_payroll_profile', entityId: id })

    return ok(updated)
  })(request)
}

export { notFound }