import { db } from '@/lib/db'
import { inventoryItems, inventoryStockMovements } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, badRequest, unprocessable, withV1, audit, num, money, round, startOfDay } from '@/lib/api'
import type { NextRequest } from 'next/server'

const MOVEMENT_TYPES = ['purchase', 'sale', 'adjustment', 'transfer', 'return'] as const

/**
 * POST /api/inventory/items/[id]/stock
 * { movement: 'in' | 'out', quantity, unitCost?, movementType?, reference?, notes? }
 * â†’ applies a stock movement and recomputes on-hand + status.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('inventory:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.schoolId, schoolId)))
      .limit(1)
    if (!item) return badRequest('Inventory item not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const quantity = Number(body.quantity ?? 0)
    if (!Number.isFinite(quantity) || quantity <= 0) return badRequest('quantity must be greater than zero')

    const movement = body.movement as string | undefined
    if (!movement || !['in', 'out'].includes(movement)) return badRequest("movement must be 'in' or 'out'")

    const unitCost = body.unitCost !== undefined ? Number(body.unitCost) : num(item.unitCost)
    if (!Number.isFinite(unitCost) || unitCost < 0) return badRequest('unitCost must be a non-negative number')
    for (const field of ['reference', 'vendor', 'notes'] as const) {
      if (body[field] !== undefined && body[field] !== null && typeof body[field] !== 'string') {
        return badRequest(`${field} must be a string or null`)
      }
    }
    const onHand = num(item.onHand)
    const delta = movement === 'in' ? quantity : -quantity
    const nextOnHand = round(onHand + delta)

    if (nextOnHand < 0) return unprocessable('Stock out exceeds available on-hand quantity', 'INSUFFICIENT_STOCK')

    const movementType = (body.movementType as string) ?? (movement === 'in' ? 'purchase' : 'adjustment')
    if (!MOVEMENT_TYPES.includes(movementType as (typeof MOVEMENT_TYPES)[number])) {
      return badRequest(`movementType must be one of: ${MOVEMENT_TYPES.join(', ')}`)
    }

    const result = await db.transaction(async (tx) => {
      await tx.insert(inventoryStockMovements).values({
        id: crypto.randomUUID(),
        schoolId,
        itemId: id,
        movementType: movementType as never,
        quantity: money(Math.abs(delta)),
        unitCost: money(unitCost),
        reference: typeof body.reference === 'string' ? body.reference : null,
        vendor: typeof body.vendor === 'string' ? body.vendor : item.supplier,
        remarks: typeof body.notes === 'string' ? body.notes : null,
        movementDate: startOfDay(new Date()),
        recordedBy: user.id,
      } as never)

      const [updated] = (await tx
        .update(inventoryItems)
        .set({
          onHand: money(nextOnHand),
          unitCost: money(unitCost),
          lastRestocked: movement === 'in' ? new Date() : item.lastRestocked,
          status: nextOnHand <= 0 ? 'out_of_stock' : nextOnHand < num(item.minLevel) ? 'low_stock' : 'in_stock',
          updatedAt: new Date(),
        })
        .where(and(eq(inventoryItems.id, id), eq(inventoryItems.schoolId, schoolId)))
        .returning()) as unknown as Record<string, unknown>[]

      return updated
    })

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'inventory',
      entityType: 'inventory_item',
      entityId: id,
      changes: { movement, quantity, onHand: nextOnHand },
    })

    return ok(result)
  })(request, context)
}
