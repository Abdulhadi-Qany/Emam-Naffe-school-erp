import { db } from '@/lib/db'
import { goodsReceiptItems, goodsReceipts, purchaseOrders } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, notFound, withV1, audit, parsePagination, parseFilters, afghanAcademicYear } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withV1('inventory:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['purchaseOrderId', 'status'])
    const query = searchParams.get('query')

    const conditions = [eq(goodsReceipts.schoolId, schoolId)]
    if (filters.purchaseOrderId) conditions.push(eq(goodsReceipts.purchaseOrderId, filters.purchaseOrderId))
    if (filters.status) conditions.push(eq(goodsReceipts.status, filters.status))
    if (query) conditions.push(sql`${goodsReceipts.referenceNumber} ilike ${'%' + query + '%'}`)

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(goodsReceipts).where(and(...conditions))
    const rows = await db.select().from(goodsReceipts).where(and(...conditions)).orderBy(desc(goodsReceipts.receivedAt)).limit(pagination.limit).offset(pagination.offset)

    return paged(rows, pagination, total)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('inventory:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['purchaseOrderId', 'items']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const [po] = await db.select().from(purchaseOrders).where(and(eq(purchaseOrders.id, body.purchaseOrderId as string), eq(purchaseOrders.schoolId, schoolId))).limit(1)
    if (!po) return notFound('Purchase order not found')

    const items = body.items as { productId: string; receivedQuantity: number; condition?: string }[]
    if (!Array.isArray(items) || items.length === 0) return badRequest('items must be a non-empty array')

    const result = await db.transaction(async (tx) => {
      const [gr] = (await tx
        .insert(goodsReceipts)
        .values({
          id: crypto.randomUUID(),
          schoolId,
          purchaseOrderId: body.purchaseOrderId as string,
          referenceNumber: `GR-${afghanAcademicYear(new Date())}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
          receivedAt: new Date(),
          receivedBy: user.id,
          status: 'completed',
        })
        .returning()) as unknown as Record<string, unknown>[]

      for (const item of items) {
        await tx.insert(goodsReceiptItems).values({
          id: crypto.randomUUID(),
          goodsReceiptId: gr.id,
          productId: item.productId,
          receivedQuantity: item.receivedQuantity,
          condition: item.condition ?? 'good',
        } as never)
      }
      return gr
    })

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'inventory',
      entityType: 'goods_receipt',
      entityId: result.id as string,
    })

    return created(result)
  })(request)
}