import { db } from '@/lib/db'
import { terms } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:read', async (_ctx, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [row] = await db.select().from(terms).where(eq(terms.id, id)).limit(1)
    if (!row) return notFound('Term not found')
    return ok(row)
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:write', async ({ user }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(terms).where(eq(terms.id, id)).limit(1)
    if (!existing) return notFound('Term not found')

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const [updated] = await db
      .update(terms)
      .set({
        name: typeof body.name === 'string' && body.name.trim() !== '' ? body.name.trim() : existing.name,
        termNumber: body.termNumber !== undefined ? Number(body.termNumber) : existing.termNumber,
        startDate: body.startDate !== undefined ? new Date(body.startDate as string) : existing.startDate,
        endDate: body.endDate !== undefined ? new Date(body.endDate as string) : existing.endDate,
        isCurrent: body.isCurrent !== undefined ? Boolean(body.isCurrent) : existing.isCurrent,
        termType: body.termType !== undefined ? (body.termType as never) : existing.termType,
        updatedAt: new Date(),
      })
      .where(eq(terms.id, id))
      .returning()

    await audit({
      schoolId: existing.academicYearId,
      userId: user.id,
      action: 'updated',
      module: 'academics',
      entityType: 'term',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:write', async ({ user }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(terms).where(eq(terms.id, id)).limit(1)
    if (!existing) return notFound('Term not found')

    await db.delete(terms).where(eq(terms.id, id))

    await audit({
      schoolId: existing.academicYearId,
      userId: user.id,
      action: 'deleted',
      module: 'academics',
      entityType: 'term',
      entityId: id,
    })

    return deleted('Term deleted successfully')
  })(request, context)
}
