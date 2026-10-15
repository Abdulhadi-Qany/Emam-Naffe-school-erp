import { NextRequest, NextResponse } from 'next/server'
import { getContainer } from '@/src/infrastructure/ioc'
import { StudentPresenter } from '@/src/infrastructure/http/presenters/StudentPresenter'
import {
  requireAuth,
  requirePermission,
  resolveSchoolId,
} from '@/src/infrastructure/http/middleware'
import type { UpdateStudentCommand } from '@/src/application/use-cases/commands/update-student/UpdateStudentCommand'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Params) {
  const container = getContainer()
  try {
    const user = await requireAuth(request)
    await requirePermission(user.id, resolveSchoolId(request), 'students:read')

    const { id } = await params
    const result = await container.getStudentHandler.execute({
      studentId: id,
      requestedBy: user.id,
    })
    return NextResponse.json(StudentPresenter.toHttp(result))
  } catch (error) {
    container.logger.error('Get student request failed', {
      message: error instanceof Error ? error.message : String(error),
    })
    const { status, body } = StudentPresenter.toError(error)
    return NextResponse.json(body, { status })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const container = getContainer()
  try {
    const user = await requireAuth(request)
    await requirePermission(user.id, resolveSchoolId(request), 'students:write')

    const { id } = await params
    const body = (await request.json()) as Partial<UpdateStudentCommand>
    const command: UpdateStudentCommand = {
      ...body,
      studentId: id,
      updatedBy: user.id,
    } as UpdateStudentCommand

    const result = await container.updateStudentHandler.execute(command)
    return NextResponse.json(StudentPresenter.toHttp(result))
  } catch (error) {
    container.logger.error('Update student request failed', {
      message: error instanceof Error ? error.message : String(error),
    })
    const { status, body } = StudentPresenter.toError(error)
    return NextResponse.json(body, { status })
  }
}
