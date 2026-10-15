import { db } from '@/lib/db'
import { messages } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { notFound, ok, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('communications:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [message] = await db
      .select({ id: messages.id, isRead: messages.isRead })
      .from(messages)
      .where(and(
        eq(messages.id, id),
        eq(messages.schoolId, schoolId),
        eq(messages.recipientId, user.id)
      ))
      .limit(1)
    if (!message) return notFound('Message not found')

    if (!message.isRead) {
      await db.update(messages)
        .set({ isRead: true, readAt: new Date(), updatedAt: new Date() })
        .where(and(eq(messages.id, id), eq(messages.schoolId, schoolId), eq(messages.recipientId, user.id)))
      await audit({
        schoolId,
        userId: user.id,
        action: 'updated',
        module: 'engagement',
        entityType: 'communication',
        entityId: id,
        changes: { isRead: true },
      })
    }

    return ok({ id, isRead: true })
  })(request, context)
}
