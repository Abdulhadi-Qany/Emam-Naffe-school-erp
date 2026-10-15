# Fix Summary for School ERP Development Issues

## Critical Issues Identified

### 1. Token Encoding Issues (CRITICAL)
- **Problem**: Session table stores raw tokens, but Better Auth cookies send URL-encoded tokens
- **Impact**: All authentication failures (401/403 errors on protected routes)
- **Root Cause**: The `session` table in `lib/db/schema.ts` stores raw tokens
- **Solution**: Update session table to store URL-encoded tokens
- **Files to Modify**:
  - `scripts/fix-token.ts` - Update to encode all tokens
  - `scripts/debug-token.ts` - Updated to verify token encoding
  - `src/infrastructure/http/middleware/auth.ts` - Verify auth flow

### 2. API Route Permission Issues (HIGH)
- **Problem**: Some API routes use incorrect permissions
- **Impact**: Routes may not have proper access controls
- **Files to Check**:
  - `app/api/profile/route.ts` - **FIXED**: Now uses 'users:read'/'users:write' permissions
  - `app/api/notifications/route.ts` - **FIXED**: Now uses 'notifications:read' permission
  - `app/api/calendar/route.ts` - Uses 'academics:read' - likely correct

### 3. Database Schema Issues (MEDIUM)
- **Problem**: Database queries using incorrect table/column references
- **Impact**: Database operations may fail
- **Action**: Verify all API routes use correct schema references

## Implementation Plan

### Phase 1: Token Encoding Fix (Week 1)
1. Update `scripts/fix-token.ts` to URL-encode all session tokens
2. Verify authentication flows work correctly
3. Test all protected endpoints

### Phase 2: API Route Permission Fix (Week 2)
1. Update profile API route to use 'users:read'/'users:write' permissions
2. Update notifications API route to use 'notifications:read' permission
3. Verify calendar API route permission is correct
4. Update any other routes with incorrect permissions

### Phase 3: Database Schema Verification (Week 3)
1. Review all API routes for correct table/column usage
2. Fix any schema reference issues
3. Run integration tests

### Phase 4: Permission Logic Testing (Week 4)
1. Test school_admin wildcard permissions
2. Test regular role-based permissions
3. Test edge cases and error conditions

## Testing Requirements

1. **Authentication Testing**: Test all login flows, session management
2. **Authorization Testing**: Test permission enforcement for all roles
3. **API Testing**: Test all endpoints with proper authentication/authorization
4. **Database Testing**: Test database operations with correct schema references

## Priority Actions

1. **Immediate**: Fix token encoding issue - this is causing all authentication failures
2. **High**: Fix API route permissions - this is affecting access controls
3. **Medium**: Verify database schema references - this could cause data access issues
4. **Low**: Fine-tune permission logic - this is optimization

## Expected Outcomes

1. All authentication flows work correctly
2. All API endpoints properly enforce permissions
3. Database operations work with correct schema references
4. school_admin users have proper wildcard permission access
5. All tests pass successfully
