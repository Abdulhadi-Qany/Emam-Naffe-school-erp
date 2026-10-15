import { NextRequest, NextResponse } from 'next/server'
import { getContainer } from '@/src/infrastructure/ioc'
import { StudentPresenter } from '@/src/infrastructure/http/presenters/StudentPresenter'
import {
  requireAuth,
  requirePermission,
  resolveSchoolId,
} from '@/src/infrastructure/http/middleware'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * POST /api/v2/students/:id/transfer
 * Body: { reason: string, receivingSchool?: string, transferCertificateUrl?: string }
 */
export async function POST(request: NextRequest, { params }: Params) {
  const container = getContainer()
  try {
    const user = await requireAuth(request)
    await requirePermission(user.id, resolveSchoolId(request), 'students:write')

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const result = await container.transferStudentHandler.execute({
      studentId: id,
      reason: body?.reason || '',
      receivingSchool: body?.receivingSchool,
      transferCertificateUrl: body?.transferCertificateUrl,
      updatedBy: user.id,
    })
    return NextResponse.json(StudentPresenter.toHttp(result))
  } catch (error) {
    container.logger.error('Transfer student request failed', {
      message: error instanceof Error ? error.message : String(error),
    })
    const { status, body } = StudentPresenter.toError(error)
    return NextResponse.json(body, { status })
  }
}
