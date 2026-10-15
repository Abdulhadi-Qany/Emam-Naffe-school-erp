import { NextRequest, NextResponse } from 'next/server';
import { getAppContainer } from '@/src/app-container';
import { StaffPresenter } from '@/src/modules/staff';
import {
  requireAuth,
  requirePermission,
  resolveSchoolId,
} from '@/src/infrastructure/http/middleware';
import type { HireStaffCommand } from '@/src/modules/staff';

/**
 * Thin HTTP controllers — delegate to Staff use-cases; no business logic here.
 * POST /api/v2/staff — hire (staff:write)
 * GET  /api/v2/staff — list (staff:read)
 */

export async function POST(request: NextRequest) {
  const container = getAppContainer();
  try {
    const user = await requireAuth(request);
    const schoolId = resolveSchoolId(request);
    await requirePermission(user.id, schoolId, 'staff:write');

    const body = (await request.json()) as Partial<HireStaffCommand>;
    const result = await container.staff.hireStaffHandler.execute({
      ...body,
      schoolId: body.schoolId || schoolId,
      createdBy: user.id,
    } as HireStaffCommand);
    return NextResponse.json(StaffPresenter.toHttp(result), { status: 201 });
  } catch (error) {
    container.logger.error('Hire staff request failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    const { status, body } = StaffPresenter.toError(error);
    return NextResponse.json(body, { status });
  }
}

export async function GET(request: NextRequest) {
  const container = getAppContainer();
  try {
    const user = await requireAuth(request);
    const schoolId = resolveSchoolId(request);
    await requirePermission(user.id, schoolId, 'staff:read');

    const { searchParams } = new URL(request.url);
    const result = await container.staff.listStaffHandler.execute({
      schoolId,
      query: searchParams.get('query') || searchParams.get('q') || undefined,
      departmentId: searchParams.get('departmentId') || undefined,
      designation: searchParams.get('designation') || undefined,
      status: (searchParams.get('status') as never) || undefined,
      employmentType: (searchParams.get('employmentType') as never) || undefined,
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
      requestedBy: user.id,
    });
    return NextResponse.json(StaffPresenter.toHttpPaginated(result));
  } catch (error) {
    container.logger.error('List staff request failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    const { status, body } = StaffPresenter.toError(error);
    return NextResponse.json(body, { status });
  }
}
