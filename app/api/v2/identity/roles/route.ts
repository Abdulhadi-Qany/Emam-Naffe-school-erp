import { NextRequest, NextResponse } from 'next/server';
import { getAppContainer } from '@/src/app-container';
import { CleanPresenter } from '@/src/shared/crud/CleanPresenter';
import { requireAuth, requirePermission, resolveSchoolId } from '@/src/infrastructure/http/middleware';

/** GET /api/v2/identity/roles — Clean read of school roles (users:read). */
export async function GET(request: NextRequest) {
  const container = getAppContainer();
  try {
    const user = await requireAuth(request);
    const schoolId = resolveSchoolId(request);
    await requirePermission(user.id, schoolId, 'users:read');
    const data = await container.identityRoles.listBySchool(schoolId);
    return NextResponse.json(CleanPresenter.toHttp(data));
  } catch (error) {
    const { status, body } = CleanPresenter.toError(error);
    return NextResponse.json(body, { status });
  }
}
