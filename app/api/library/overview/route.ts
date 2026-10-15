import { db } from '@/lib/db'
import { bookIssues, books, libraryMembers } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, withV1 } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withV1('library:read', async ({ schoolId }) => {
    const [[bookTotals], [issuedTotals], [memberTotals]] = await Promise.all([
      db
        .select({
          books: sql<number>`count(*)::int`,
          copies: sql<number>`coalesce(sum(${books.totalCopies}), 0)::int`,
        })
        .from(books)
        .where(eq(books.schoolId, schoolId)),
      db
        .select({
          onLoan: sql<number>`count(*)::int`,
          overdue: sql<number>`count(*) filter (where ${bookIssues.dueDate} < current_date)::int`,
        })
        .from(bookIssues)
        .where(and(eq(bookIssues.schoolId, schoolId), eq(bookIssues.status, 'issued'))),
      db
        .select({ members: sql<number>`count(*)::int` })
        .from(libraryMembers)
        .where(and(eq(libraryMembers.schoolId, schoolId), eq(libraryMembers.isActive, true))),
    ])

    return ok({
      totalBooks: Number(bookTotals?.copies ?? 0),
      catalogTitles: Number(bookTotals?.books ?? 0),
      onLoan: Number(issuedTotals?.onLoan ?? 0),
      overdue: Number(issuedTotals?.overdue ?? 0),
      members: Number(memberTotals?.members ?? 0),
    })
  })(request)
}
