import { db } from '@/lib/db'
import { books, bookIssues } from '@/lib/db/schema'
import { and, desc, eq, or, ilike, sql, count } from 'drizzle-orm'
import { paged, created, badRequest, withV1, parsePagination, parseFilters, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Library catalog.
 * GET  /api/library/books?category&status&query â†’ catalog with issued counts
 * POST /api/library/books { title, bookId?, author?, isbn?, category?, totalCopies, ... }
 */
export async function GET(request: NextRequest) {
  return withV1('library:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['category', 'status', 'bookType', 'language'])
    const query = searchParams.get('query')

    const conditions = [eq(books.schoolId, schoolId)]
    if (filters.category) conditions.push(eq(books.category, filters.category))
    if (filters.status) conditions.push(eq(books.status, filters.status as never))
    if (filters.bookType) conditions.push(eq(books.bookType, filters.bookType))
    if (filters.language) conditions.push(eq(books.language, filters.language))
    if (query) {
      const q = `%${query}%`
      conditions.push(or(ilike(books.title, q), ilike(books.titleDari, q), ilike(books.author, q), ilike(books.isbn, q), ilike(books.bookId, q))!)
    }

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
      .orderBy(desc(books.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ book, issuedCount }) => ({
        ...book,
        issuedCount: issuedCount ?? 0,
        available: book.availableCopies,
      })),
      pagination,
      total
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('library:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    if (!body.title) return badRequest('title is required')

    const totalCopies = body.totalCopies !== undefined ? Number(body.totalCopies) : 1
    if (!Number.isInteger(totalCopies) || totalCopies < 1) return badRequest('totalCopies must be a whole number â‰¥ 1')

    const bookId = (body.bookId as string) ?? `BK-${crypto.randomUUID().slice(0, 6).toUpperCase()}`
    const [duplicate] = await db.select({ id: books.id }).from(books).where(eq(books.bookId, bookId)).limit(1)
    if (duplicate) return badRequest('A book with this bookId already exists')

    const [createdRow] = (await db
      .insert(books)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        bookId,
        isbn: (body.isbn as string) ?? null,
        title: String(body.title).trim(),
        titleDari: (body.titleDari as string) ?? null,
        titlePashto: (body.titlePashto as string) ?? null,
        author: (body.author as string) ?? null,
        translator: (body.translator as string) ?? null,
        publisher: (body.publisher as string) ?? null,
        publicationYear: body.publicationYear !== undefined ? Number(body.publicationYear) : null,
        language: (body.language as string) ?? 'Dari',
        category: (body.category as string) ?? null,
        subcategory: (body.subcategory as string) ?? null,
        gradeLevel: (body.gradeLevel as string) ?? null,
        bookType: (body.bookType as string) ?? 'textbook',
        totalCopies,
        availableCopies: body.availableCopies !== undefined ? Number(body.availableCopies) : totalCopies,
        shelfLocation: (body.shelfLocation as string) ?? null,
        rackNumber: (body.rackNumber as string) ?? null,
        price: body.price !== undefined ? Number(body.price).toFixed(2) : '0',
        description: (body.description as string) ?? null,
        condition: (body.condition as string) ?? 'new',
        acquisitionSource: (body.acquisitionSource as string) ?? 'purchase',
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'library',
      entityType: 'book',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}
