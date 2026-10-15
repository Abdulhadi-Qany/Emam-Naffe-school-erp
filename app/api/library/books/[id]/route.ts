import { db } from '@/lib/db'
import { books, bookIssues } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET    /api/library/books/[id]  → book + issue history
 * PUT    /api/library/books/[id]  → catalog edits (blocks reducing copies below issued)
 * DELETE /api/library/books/[id]
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('library:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [book] = await db.select().from(books).where(and(eq(books.id, id), eq(books.schoolId, schoolId))).limit(1)
    if (!book) return notFound('Book not found')

    const [issued] = await db.select({ count: sql<number>`count(*)::int` }).from(bookIssues).where(and(eq(bookIssues.bookId, id), eq(bookIssues.status, 'issued')))
    return ok({ ...book, issuedCount: issued?.count ?? 0 })
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('library:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(books).where(and(eq(books.id, id), eq(books.schoolId, schoolId))).limit(1)
    if (!existing) return notFound('Book not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const [issued] = await db.select({ count: sql<number>`count(*)::int` }).from(bookIssues).where(and(eq(bookIssues.bookId, id), eq(bookIssues.status, 'issued')))
    const issuedCount = issued?.count ?? 0

    const totalCopies = body.totalCopies !== undefined ? Number(body.totalCopies) : existing.totalCopies
    if (!Number.isInteger(totalCopies) || totalCopies < Math.max(1, issuedCount)) {
      return badRequest(`totalCopies must be a whole number ≥ ${Math.max(1, issuedCount)} (currently issued)`)
    }
    const availableCopies = body.availableCopies !== undefined
      ? Number(body.availableCopies)
      : Math.max(0, existing.availableCopies + totalCopies - existing.totalCopies)
    if (!Number.isInteger(availableCopies) || availableCopies < 0 || availableCopies > totalCopies - issuedCount) {
      return badRequest('availableCopies must be a whole number between zero and totalCopies minus currently issued copies')
    }

    const [updated] = (await db
      .update(books)
      .set({
        title: typeof body.title === 'string' && body.title.trim() !== '' ? body.title.trim() : existing.title,
        titleDari: body.titleDari !== undefined ? (body.titleDari as string | null) : existing.titleDari,
        titlePashto: body.titlePashto !== undefined ? (body.titlePashto as string | null) : existing.titlePashto,
        author: body.author !== undefined ? (body.author as string | null) : existing.author,
        translator: body.translator !== undefined ? (body.translator as string | null) : existing.translator,
        publisher: body.publisher !== undefined ? (body.publisher as string | null) : existing.publisher,
        publicationYear: body.publicationYear !== undefined ? Number(body.publicationYear) : existing.publicationYear,
        language: body.language !== undefined ? (body.language as string) : existing.language,
        category: body.category !== undefined ? (body.category as string | null) : existing.category,
        gradeLevel: body.gradeLevel !== undefined ? (body.gradeLevel as string | null) : existing.gradeLevel,
        bookType: body.bookType !== undefined ? (body.bookType as string) : existing.bookType,
        totalCopies,
        availableCopies,
        shelfLocation: body.shelfLocation !== undefined ? (body.shelfLocation as string | null) : existing.shelfLocation,
        rackNumber: body.rackNumber !== undefined ? (body.rackNumber as string | null) : existing.rackNumber,
        price: body.price !== undefined ? Number(body.price).toFixed(2) : existing.price,
        description: body.description !== undefined ? (body.description as string | null) : existing.description,
        condition: body.condition !== undefined ? (body.condition as string) : existing.condition,
        status: body.status !== undefined ? (body.status as never) : existing.status,
        updatedAt: new Date(),
      })
      .where(eq(books.id, id))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'library',
      entityType: 'book',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('library:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select({ id: books.id }).from(books).where(and(eq(books.id, id), eq(books.schoolId, schoolId))).limit(1)
    if (!existing) return notFound('Book not found')

    const [issued] = await db.select({ id: bookIssues.id }).from(bookIssues).where(and(eq(bookIssues.bookId, id), eq(bookIssues.status, 'issued'))).limit(1)
    if (issued) return badRequest('This book has open issues; return them before deleting', 'OPEN_ISSUES')

    await db.update(books).set({ status: 'lost', updatedAt: new Date() }).where(eq(books.id, id))

    await audit({
      schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'library',
      entityType: 'book',
      entityId: id,
    })

    return deleted('Book removed from catalog successfully')
  })(request, context)
}
