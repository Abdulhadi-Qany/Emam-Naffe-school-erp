import { db } from '@/lib/db'
import { inventoryItems, inventoryStockMovements } from '@/lib/db/schema'
import { and, desc, eq, ilike, or, sql, count } from 'drizzle-orm'
import { paged, created, ok, badRequest, notFound, withV1, audit, parsePagination, parseFilters, num, money, round, prefixedNumber } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Inventory items (consumables and equipment stock).
 * GET  /api/inventory/items?category&status&query → items with derived stock status
 * POST /api/inventory/items { name, unit, unitCost, quantity?, minLevel?, category?, supplier?, location? }
 */
export async function GET(request: NextRequest) {
  return withV1('inventory:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['category', 'status', 'location', 'supplier'])
    const query = searchParams.get('query')

    const conditions = [eq(inventoryItems.schoolId, schoolId)]
    if (filters.category) conditions.push(eq(inventoryItems.category, filters.category))
    if (filters.status) conditions.push(eq(inventoryItems.status, filters.status))
    if (filters.location) conditions.push(eq(inventoryItems.location, filters.location))
    if (filters.supplier) conditions.push(eq(inventoryItems.supplier, filters.supplier))
    if (query) {
      const q = `%${query}%`
      conditions.push(or(ilike(inventoryItems.name, q), ilike(inventoryItems.sku, q), ilike(inventoryItems.supplier, q), ilike(inventoryItems.location, q))!)
    }

    const [totalResult] = await db.select({ count: count() }).from(inventoryItems).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select({
        item: inventoryItems,
        lastRestockedAt: sql<string | null>`(
          select max(${inventoryStockMovements.movementDate}) from ${inventoryStockMovements}
          where ${inventoryStockMovements.itemId} = ${inventoryItems.id}
        )`,
      })
      .from(inventoryItems)
      .where(and(...conditions))
      .orderBy(sql`${inventoryItems.name} asc`)
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ item, lastRestockedAt }) => {
        const onHand = num(item.onHand)
        const minLevel = num(item.minLevel)
        return {
          ...item,
          onHand,
          minLevel,
          unitCostValue: num(item.unitCost),
          totalValue: round(onHand * num(item.unitCost)),
          stockStatus: onHand <= 0 ? 'out_of_stock' : onHand < minLevel ? 'low_stock' : 'in_stock',
          lastRestocked: lastRestockedAt ?? (item.lastRestocked ? item.lastRestocked.toISOString().slice(0, 10) : null),
        }
      }),
      pagination,
      total
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('inventory:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    if (typeof body.name !== 'string' || body.name.trim() === '') return badRequest('name is required')
    if (typeof body.unit !== 'string' || body.unit.trim() === '') return badRequest('unit is required')
    const name = body.name.trim()
    const unit = body.unit.trim()

    const quantity = body.quantity !== undefined ? Number(body.quantity) : 0
    if (!Number.isFinite(quantity) || quantity < 0) return badRequest('quantity must be a non-negative number')

    const unitCost = body.unitCost !== undefined ? Number(body.unitCost) : 0
    if (!Number.isFinite(unitCost) || unitCost < 0) return badRequest('unitCost must be a non-negative number')
    const minLevel = body.minLevel !== undefined ? Number(body.minLevel) : 0
    if (!Number.isFinite(minLevel) || minLevel < 0) return badRequest('minLevel must be a non-negative number')
    if (body.sku !== undefined && (typeof body.sku !== 'string' || body.sku.trim() === '')) return badRequest('sku must be a non-empty string')
    for (const field of ['category', 'supplier', 'location', 'reference'] as const) {
      if (body[field] !== undefined && body[field] !== null && typeof body[field] !== 'string') {
        return badRequest(`${field} must be a string or null`)
      }
    }

    const sku = typeof body.sku === 'string'
      ? body.sku.trim()
      : await prefixedNumber('ITM', schoolId, undefined, { padTo: 4, scopedPerYear: false })

    const [duplicate] = await db
      .select({ id: inventoryItems.id })
      .from(inventoryItems)
      .where(and(eq(inventoryItems.schoolId, schoolId), eq(inventoryItems.sku, sku)))
      .limit(1)
    if (duplicate) return badRequest('An item with this SKU already exists')

    const result = await db.transaction(async (tx) => {
      const [item] = (await tx
        .insert(inventoryItems)
        .values({
          id: crypto.randomUUID(),
          schoolId,
          sku,
          name,
          category: typeof body.category === 'string' ? body.category.trim() || null : null,
          supplier: typeof body.supplier === 'string' ? body.supplier.trim() || null : null,
          onHand: money(quantity),
          minLevel: money(minLevel),
          unit,
          unitCost: money(unitCost),
          location: typeof body.location === 'string' ? body.location.trim() || null : null,
          lastRestocked: quantity > 0 ? new Date() : null,
          status: quantity > 0 ? 'in_stock' : 'out_of_stock',
        })
        .returning()) as unknown as Record<string, unknown>[]

      if (quantity > 0) {
        await tx.insert(inventoryStockMovements).values({
          id: crypto.randomUUID(),
          schoolId,
          itemId: item.id as string,
          movementType: 'purchase',
          quantity: money(quantity),
          unitCost: money(unitCost),
          reference: typeof body.reference === 'string' ? body.reference : null,
          vendor: typeof body.supplier === 'string' ? body.supplier.trim() || null : null,
          remarks: 'Opening stock',
          recordedBy: user.id,
        } as never)
      }

      return item
    })

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'inventory',
      entityType: 'inventory_item',
      entityId: result.id as string,
      changes: { sku, quantity, unitCost },
    })

    return created(result)
  })(request)
}
