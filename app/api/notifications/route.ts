import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { ok, badRequest, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET  /api/notifications?unread=true&limit= → current user's notifications
 * POST /api/notifications { action: 'read' | 'readAll', id? }
 *      → marks notifications (or all) as read.
 */
export async function GET(request: NextRequest) {
  return withV1('notifications:read', async ({ user }, req) => {
    const { searchParams } = new URL(req.url)
    const unread = searchParams.get('unread') === 'true'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200)

    const conditions = [eq(notifications.userId, user.id)]
    if (unread) conditions.push(eq(notifications.isRead, false))

    const [rows, [count]] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(limit),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false))),
    ])

    function formatRelative(date: Date): string {
      const diff = Date.now() - new Date(date).getTime()
      const minutes = Math.floor(diff / 60000)
      if (minutes < 1) return 'just now'
      if (minutes < 60) return minutes + ' min ago'
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return hours + ' hour' + (hours > 1 ? 's' : '') + ' ago'
      const days = Math.floor(hours / 24)
      return days + ' day' + (days > 1 ? 's' : '') + ' ago'
    }

    return ok({
      notifications: rows.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        notificationType: notification.notificationType,
        module: notification.module,
        entityType: notification.entityType,
        entityId: notification.entityId,
        actionUrl: notification.actionUrl,
        isRead: notification.isRead,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
        shortTime: formatRelative(notification.createdAt),
      })),
      unreadCount: Number(count?.count ?? 0),
    })
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('notifications:read', async ({ user }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body.action !== 'string') return badRequest('action is required')

    if (body.action === 'readAll') {
      await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(eq(notifications.userId, user.id))
      return ok({ message: 'All notifications marked as read' })
    }

    if (body.action === 'read') {
      const id = body.id as string
      if (!id) return badRequest('id is required')
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
      return ok({ message: 'Notification marked as read' })
    }

    return badRequest("action must be 'read' or 'readAll'")
  })(request)
}
