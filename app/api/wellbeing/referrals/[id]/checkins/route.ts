import { db } from '@/lib/db'
import { wellbeingReferrals, wellbeingCheckins } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { ok, notFound, withV1 } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/wellbeing/referrals/[id]/checkins
 * → list of check-ins for a referral
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('wellbeing:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [referral] = await db.select().from(wellbeingReferrals).where(eq(wellbeingReferrals.id, id)).limit(1)
    if (!referral) return notFound('Referral not found')

    const checkins = await db.select().from(wellbeingCheckins).where(eq(wellbeingCheckins.referralId, id)).orderBy(desc(wellbeingCheckins.checkinDate)).limit(50)

    return ok({ referral, checkins })
  })(request, context)
}

