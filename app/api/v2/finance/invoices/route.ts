import { NextRequest, NextResponse } from 'next/server';
import { getAppContainer } from '@/src/app-container';
import { FinancePresenter } from '@/src/modules/finance';
import {
  requireAuth,
  requirePermission,
  resolveSchoolId,
} from '@/src/infrastructure/http/middleware';
import type { IssueInvoiceCommand } from '@/src/modules/finance';

/**
 * POST /api/v2/finance/invoices — issue (finance:write)
 * GET  /api/v2/finance/invoices — list (finance:read)
 */
export async function POST(request: NextRequest) {
  const container = getAppContainer();
  try {
    const user = await requireAuth(request);
    const schoolId = resolveSchoolId(request);
    await requirePermission(user.id, schoolId, 'finance:write');

    const body = (await request.json()) as Partial<IssueInvoiceCommand>;
    const result = await container.finance.issueInvoiceHandler.execute({
      ...body,
      schoolId: body.schoolId || schoolId,
      createdBy: user.id,
    } as IssueInvoiceCommand);
    return NextResponse.json(FinancePresenter.toHttp(result), { status: 201 });
  } catch (error) {
    container.logger.error('Issue invoice request failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    const { status, body } = FinancePresenter.toError(error);
    return NextResponse.json(body, { status });
  }
}

export async function GET(request: NextRequest) {
  const container = getAppContainer();
  try {
    const user = await requireAuth(request);
    const schoolId = resolveSchoolId(request);
    await requirePermission(user.id, schoolId, 'finance:read');

    const { searchParams } = new URL(request.url);
    const result = await container.finance.repository.findAll(
      {
        schoolId,
        studentId: searchParams.get('studentId') || undefined,
        status: (searchParams.get('status') as never) || undefined,
      },
      {
        page: parseInt(searchParams.get('page') || '1', 10),
        limit: parseInt(searchParams.get('limit') || '20', 10),
      },
    );
    return NextResponse.json(
      FinancePresenter.toHttpPaginated({
        data: result.data.map((i) => ({
          id: i.getId().getValue(),
          invoiceNumber: i.getInvoiceNumber().getValue(),
          studentId: i.getStudentId(),
          totalAmount: i.getTotal().getAmount(),
          paidAmount: i.getPaidAmount().getAmount(),
          balanceAmount: i.getBalance().getAmount(),
          status: i.getStatus(),
          dueDate: i.getDueDate().toISOString(),
        })),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      }),
    );
  } catch (error) {
    container.logger.error('List invoices request failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    const { status, body } = FinancePresenter.toError(error);
    return NextResponse.json(body, { status });
  }
}
