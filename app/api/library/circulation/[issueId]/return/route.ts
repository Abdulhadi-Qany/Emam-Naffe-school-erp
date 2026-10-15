import { db } from '@/lib/db'
import { bookIssues, books } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { ok, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * POST /api/library/circulation/[issueId]/return { condition?, fineAmount? }
 * → closes the issue, returns the copy to inventory and computes overdue fines.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ issueId: string }> }) {
  return withV1('library:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ issueId: string }> }) => {
    const { issueId } = await ctx.params

    const [existing] = await db.select().from(bookIssues).where(eq(bookIssues.id, issueId)).limit(1)
    if (!existing) return notFound('Book issue not found')
    if (existing.status === 'returned') return badRequest('This issue is already returned', 'ALREADY_RETURNED')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    const finePerDay = body?.finePerDay !== undefined ? Number(body.finePerDay) : 5
    const conditionAtReturn = (body?.conditionAtReturn as string) ?? 'good'

    const overdueDays = existing.dueDate
      ? Math.max(0, Math.floor((Date.now() - new Date(existing.dueDate).getTime()) / 86_400_000))
      : 0
    const fineAmount = overdueDays * finePerDay

const result = await db.transaction(async (tx) => {
      const [issue] = (await tx
        .update(bookIssues)
        .set({
          returnDate: new Date(),
          status: 'returned',
          conditionAtReturn: conditionAtReturn,
          fineAmount: fineAmount.toFixed(2),
          returnedBy: user.id,
          updatedAt: new Date(),
        })
        .where(eq(bookIssues.id, issueId))
        .returning()) as unknown as Record<string, unknown>[]

      await tx.update(books).set({ availableCopies: sql`${books.availableCopies} + 1`, updatedAt: new Date() }).where(eq(books.id, existing.bookId))

      return issue
    })

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'library',
      entityType: 'book_issue_return',
      entityId: issueId,
      changes: { condition: conditionAtReturn, fineAmount },
    })

    return ok(result)
  })(request)
}

