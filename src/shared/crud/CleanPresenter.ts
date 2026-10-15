import { DomainError } from '@/src/domain/errors/DomainError';
import { ApplicationError, ValidationError, NotFoundError } from '@/src/application/exceptions';
import { UnauthorizedError, ForbiddenError } from '@/src/infrastructure/http/middleware/auth';

export interface CleanResponse<T> {
  success: boolean;
  data?: T;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  error?: { code: string; message: string; details?: unknown };
  timestamp: string;
}

/** Shared presenter — ONE envelope for every Clean module. */
export class CleanPresenter {
  public static toHttp<T>(data: T): CleanResponse<T> {
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  public static toHttpPaginated<T>(r: { data: T[]; page: number; limit: number; total: number; totalPages: number }): CleanResponse<T[]> {
    return {
      success: true,
      data: r.data,
      pagination: { page: r.page, limit: r.limit, total: r.total, totalPages: r.totalPages },
      timestamp: new Date().toISOString(),
    };
  }

  public static toError(error: unknown): { status: number; body: CleanResponse<never> } {
    const ts = () => new Date().toISOString();
    if (error instanceof UnauthorizedError)
      return { status: 401, body: { success: false, error: { code: 'UNAUTHORIZED', message: error.message }, timestamp: ts() } };
    if (error instanceof ForbiddenError)
      return { status: 403, body: { success: false, error: { code: 'FORBIDDEN', message: error.message }, timestamp: ts() } };
    if (error instanceof ValidationError)
      return { status: 400, body: { success: false, error: { code: error.code, message: error.message, details: error.errors }, timestamp: ts() } };
    if (error instanceof NotFoundError)
      return { status: 404, body: { success: false, error: { code: error.code, message: error.message }, timestamp: ts() } };
    if (error instanceof DomainError)
      return {
        status: error.code.endsWith('NOT_FOUND') ? 404 : 422,
        body: { success: false, error: { code: error.code, message: error.message, details: error.details }, timestamp: ts() },
      };
    if (error instanceof ApplicationError)
      return { status: 400, body: { success: false, error: { code: error.code, message: error.message }, timestamp: ts() } };
    return { status: 500, body: { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, timestamp: ts() } };
  }
}
