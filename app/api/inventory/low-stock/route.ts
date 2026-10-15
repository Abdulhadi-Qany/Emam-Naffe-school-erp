import { db } from '@/lib/db'
import { inventoryItems } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, withV1, num } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/inventory/low-stock?category
 * → items at or below their minimum level, sorted by severity.
 */
export async function GET(request: NextRequest) {
  return withV1('inventory:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    const conditions = [eq(inventoryItems.schoolId, schoolId)]
    if (category) conditions.push(eq(inventoryItems.category, category))

    const rows = await db
      .select()
      .from(inventoryItems)
      .where(and(...conditions))
      .orderBy(sql`${inventoryItems.name} asc`)
      .limit(500)

    const items = rows
      .map((item) => {
        const onHand = num(item.onHand)
        const minLevel = num(item.minLevel)
        return {
          id: item.id,
          sku: item.sku,
          name: item.name,
          category: item.category,
          supplier: item.supplier,
          location: item.location,
          onHand,
          minLevel,
          unit: item.unit,
          unitCost: num(item.unitCost),
          shortage: round(Math.max(0, minLevel - onHand)),
          reorderValue: round(Math.max(0, minLevel - onHand) * num(item.unitCost)),
          stockStatus: onHand <= 0 ? 'out_of_stock' : onHand < minLevel ? 'low_stock' : 'in_stock',
          severity: onHand <= 0 ? 2 : onHand < minLevel ? 1 : 0,
        }
      })
      .filter((item) => item.severity > 0)
      .sort((a, b) => b.severity - a.severity || b.shortage - a.shortage)

    return ok({
      items,
      totals: {
        itemCount: items.length,
        outOfStock: items.filter((item) => item.severity === 2).length,
        lowStock: items.filter((item) => item.severity === 1).length,
        reorderValue: round(items.reduce((sum, item) => sum + item.reorderValue, 0)),
      },
    })
  })(request)
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
