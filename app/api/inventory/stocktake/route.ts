import { db } from '@/lib/db'
import { stocktakes } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, notFound, withV1, audit, parsePagination, parseFilters, afghanAcademicYear } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withV1('inventory:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['status', 'locationId'])
    const query = searchParams.get('query')

    const conditions = [eq(stocktakes.schoolId, schoolId)]
    if (filters.status) conditions.push(eq(stocktakes.status, filters.status))
    if (filters.locationId) conditions.push(eq(stocktakes.locationId, filters.locationId))
    if (query) conditions.push(sql`${stocktakes.referenceNumber} ilike ${'%' + query + '%'}`)

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(stocktakes).where(and(...conditions))
    const rows = await db.select().from(stocktakes).where(and(...conditions)).orderBy(desc(stocktakes.createdAt)).limit(pagination.limit).offset(pagination.offset)

    return paged(rows, pagination, total)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('inventory:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['locationId', 'items']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const items = body.items
    if (!Array.isArray(items) || items.length === 0) return badRequest('items must be a non-empty array')
    if (!items.every((item) =>
      item !== null &&
      typeof item === 'object' &&
      typeof item.productId === 'string' &&
      item.productId.trim() !== '' &&
      Number.isFinite(Number(item.countedQuantity)) &&
      Number(item.countedQuantity) >= 0
    )) return badRequest('each item needs a productId and non-negative countedQuantity')

    const [createdRow] = (await db
      .insert(stocktakes)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        locationId: body.locationId as string,
        referenceNumber: `STK-${afghanAcademicYear(new Date())}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        items,
        status: 'in_progress',
        startedAt: new Date(),
        createdBy: user.id,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({ schoolId, userId: user.id, action: 'created', module: 'inventory', entityType: 'stocktake', entityId: createdRow.id as string })

    return created(createdRow)
  })(request)
}