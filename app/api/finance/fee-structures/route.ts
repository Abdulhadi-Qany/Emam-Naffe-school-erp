import { db } from '@/lib/db'
import { feeStructures, grades, sections } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { paged, created, ok, deleted, badRequest, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Fee structures.
 * GET   /api/finance/fee-structures?status&gradeId&query → joined display rows
 * POST  /api/finance/fee-structures
 * GET   /api/finance/fee-structures/[id]
 * PUT   /api/finance/fee-structures/[id]
 * DELETE /api/finance/fee-structures/[id] (archives)
 */
export async function GET(request: NextRequest) {
  return withV1('fees:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['gradeId', 'frequency', 'isActive'])
    const query = searchParams.get('query')

    const conditions = [eq(feeStructures.schoolId, schoolId)]
    if (filters.gradeId) conditions.push(eq(feeStructures.gradeId, filters.gradeId))
    if (filters.frequency) conditions.push(eq(feeStructures.frequency, filters.frequency))
    if (filters.isActive === 'true') conditions.push(eq(feeStructures.isActive, true))
    if (filters.isActive === 'false') conditions.push(eq(feeStructures.isActive, false))
    if (query) {
      const q = `%${query}%`
      conditions.push(sql`(${feeStructures.name} ilike ${q} or ${feeStructures.feeType} ilike ${q} or ${feeStructures.description} ilike ${q})`)
    }

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(feeStructures).where(and(...conditions))
    const totalCount = total?.count ?? 0

    const rows = await db
      .select({
        structure: feeStructures,
        gradeLevel: grades.level,
        gradeName: grades.name,
      })
      .from(feeStructures)
      .leftJoin(grades, and(eq(feeStructures.gradeId, grades.id), eq(grades.schoolId, schoolId)))
      .where(and(...conditions))
      .orderBy(sql`${feeStructures.effectiveFrom} desc`)
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ structure, gradeLevel, gradeName }) => ({
        ...structure,
        amountValue: Number(structure.amount ?? 0),
        gradeLevel,
        gradeName,
      })),
      pagination,
      totalCount
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('fees:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['name', 'feeType', 'amount']) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return badRequest(`${field} is required`)
      }
    }
    if (typeof body.name !== 'string' || !body.name.trim()) return badRequest('name must be a non-empty string')
    if (typeof body.feeType !== 'string' || !body.feeType.trim()) return badRequest('feeType must be a non-empty string')

    const amountValue = Number(body.amount)
    if (!Number.isFinite(amountValue) || amountValue < 0) return badRequest('amount must be a non-negative number')

    const frequency = body.frequency === undefined ? 'monthly' : body.frequency
    if (typeof frequency !== 'string' || !frequency.trim()) return badRequest('frequency must be a non-empty string')
    const dueDate = body.dueDate === undefined ? 10 : Number(body.dueDate)
    if (!Number.isInteger(dueDate) || dueDate < 1 || dueDate > 31) return badRequest('dueDate must be a day of the month from 1 to 31')
    const lateFeeAmount = body.lateFeeAmount === undefined ? 0 : Number(body.lateFeeAmount)
    if (!Number.isFinite(lateFeeAmount) || lateFeeAmount < 0) return badRequest('lateFeeAmount must be a non-negative number')
    const lateFeeType = body.lateFeeType === undefined ? 'fixed' : body.lateFeeType
    if (lateFeeType !== 'fixed' && lateFeeType !== 'percentage') return badRequest('lateFeeType must be fixed or percentage')
    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') return badRequest('isActive must be a boolean')
    const effectiveTo = body.effectiveTo === undefined || body.effectiveTo === null
      ? null
      : typeof body.effectiveTo === 'string' ? new Date(body.effectiveTo) : new Date(Number.NaN)
    if (effectiveTo && Number.isNaN(effectiveTo.getTime())) return badRequest('effectiveTo must be a valid date')

    const gradeId = typeof body.gradeId === 'string' ? body.gradeId : null
    const sectionId = typeof body.sectionId === 'string' ? body.sectionId : null
    if (body.gradeId !== undefined && body.gradeId !== null && gradeId === null) return badRequest('gradeId must be a string')
    if (body.sectionId !== undefined && body.sectionId !== null && sectionId === null) return badRequest('sectionId must be a string')
    if (sectionId && !gradeId) return badRequest('gradeId is required when sectionId is provided')

    if (gradeId) {
      const [grade] = await db.select({ id: grades.id }).from(grades)
        .where(and(eq(grades.id, gradeId), eq(grades.schoolId, schoolId)))
        .limit(1)
      if (!grade) return badRequest('gradeId must belong to the current school')
    }
    if (sectionId) {
      const [section] = await db.select({ id: sections.id }).from(sections)
        .where(and(
          eq(sections.id, sectionId),
          eq(sections.schoolId, schoolId),
          gradeId ? eq(sections.gradeId, gradeId) : undefined
        ))
        .limit(1)
      if (!section) return badRequest('sectionId must belong to the selected school and grade')
    }

    const [duplicate] = await db
      .select({ id: feeStructures.id })
      .from(feeStructures)
      .where(sql`${feeStructures.schoolId} = ${schoolId} and ${feeStructures.name} = ${String(body.name).trim()} and ${feeStructures.feeType} = ${String(body.feeType)}`)
      .limit(1)
    if (duplicate) return badRequest('A fee structure with this name and type already exists')

    const [createdRow] = (await db
      .insert(feeStructures)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        name: body.name.trim(),
        feeType: body.feeType.trim(),
        amount: amountValue.toFixed(2),
        frequency,
        gradeId,
        sectionId,
        dueDate,
        lateFeeAmount: lateFeeAmount.toFixed(2),
        lateFeeType,
        description: (body.description as string) ?? null,
        isActive: body.isActive !== false,
        effectiveTo,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'finance',
      entityType: 'fee_structure',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}
