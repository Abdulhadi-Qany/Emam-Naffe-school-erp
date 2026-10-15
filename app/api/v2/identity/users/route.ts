import { NextRequest, NextResponse } from 'next/server';
import { getAppContainer } from '@/src/app-container';
import { CleanPresenter } from '@/src/shared/crud/CleanPresenter';
import { requireAuth, requirePermission, resolveSchoolId } from '@/src/infrastructure/http/middleware';

/** GET /api/v2/identity/users — Clean read of identity users (users:read). */
export async function GET(request: NextRequest) {
  const container = getAppContainer();
  try {
    const user = await requireAuth(request);
    const schoolId = resolveSchoolId(request);
    await requirePermission(user.id, schoolId, 'users:read');
    const { searchParams } = new URL(request.url);
    const result = await container.identityUsers.list(searchParams.get('query') || undefined, {
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
    });
    return NextResponse.json(CleanPresenter.toHttpPaginated(result));
  } catch (error) {
    const { status, body } = CleanPresenter.toError(error);
    return NextResponse.json(body, { status });
  }
}
