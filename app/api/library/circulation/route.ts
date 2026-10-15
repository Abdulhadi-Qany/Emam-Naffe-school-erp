import { db } from '@/lib/db'
import { books, bookIssues, libraryMembers, students } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { ok, created, badRequest, notFound, unprocessable, withV1, audit, startOfDay } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Library circulation.
 * GET  /api/library/circulation?status&query â†’ open issues with overdue flags
 * POST /api/library/circulation { bookId, memberId?, studentId?, staffId?, dueDate }
 *      â†’ issues a book (validated: copies available, member not over their limit)
 * POST /api/library/circulation/[issueId]/return â†’ returns a book + computes fines
 */
export async function GET(request: NextRequest) {
  return withV1('library:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const query = searchParams.get('query')

    const conditions = [eq(bookIssues.schoolId, schoolId)]
    if (status) conditions.push(eq(bookIssues.status, status))
    if (query) conditions.push(sql`(${books.title} ilike ${`%${query}%`} or ${bookIssues.issueNumber} ilike ${`%${query}%`})`)

    const rows = await db
      .select({
        issue: bookIssues,
        bookTitle: books.title,
        bookId: books.bookId,
        memberName: sql<string | null>`(
          select ${students.fullName} from ${students} where ${students.id} = (
            select ${libraryMembers.studentId} from ${libraryMembers} where ${libraryMembers.id} = ${bookIssues.memberId}
          )
        )`,
      })
      .from(bookIssues)
      .leftJoin(books, eq(bookIssues.bookId, books.id))
      .where(and(...conditions))
      .orderBy(desc(bookIssues.issueDate))
      .limit(200)

    const now = Date.now()
    return ok({
      issues: rows.map(({ issue, bookTitle, bookId, memberName }) => ({
        ...issue,
        bookTitle,
        bookId,
        memberName,
        dueDateLabel: issue.dueDate ? issue.dueDate.toISOString().slice(0, 10) : null,
        overdueDays: issue.dueDate && issue.status === 'issued' ? Math.max(0, Math.floor((now - new Date(issue.dueDate).getTime()) / 86_400_000)) : 0,
      })),
    })
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('library:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const bookId = body.bookId as string
    const dueDateRaw = body.dueDate as string
    if (!bookId || !dueDateRaw) return badRequest('bookId and dueDate are required')

    const dueDate = startOfDay(new Date(dueDateRaw))
    if (Number.isNaN(dueDate.getTime())) return badRequest('dueDate must be a valid date')

    const [book] = await db.select().from(books).where(and(eq(books.id, bookId), eq(books.schoolId, schoolId))).limit(1)
    if (!book) return notFound('Book not found')
    if (book.availableCopies <= 0) return unprocessable('No copies available for this book', 'NO_COPIES')

    const memberId = (body.memberId as string) ?? (await resolveMemberId(schoolId, body))
    if (!memberId) return badRequest('memberId (or studentId/staffId) is required')

    const [member] = await db.select().from(libraryMembers).where(and(eq(libraryMembers.id, memberId), eq(libraryMembers.schoolId, schoolId))).limit(1)
    if (!member) return notFound('Library member not found')
    if (!member.isActive) return unprocessable('The library membership is not active', 'MEMBER_INACTIVE')

    const [openIssues] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookIssues)
      .where(and(eq(bookIssues.memberId, memberId), eq(bookIssues.status, 'issued')))
    if ((openIssues?.count ?? 0) >= member.maxBooks) {
      return unprocessable(`Member has reached the ${member.maxBooks} book limit`, 'MEMBER_LIMIT')
    }

    const issueNumber = `EBPS-ISS-${Date.now().toString(36).toUpperCase()}`

    const result = await db.transaction(async (tx) => {
      const [issue] = (await tx
        .insert(bookIssues)
        .values({
          id: crypto.randomUUID(),
          schoolId,
          issueNumber,
          bookId,
          memberId,
          issueDate: new Date(),
          dueDate,
          conditionAtIssue: (body.conditionAtIssue as string) ?? 'good',
          issuedBy: user.id,
          status: 'issued',
          notes: (body.notes as string) ?? null,
        })
        .returning()) as unknown as Record<string, unknown>[]

      await tx.update(books).set({ availableCopies: Math.max(0, book.availableCopies - 1), updatedAt: new Date() }).where(eq(books.id, bookId))
      return issue
    })

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'library',
      entityType: 'book_issue',
      entityId: result.id as string,
    })

    return created(result)
  })(request)
}

async function resolveMemberId(schoolId: string, body: Record<string, unknown>): Promise<string | null> {
  const [member] = await db
    .select({ id: libraryMembers.id })
    .from(libraryMembers)
    .where(
      body.studentId
        ? and(eq(libraryMembers.schoolId, schoolId), eq(libraryMembers.studentId, body.studentId as string))
        : body.staffId
          ? and(eq(libraryMembers.schoolId, schoolId), eq(libraryMembers.staffId, body.staffId as string))
          : sql`false`
    )
    .limit(1)
  return member?.id ?? null
}
