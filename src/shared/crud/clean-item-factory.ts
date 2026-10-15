import { NextRequest, NextResponse } from 'next/server';
import { getAppContainer } from '@/src/app-container';
import { CleanPresenter } from '@/src/shared/crud/CleanPresenter';
import { toResponse } from '@/src/shared/crud/GenericHandlers';
import { requireAuth, requirePermission, resolveSchoolId } from '@/src/infrastructure/http/middleware';
import type { ModuleRegistration } from '@/src/shared/crud/GenericModule';
import { pickName } from './clean-route-factory';

/** Thin item controller factory — GET/PUT/DELETE by id for any module. */
export function cleanItemHandlers(registration: ModuleRegistration) {
  const readPerm = `${registration.permission}:read` as never;
  const writePerm = `${registration.permission}:write` as never;

  async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const container = getAppContainer();
    try {
      const user = await requireAuth(request);
      const schoolId = resolveSchoolId(request);
      await requirePermission(user.id, schoolId, readPerm);
      const { id } = await context.params;
      const entity = await container.module(registration.kind).repository.findById(id);
      if (!entity) return NextResponse.json(CleanPresenter.toHttp(null), { status: 404 });
      return NextResponse.json(CleanPresenter.toHttp(toResponse(entity)));
    } catch (error) {
      const { status, body } = CleanPresenter.toError(error);
      return NextResponse.json(body, { status });
    }
  }

  async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const container = getAppContainer();
    try {
      const user = await requireAuth(request);
      const schoolId = resolveSchoolId(request);
      await requirePermission(user.id, schoolId, writePerm);
      const { id } = await context.params;
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      const { name: _n, title: _t, subject: _s, code, status, schoolId: _si, ...rest } = body;
      void _n; void _t; void _s; void _si;
      const displayName = pickName(body) || undefined;
      const result = await container.module(registration.kind).updateHandler.execute({
        id, schoolId, name: displayName,
        code: code as string | undefined, status: status as string | undefined,
        attributes: Object.keys(rest).length > 0 ? (rest as Record<string, unknown>) : undefined,
        requestedBy: user.id,
      });
      return NextResponse.json(CleanPresenter.toHttp(result));
    } catch (error) {
      const { status, body } = CleanPresenter.toError(error);
      return NextResponse.json(body, { status });
    }
  }

  async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const container = getAppContainer();
    try {
      const user = await requireAuth(request);
      const schoolId = resolveSchoolId(request);
      await requirePermission(user.id, schoolId, writePerm);
      const { id } = await context.params;
      await container.module(registration.kind).repository.delete(id);
      return NextResponse.json(CleanPresenter.toHttp({ deleted: id }));
    } catch (error) {
      const { status, body } = CleanPresenter.toError(error);
      return NextResponse.json(body, { status });
    }
  }

  return { GET, PUT, DELETE };
}
