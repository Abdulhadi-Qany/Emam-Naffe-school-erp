import { NextRequest, NextResponse } from 'next/server'
import { getContainer } from '@/src/infrastructure/ioc'
import { StudentPresenter } from '@/src/infrastructure/http/presenters/StudentPresenter'
import {
  requireAuth,
  requirePermission,
  resolveSchoolId,
} from '@/src/infrastructure/http/middleware'
import { GradeLevel } from '@/src/domain/value-objects'
import type { StudentStatus } from '@/src/domain/enums'
import type { SpecialCategory } from '@/src/domain/enums'

/**
 * GET /api/v2/students/search?q=...&grade=...&section=...&status=...&page=1&limit=20
 *
 * Free-text search: the handler routes the term to admission number / tazkira /
 * name matching, then applies any structured filters.
 */
export async function GET(request: NextRequest) {
  const container = getContainer()
  try {
    const user = await requireAuth(request)
    const schoolId = resolveSchoolId(request)
    await requirePermission(user.id, schoolId, 'students:read')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const grade = searchParams.get('grade')
    const status = searchParams.get('status')
    let gradeLevel: GradeLevel | undefined
    if (grade && /^\d+$/.test(grade)) {
      // GradeLevel.create validates 0–12; ignore out-of-range query values
      // instead of surfacing a 422 for a bad filter.
      try {
        gradeLevel = GradeLevel.create(parseInt(grade, 10))
      } catch {
        gradeLevel = undefined
      }
    }

    const result = await container.searchStudentsHandler.execute({
      searchTerm: searchParams.get('q') || undefined,
      filters: {
        schoolId,
        gradeLevel,
        section: searchParams.get('section') || undefined,
        gender: searchParams.get('gender') || undefined,
        status: status ? (status as StudentStatus) : undefined,
        specialCategory: (searchParams.get('category') || undefined) as SpecialCategory | undefined,
        enrollmentYear: searchParams.get('year')
          ? parseInt(searchParams.get('year')!, 10)
          : undefined,
      },
      pagination: { page, limit, sortBy: 'createdAt', sortOrder: 'desc' },
      requestedBy: user.id,
    })

    return NextResponse.json(StudentPresenter.toHttpPaginated(result))
  } catch (error) {
    container.logger.error('Search students request failed', {
      message: error instanceof Error ? error.message : String(error),
    })
    const { status, body } = StudentPresenter.toError(error)
    return NextResponse.json(body, { status })
  }
}
