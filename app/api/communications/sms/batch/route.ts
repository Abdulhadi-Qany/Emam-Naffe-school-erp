import { db } from '@/lib/db'
import { smsMessages } from '@/lib/db/schema'
import { ok, badRequest, unprocessable, withV1, audit, num } from '@/lib/api'
import type { NextRequest } from 'next/server'

const STATUSES = ['queued', 'sent', 'delivered', 'failed'] as const

export async function POST(request: NextRequest) {
  return withV1('communications:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const recipients = body.recipients as { userId?: string; phone?: string; name?: string }[] | undefined
    const message = body.message as string | undefined

    if (!Array.isArray(recipients) || recipients.length === 0) return badRequest('recipients must be a non-empty array')
    if (!message || message.trim().length < 5) return badRequest('message is required (5+ characters)')
    if (recipients.length > 500) return unprocessable('SMS batches are limited to 500 recipients', 'TOO_MANY')

    for (const recipient of recipients) {
      if (!recipient.userId && !recipient.phone) {
        return badRequest('each recipient requires userId or phone')
      }
    }
    if (message.length > 320) return unprocessable('SMS messages must be 320 characters or fewer', 'MESSAGE_TOO_LONG')

    const rows = recipients.map((recipient) => ({
      id: crypto.randomUUID(),
      schoolId,
      userId: recipient.userId ?? null,
      recipientType: recipient.userId ? 'registered' : 'external',
      phone: recipient.phone ?? null,
      message,
      status: 'queued',
      sentBy: user.id,
    })) as never[]

    await db.insert(smsMessages).values(rows)

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'engagement',
      entityType: 'sms_batch',
      entityId: schoolId,
      changes: { recipients: rows.length, messageLength: num(message.length) },
    })

    return ok({ queued: rows.length })
  })(request)
}