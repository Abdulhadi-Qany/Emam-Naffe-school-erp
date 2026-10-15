import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * POST /api/notifications/[id]/read { userId }
 * → marks a notification as read
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('settings:read', async ({ user }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const userId = (body?.userId as string) ?? user.id

    const [updated] = (await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning()) as unknown as Record<string, unknown>[]

    if (!updated) return notFound('Notification not found')

    await audit({ schoolId: '', userId: user.id, action: 'updated', module: 'notifications', entityType: 'notification', entityId: id, changes: { isRead: true } })

    return ok(updated)
  })(request)
}
