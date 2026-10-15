import { db } from '@/lib/db'
import { messages as communications, staff } from '@/lib/db/schema'
import { and, count, desc, eq, ilike, isNotNull, sql } from 'drizzle-orm'
import { paged, created, ok, badRequest, notFound, withV1, audit, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Communication inbox (messages between school roles).
 * GET  /api/communications?status&channel&query â†’ joined sender/recipient rows
 * POST /api/communications { recipientId, message, subject-agnostic } â†’ sends a message
 */
export async function GET(request: NextRequest) {
  return withV1('communications:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['status', 'groupId'])
    const query = searchParams.get('query')

    const conditions = [eq(communications.schoolId, schoolId), sql`${communications.parentMessageId} is null`]
    if (filters.groupId) conditions.push(eq(communications.groupId, filters.groupId))
    if (query) {
      const q = `%${query}%`
      conditions.push(ilike(communications.message, q))
    }

    const [totalResult] = await db.select({ count: count() }).from(communications).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select({
        entry: communications,
        replies: sql<number>`(
          select count(*)::int from communications r where r.parent_message_id = "communications"."id"
        )`,
      })
      .from(communications)
      .where(and(...conditions))
      .orderBy(desc(communications.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ entry, replies }) => ({
        id: entry.id,
        groupId: entry.groupId,
        senderId: entry.senderId,
        recipientId: entry.recipientId,
        message: entry.message,
        attachments: entry.attachments,
        isRead: entry.isRead,
        readAt: entry.readAt,
        parentMessageId: entry.parentMessageId,
        dateLabel: entry.createdAt ? entry.createdAt.toISOString().slice(0, 10) : null,
        timeLabel: entry.createdAt ? entry.createdAt.toISOString().slice(11, 16) : null,
        replyCount: replies ?? 0,
        createdAt: entry.createdAt,
      })),
      pagination,
      total
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('communications:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const recipientId = typeof body.recipientId === 'string' ? body.recipientId.trim() : ''
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (!recipientId) return badRequest('recipientId is required')
    if (!message) return badRequest('message is required')
    if (message.length > 10000) return badRequest('message must not exceed 10000 characters')

    const [recipient] = await db
      .select({ userId: staff.userId })
      .from(staff)
      .where(and(eq(staff.schoolId, schoolId), eq(staff.userId, recipientId), isNotNull(staff.userId)))
      .limit(1)
    if (!recipient || recipient.userId !== recipientId) return notFound('Recipient is not an active account in this school')
    if (recipientId === user.id) return badRequest('You cannot send a message to yourself')

    if (body.parentMessageId) {
      const [parent] = await db
        .select({ id: communications.id, senderId: communications.senderId })
        .from(communications)
        .where(and(
          eq(communications.id, String(body.parentMessageId)),
          eq(communications.schoolId, schoolId),
          sql`(${communications.senderId} = ${user.id} or ${communications.recipientId} = ${user.id})`
        ))
        .limit(1)
      if (!parent) return notFound('Reply target not found')
    }

    const [createdRow] = (await db
      .insert(communications)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        groupId: null,
        senderId: user.id,
        recipientId,
        message,
        attachments: [],
        parentMessageId: (body.parentMessageId as string) ?? null,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'engagement',
      entityType: 'communication',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}
