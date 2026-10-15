import { db } from '@/lib/db'
import { surveys, surveyResponses } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, notFound, withV1 } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/surveys/[id]/responses → survey with its responses
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('communications:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [survey] = await db.select().from(surveys).where(and(eq(surveys.id, id), eq(surveys.schoolId, schoolId))).limit(1)
    if (!survey) return notFound('Survey not found')

    const responses = await db.select().from(surveyResponses).where(eq(surveyResponses.surveyId, id)).limit(500)

    return ok({ ...survey, responses: responses })
  })(request)
}

export { ok, notFound }