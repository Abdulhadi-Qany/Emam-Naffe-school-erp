import { NextRequest, NextResponse } from 'next/server';
import { getAppContainer } from '@/src/app-container';
import { CleanPresenter } from '@/src/shared/crud/CleanPresenter';
import { requireAuth, requirePermission, resolveSchoolId } from '@/src/infrastructure/http/middleware';

/** GET /api/v2/governance/audit — Clean audit timeline (audit:read). */
export async function GET(request: NextRequest) {
  const container = getAppContainer();
  try {
    const user = await requireAuth(request);
    const schoolId = resolveSchoolId(request);
    await requirePermission(user.id, schoolId, 'audit:read');
    const { searchParams } = new URL(request.url);
    const result = await container.auditReads.timeline(schoolId, {
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
    });
    return NextResponse.json(CleanPresenter.toHttpPaginated(result));
  } catch (error) {
    const { status, body } = CleanPresenter.toError(error);
    return NextResponse.json(body, { status });
  }
}
