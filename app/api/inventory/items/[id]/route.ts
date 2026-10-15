import { db } from '@/lib/db'
import { inventoryItems, inventoryStockMovements } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit, num, money, round, startOfDay } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET    /api/inventory/items/[id] → item + recent stock movements
 * PUT    /api/inventory/items/[id] → catalog edits (name, minLevel, cost, location)
 * POST   /api/inventory/items/[id]/stock { quantity, movementType, unitCost? } → stock in/out
 * DELETE /api/inventory/items/[id]
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('inventory:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.schoolId, schoolId)))
      .limit(1)
    if (!item) return notFound('Inventory item not found')

    const movements = await db
      .select()
      .from(inventoryStockMovements)
      .where(eq(inventoryStockMovements.itemId, id))
      .orderBy(desc(inventoryStockMovements.movementDate))
      .limit(50)

    const onHand = num(item.onHand)
    const minLevel = num(item.minLevel)

    return ok({
      ...item,
      onHand,
      minLevel,
      unitCostValue: num(item.unitCost),
      totalValue: round(onHand * num(item.unitCost)),
      stockStatus: onHand <= 0 ? 'out_of_stock' : onHand < minLevel ? 'low_stock' : 'in_stock',
      movements: movements.map((movement) => ({
        ...movement,
        quantityValue: num(movement.quantity),
        unitCostValue: num(movement.unitCost),
        dateLabel: movement.movementDate ? movement.movementDate.toISOString().slice(0, 10) : null,
      })),
    })
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('inventory:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select()
      .from(inventoryItems)
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Inventory item not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
      return badRequest('name must be a non-empty string')
    }
    if (body.unit !== undefined && (typeof body.unit !== 'string' || body.unit.trim() === '')) {
      return badRequest('unit must be a non-empty string')
    }
    for (const field of ['category', 'supplier', 'location'] as const) {
      if (body[field] !== undefined && body[field] !== null && typeof body[field] !== 'string') {
        return badRequest(`${field} must be a string or null`)
      }
    }
    for (const field of ['minLevel', 'unitCost'] as const) {
      if (body[field] === undefined) continue
      const value = Number(body[field])
      if (!Number.isFinite(value) || value < 0) return badRequest(`${field} must be a non-negative number`)
    }

    const nextMinLevel = body.minLevel !== undefined ? Number(body.minLevel) : num(existing.minLevel)
    const onHand = num(existing.onHand)
    const [updated] = (await db
      .update(inventoryItems)
      .set({
        name: typeof body.name === 'string' ? body.name.trim() : existing.name,
        category: body.category !== undefined ? (typeof body.category === 'string' ? body.category.trim() || null : null) : existing.category,
        supplier: body.supplier !== undefined ? (typeof body.supplier === 'string' ? body.supplier.trim() || null : null) : existing.supplier,
        minLevel: body.minLevel !== undefined ? money(nextMinLevel) : existing.minLevel,
        unitCost: body.unitCost !== undefined ? money(Number(body.unitCost)) : existing.unitCost,
        unit: typeof body.unit === 'string' ? body.unit.trim() : existing.unit,
        location: body.location !== undefined ? (typeof body.location === 'string' ? body.location.trim() || null : null) : existing.location,
        status: onHand <= 0 ? 'out_of_stock' : onHand < nextMinLevel ? 'low_stock' : 'in_stock',
        updatedAt: new Date(),
      })
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.schoolId, schoolId)))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'inventory',
      entityType: 'inventory_item',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('inventory:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select({ id: inventoryItems.id })
      .from(inventoryItems)
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Inventory item not found')

    await db.delete(inventoryItems).where(and(eq(inventoryItems.id, id), eq(inventoryItems.schoolId, schoolId)))

    await audit({
      schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'inventory',
      entityType: 'inventory_item',
      entityId: id,
    })

    return deleted('Inventory item deleted successfully')
  })(request, context)
}
