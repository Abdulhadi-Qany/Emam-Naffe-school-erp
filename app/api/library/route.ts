import { db } from '@/lib/db'
import { books, bookIssues } from '@/lib/db/schema'
import { and, eq, or, ilike, sql, count } from 'drizzle-orm'
import { paged, parsePagination, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'
import { withV1 } from '@/lib/api'

/**
 * Legacy `/api/library` alias — the canonical collection is `/api/library/books`.
 * Kept for backwards compatibility with existing callers.
 */
export async function GET(request: NextRequest) {
  return withV1('library:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['category', 'status'])
    const query = searchParams.get('query')

    const conditions = [eq(books.schoolId, schoolId)]
    if (filters.category) conditions.push(eq(books.category, filters.category))
    if (filters.status) conditions.push(eq(books.status, filters.status as never))
    if (query) conditions.push(or(ilike(books.title, query), ilike(books.author, query))!)

    const [totalResult] = await db.select({ count: count() }).from(books).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select({
        book: books,
        issuedCount: sql<number>`(
          select count(*)::int from ${bookIssues} bi
          where bi.book_id = "books"."id" and bi.status = 'issued'
        )`,
      })
      .from(books)
      .where(and(...conditions))
      .orderBy(sql`${books.title} asc`)
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ book, issuedCount }) => ({ ...book, issuedCount: issuedCount ?? 0 })),
      pagination,
      total
    )
  })(request)
}
