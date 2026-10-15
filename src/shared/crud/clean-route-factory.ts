import { NextRequest, NextResponse } from 'next/server';
import { getAppContainer } from '@/src/app-container';
import { CleanPresenter } from '@/src/shared/crud/CleanPresenter';
import { requireAuth, requirePermission, resolveSchoolId } from '@/src/infrastructure/http/middleware';
import type { ModuleRegistration } from '@/src/shared/crud/GenericModule';

/** Thin collection controller factory — GET list + POST create for any module. */
export function cleanCollectionHandlers(registration: ModuleRegistration) {
  const readPerm = `${registration.permission}:read` as never;
  const writePerm = `${registration.permission}:write` as never;

  async function GET(request: NextRequest) {
    const container = getAppContainer();
    try {
      const user = await requireAuth(request);
      const schoolId = resolveSchoolId(request);
      await requirePermission(user.id, schoolId, readPerm);
      const { searchParams } = new URL(request.url);
      const result = await container.module(registration.kind).listHandler.execute({
        schoolId,
        filters: {
          schoolId,
          query: searchParams.get('query') || searchParams.get('q') || undefined,
          status: searchParams.get('status') || undefined,
        },
        pagination: {
          page: parseInt(searchParams.get('page') || '1', 10),
          limit: Math.min(100, parseInt(searchParams.get('limit') || '20', 10)),
        },
        requestedBy: user.id,
      });
      return NextResponse.json(CleanPresenter.toHttpPaginated(result));
    } catch (error) {
      const { status, body } = CleanPresenter.toError(error);
      return NextResponse.json(body, { status });
    }
  }

  async function POST(request: NextRequest) {
    const container = getAppContainer();
    try {
      const user = await requireAuth(request);
      const schoolId = resolveSchoolId(request);
      await requirePermission(user.id, schoolId, writePerm);
      const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
      if (!body) return NextResponse.json(CleanPresenter.toError(new Error('x')).body, { status: 400 });
      const displayName = pickName(body);
      const { name: _n, title: _t, subject: _s, code, status, schoolId: _si, ...rest } = body;
      void _n; void _t; void _s; void _si;
      const result = await container.module(registration.kind).createHandler.execute({
        schoolId: (body.schoolId as string) || schoolId,
        name: displayName,
        code: code as string | undefined,
        status: (status as string) || 'active',
        attributes: rest,
        createdBy: user.id,
        requestedBy: user.id,
      });
      return NextResponse.json(CleanPresenter.toHttp(result), { status: 201 });
    } catch (error) {
      const { status, body } = CleanPresenter.toError(error);
      return NextResponse.json(body, { status });
    }
  }

  return { GET, POST };
}

export function pickName(body: Record<string, unknown>): string {
  for (const k of ['name', 'title', 'subject']) {
    if (typeof body[k] === 'string' && (body[k] as string).trim()) return (body[k] as string).trim();
  }
  return '';
}
