import { NextRequest, NextResponse } from 'next/server'
import { getContainer } from '@/src/infrastructure/ioc'
import { StudentPresenter } from '@/src/infrastructure/http/presenters/StudentPresenter'
import {
  requireAuth,
  requirePermission,
  resolveSchoolId,
} from '@/src/infrastructure/http/middleware'
import type { AdmitStudentCommand } from '@/src/application/use-cases/commands/admit-student/AdmitStudentCommand'

/**
 * Framework/drivers layer — thin HTTP controller.
 * Delegates to use cases via the composition root; contains no business logic.
 * Auth: better-auth session + staff_roles RBAC (`students:read` / `students:write`).
 */

export async function POST(request: NextRequest) {
  const container = getContainer()
  try {
    const user = await requireAuth(request)
    const schoolId = resolveSchoolId(request)
    await requirePermission(user.id, schoolId, 'students:write')

    const body = (await request.json()) as Partial<AdmitStudentCommand>
    const command: AdmitStudentCommand = {
      ...body,
      schoolId: body.schoolId || schoolId,
      createdBy: user.id,
    } as AdmitStudentCommand

    const result = await container.admitStudentHandler.execute(command)
    return NextResponse.json(StudentPresenter.toHttp(result), { status: 201 })
  } catch (error) {
    container.logger.error('Admission request failed', {
      message: error instanceof Error ? error.message : String(error),
    })
    const { status, body } = StudentPresenter.toError(error)
    return NextResponse.json(body, { status })
  }
}

export async function GET(request: NextRequest) {
  const container = getContainer()
  try {
    const user = await requireAuth(request)
    const schoolId = resolveSchoolId(request)
    await requirePermission(user.id, schoolId, 'students:read')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const result = await container.listStudentsHandler.execute({
      filters: {
        name: searchParams.get('query') || undefined,
        province: searchParams.get('province') || undefined,
        schoolId,
      },
      pagination: { page, limit, sortBy: 'createdAt', sortOrder: 'desc' },
      requestedBy: user.id,
    })

    return NextResponse.json(StudentPresenter.toHttpPaginated(result))
  } catch (error) {
    container.logger.error('List students request failed', {
      message: error instanceof Error ? error.message : String(error),
    })
    const { status, body } = StudentPresenter.toError(error)
    return NextResponse.json(body, { status })
  }
}
