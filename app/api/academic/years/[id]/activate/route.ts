import { db } from '@/lib/db'
import { academicYears } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ok, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * POST /api/academic/years/[id]/activate — makes this year the current one
 * (exactly one `isCurrent` per school).
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('academics:write', async ({ user }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db.select().from(academicYears).where(eq(academicYears.id, id)).limit(1)
    if (!existing) return notFound('Academic year not found')

    await db.update(academicYears).set({ isCurrent: false, updatedAt: new Date() }).where(eq(academicYears.isCurrent, true))
    const [updated] = await db
      .update(academicYears)
      .set({ isCurrent: true, isActive: true, updatedAt: new Date() })
      .where(eq(academicYears.id, id))
      .returning()

    await audit({
      schoolId: existing.schoolId,
      userId: user.id,
      action: 'approved',
      module: 'academics',
      entityType: 'academic_year',
      entityId: id,
      changes: { isCurrent: true },
    })

    return ok(updated)
  })(request, context)
}
