import { db } from '@/lib/db'
import { events } from '@/lib/db/schema'
import { and, count, desc, eq, sql } from 'drizzle-orm'
import { ok, created, badRequest, notFound, withV1, audit, parsePagination, parseFilters, num, paged } from '@/lib/api'
import type { NextRequest } from 'next/server'

const STATUSES = ['planned', 'ongoing', 'completed', 'cancelled'] as const
const EVENT_TYPES = ['academic', 'holiday', 'meeting', 'sports', 'cultural'] as const

export async function GET(request: NextRequest) {
  return withV1('events:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(request.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['status', 'eventType'])
    const query = searchParams.get('query')

    const conditions = [eq(events.schoolId, schoolId)]
    if (filters.status) conditions.push(eq(events.status, filters.status as never))
    if (filters.eventType) conditions.push(eq(events.eventType, filters.eventType as never))
    if (query) conditions.push(sql`${events.title} ilike ${'%' + query + '%'}`)

    const [totalResult] = await db.select({ count: count() }).from(events).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(desc(events.startDate))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map((event) => ({
        ...event,
        budgetValue: num(event.budget),
        actualCostValue: num(event.actualCost),
        dateLabel: event.startDate ? event.startDate.toISOString().slice(0, 10) : null,
        endDateLabel: event.endDate ? event.endDate.toISOString().slice(0, 10) : null,
      })),
      pagination,
      total
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('events:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['title', 'eventType', 'startDate', 'endDate']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }

    const startDate = new Date(body.startDate as string)
    const endDate = new Date(body.endDate as string)
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return badRequest('startDate and endDate must be valid dates')
    }
    if (endDate < startDate) return badRequest('endDate must be on or after startDate')

    const [duplicate] = await db
      .select({ id: events.id })
      .from(events)
      .where(sql`${events.title} = ${String(body.title).trim()} and ${events.startDate} = ${startDate.toISOString()}`)
      .limit(1)
    if (duplicate) return badRequest('An event with this title and start date already exists')

    const [createdRow] = (await db
      .insert(events)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        title: String(body.title).trim(),
        titleDari: (body.titleDari as string) ?? null,
        titlePashto: (body.titlePashto as string) ?? null,
        description: (body.description as string) ?? null,
        eventType: body.eventType as never,
        startDate,
        endDate,
        venue: (body.venue as string) ?? null,
        organizer: (body.organizer as string) ?? null,
        budget: body.budget !== undefined ? num(body.budget).toFixed(2) : '0',
        actualCost: body.actualCost !== undefined ? num(body.actualCost).toFixed(2) : '0',
        chiefGuest: (body.chiefGuest as string) ?? null,
        isPublished: body.isPublished === true,
        status: 'planned',
        createdBy: user.id,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'engagement',
      entityType: 'event',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}

