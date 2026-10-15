import { db } from '@/lib/db'
import { facilityWorkOrders, rooms, staff, assets } from '@/lib/db/schema'
import { and, count, desc, eq, ilike, sql } from 'drizzle-orm'
import { paged, created, ok, badRequest, notFound, withV1, audit, parsePagination, parseFilters, num } from '@/lib/api'
import type { NextRequest } from 'next/server'

const STATUSES = ['open', 'assigned', 'in_progress', 'completed', 'cancelled'] as const
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

/**
 * Facility work orders.
 * GET  /api/facilities/work-orders?status&priority&roomId&query
 * POST /api/facilities/work-orders { title, description?, priority?, roomId?, assetId?, cost?, scheduledFor? }
 */
export async function GET(request: NextRequest) {
  return withV1('facilities:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['status', 'priority', 'roomId'])
    const query = searchParams.get('query')

    const conditions = [eq(facilityWorkOrders.schoolId, schoolId)]
    if (filters.status) conditions.push(eq(facilityWorkOrders.status, filters.status as never))
    if (filters.priority) conditions.push(eq(facilityWorkOrders.priority, filters.priority as never))
    if (filters.roomId) conditions.push(eq(facilityWorkOrders.roomId, filters.roomId))
    if (query) {
      const q = `%${query}%`
      conditions.push(
        sql`(${facilityWorkOrders.title} ilike ${q} or ${facilityWorkOrders.reference} ilike ${q} or ${facilityWorkOrders.description} ilike ${q})`
      )
    }

    const [totalResult] = await db.select({ count: count() }).from(facilityWorkOrders).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select({
        order: facilityWorkOrders,
        roomLabel: rooms.name,
        assigneeName: staff.fullName,
        assetName: assets.name,
      })
      .from(facilityWorkOrders)
      .leftJoin(rooms, eq(facilityWorkOrders.roomId, rooms.id))
      .leftJoin(staff, eq(facilityWorkOrders.assignedTo, staff.id))
      .leftJoin(assets, eq(facilityWorkOrders.assetId, assets.id))
      .where(and(...conditions))
      .orderBy(desc(facilityWorkOrders.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ order, roomLabel, assigneeName, assetName }) => ({
        ...order,
        costValue: num(order.cost),
        roomLabel,
        assigneeName,
        assetName,
        scheduledLabel: order.scheduledFor ? order.scheduledFor.toISOString().slice(0, 10) : null,
      })),
      pagination,
      total
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('facilities:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    if (!body.title) return badRequest('title is required')
    if (body.priority !== undefined && !PRIORITIES.includes(body.priority as (typeof PRIORITIES)[number])) {
      return badRequest(`priority must be one of: ${PRIORITIES.join(', ')}`)
    }
    if (body.status !== undefined && !STATUSES.includes(body.status as (typeof STATUSES)[number])) {
      return badRequest(`status must be one of: ${STATUSES.join(', ')}`)
    }

    const academicYear = 1403
    const sequence = Math.floor(Math.random() * 9000) + 1000
    const reference = `WO-${academicYear}-${String(sequence).padStart(4, '0')}`

    const [createdRow] = (await db
      .insert(facilityWorkOrders)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        reference,
        title: String(body.title).trim(),
        description: (body.description as string) ?? null,
        priority: (body.priority as never) ?? 'medium',
        status: ((body.status as string) ?? 'open') as never,
        roomId: (body.roomId as string) ?? null,
        assetId: (body.assetId as string) ?? null,
        assignedTo: (body.assignedTo as string) ?? null,
        requestedBy: user.id,
        cost: body.cost !== undefined ? String(body.cost) : '0',
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor as string) : null,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'facilities',
      entityType: 'facility_work_order',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}
