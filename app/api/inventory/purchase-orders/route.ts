import { db } from '@/lib/db'
import { procurementVendors, purchaseOrders, purchaseOrderItems } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, notFound, withV1, audit, parsePagination, parseFilters, afghanAcademicYear } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withV1('inventory:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['supplierId', 'status'])
    const query = searchParams.get('query')

    const conditions = [eq(purchaseOrders.schoolId, schoolId)]
    if (filters.supplierId) conditions.push(eq(purchaseOrders.vendorId, filters.supplierId))
    if (filters.status) conditions.push(eq(purchaseOrders.status, filters.status as 'draft' | 'submitted' | 'approved' | 'received' | 'cancelled'))
    if (query) conditions.push(sql`${purchaseOrders.orderNumber} ilike ${`%${query}%`}`)

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(purchaseOrders).where(and(...conditions))
    const rows = await db.select({
      order: purchaseOrders,
      supplierName: procurementVendors.name,
    }).from(purchaseOrders)
      .leftJoin(procurementVendors, eq(purchaseOrders.vendorId, procurementVendors.id))
      .where(and(...conditions))
      .orderBy(desc(purchaseOrders.orderDate))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(rows, pagination, total)
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('inventory:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['supplierId', 'items']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const supplierId = typeof body.supplierId === 'string' ? body.supplierId : ''
    const items = body.items
    if (!supplierId) return badRequest('supplierId must be a non-empty string')
    if (!Array.isArray(items) || items.length === 0) return badRequest('items must be a non-empty array')
    if (!items.every((item) =>
      item !== null &&
      typeof item === 'object' &&
      typeof item.productId === 'string' &&
      item.productId.trim() !== '' &&
      Number.isFinite(Number(item.quantity)) &&
      Number(item.quantity) > 0 &&
      Number.isFinite(Number(item.unitCost)) &&
      Number(item.unitCost) >= 0
    )) return badRequest('each item needs a productId, positive quantity and non-negative unitCost')

    const [vendor] = await db.select({ id: procurementVendors.id })
      .from(procurementVendors)
      .where(and(eq(procurementVendors.id, supplierId), eq(procurementVendors.schoolId, schoolId)))
      .limit(1)
    if (!vendor) return notFound('Supplier not found')

    const expectedDate = body.expectedDate ? new Date(body.expectedDate as string) : null
    if (expectedDate && Number.isNaN(expectedDate.getTime())) return badRequest('expectedDate must be a valid date')

    const result = await db.transaction(async (tx) => {
      const orderId = crypto.randomUUID()
      const orderNumber = `PO-${afghanAcademicYear(new Date())}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`
      const normalizedItems = items.map((item) => ({
        productId: item.productId.trim(),
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
      }))
      const totalAmount = normalizedItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)
      const [order] = await tx.insert(purchaseOrders).values({
        id: orderId,
        schoolId,
        vendorId: vendor.id,
        orderNumber,
        totalAmount: totalAmount.toFixed(2),
        status: 'draft',
        expectedDate,
        notes: typeof body.notes === 'string' ? body.notes : null,
      }).returning()

      await tx.insert(purchaseOrderItems).values(normalizedItems.map((item) => ({
        id: crypto.randomUUID(),
        purchaseOrderId: orderId,
        description: item.productId,
        quantity: item.quantity.toString(),
        unitPrice: item.unitCost.toFixed(2),
        amount: (item.quantity * item.unitCost).toFixed(2),
      })))

      return { ...order, items: normalizedItems }
    })

    await audit({ schoolId, userId: user.id, action: 'created', module: 'inventory', entityType: 'purchase_order', entityId: result.id })

    return created(result)
  })(request)
}