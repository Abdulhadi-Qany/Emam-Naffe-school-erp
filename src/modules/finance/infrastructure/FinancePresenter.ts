import { DomainError } from '@/src/domain/errors/DomainError';
import { ApplicationError, ValidationError, NotFoundError } from '@/src/application/exceptions';
import { InvoiceNotFoundError } from '../domain/FinanceErrors';
import { UnauthorizedError, ForbiddenError } from '@/src/infrastructure/http/middleware/auth';

export interface HttpResponse<T> {
  success: boolean;
  data?: T;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  error?: { code: string; message: string; details?: unknown };
  timestamp: string;
}

/** Formats finance use-case output into the standard HTTP JSON envelope. */
export class FinancePresenter {
  public static toHttp<T>(data: T): HttpResponse<T> {
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  public static toHttpPaginated<T>(result: {
    data: T[]; page: number; limit: number; total: number; totalPages: number;
  }): HttpResponse<T[]> {
    return {
      success: true, data: result.data,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
      timestamp: new Date().toISOString(),
    };
  }

  public static toError(error: unknown): { status: number; body: HttpResponse<never> } {
    if (error instanceof UnauthorizedError)
      return { status: 401, body: { success: false, error: { code: 'UNAUTHORIZED', message: error.message }, timestamp: new Date().toISOString() } };
    if (error instanceof ForbiddenError)
      return { status: 403, body: { success: false, error: { code: 'FORBIDDEN', message: error.message }, timestamp: new Date().toISOString() } };
    if (error instanceof ValidationError)
      return { status: 400, body: { success: false, error: { code: error.code, message: error.message, details: error.errors }, timestamp: new Date().toISOString() } };
    if (error instanceof NotFoundError || error instanceof InvoiceNotFoundError)
      return { status: 404, body: { success: false, error: { code: error.code, message: error.message, details: error.details }, timestamp: new Date().toISOString() } };
    if (error instanceof DomainError)
      return { status: 422, body: { success: false, error: { code: error.code, message: error.message, details: error.details }, timestamp: new Date().toISOString() } };
    if (error instanceof ApplicationError)
      return { status: 400, body: { success: false, error: { code: error.code, message: error.message, details: error.details }, timestamp: new Date().toISOString() } };
    return { status: 500, body: { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, timestamp: new Date().toISOString() } };
  }
}
