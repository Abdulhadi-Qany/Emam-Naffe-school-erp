import { db } from '@/lib/db'
import { taxSettings } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, withV1, audit, parsePagination, parseFilters, num } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withV1('finance:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['taxType'])
    const query = searchParams.get('query')

    const conditions = [eq(taxSettings.schoolId, schoolId)]
    if (filters.taxType) conditions.push(eq(taxSettings.taxType, filters.taxType))
    if (query) conditions.push(sql`${taxSettings.name} ilike ${'%' + query + '%'}`)

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(taxSettings).where(and(...conditions))
    const rows = await db.select().from(taxSettings).where(and(...conditions)).orderBy(desc(taxSettings.createdAt)).limit(pagination.limit).offset(pagination.offset)

    return paged(rows, pagination, total)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('finance:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['name', 'taxType', 'taxRate']) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return badRequest(`${field} is required`)
      }
    }

    const value = num(body.taxRate)
    if (value < 0) return badRequest('taxRate must be a non-negative number')
    if (body.taxType === 'percentage' && value > 100) return badRequest('percentage taxRate must be between 0 and 100')

    const [createdRow] = (await db
      .insert(taxSettings)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        name: String(body.name).trim(),
        taxType: String(body.taxType),
        taxRate: value.toFixed(2),
        description: (body.description as string) ?? null,
        isActive: body.isActive !== false,
        effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom as string) : new Date(),
        effectiveTo: body.effectiveTo ? new Date(body.effectiveTo as string) : null,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'finance',
      entityType: 'tax_setting',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}