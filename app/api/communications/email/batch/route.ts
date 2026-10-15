import { db } from '@/lib/db'
import { emailMessages } from '@/lib/db/schema'
import { ok, badRequest, unprocessable, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * POST /api/communications/email/batch
 * { recipients: [{ email }], subject, body } → queues one email row per recipient.
 */
export async function POST(request: NextRequest) {
  return withV1('communications:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const recipients = body.recipients as { email: string; name?: string }[] | undefined
    const subject = body.subject as string | undefined

    if (!Array.isArray(recipients) || recipients.length === 0) return badRequest('recipients must be a non-empty array')
    if (!subject || subject.trim() === '') return badRequest('subject is required')
    if (recipients.length > 500) return unprocessable('Email batches are limited to 500 recipients', 'TOO_MANY')
    for (const recipient of recipients) {
      if (!recipient.email || !recipient.email.includes('@')) {
        return badRequest('each recipient requires a valid email')
      }
    }

    const rows = recipients.map((recipient) => ({
      id: crypto.randomUUID(),
      schoolId,
      toEmail: recipient.email,
      toName: recipient.name ?? null,
      subject,
      bodyHtml: (body.body as string) ?? null,
      status: 'queued',
      sentBy: user.id,
    })) as never[]

    await db.insert(emailMessages).values(rows)

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'engagement',
      entityType: 'email_batch',
      entityId: schoolId,
      changes: { recipients: rows.length, subject },
    })

    return ok({ queued: rows.length })
  })(request)
}