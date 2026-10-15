export {
  requireAuth,
  requirePermission,
  withAuth,
  UnauthorizedError,
  ForbiddenError,
} from './auth'
export type { AuthUser } from './auth'
export { resolveSchoolId, DEFAULT_SCHOOL_ID } from './school'
