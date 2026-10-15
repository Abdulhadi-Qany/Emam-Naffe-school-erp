# Comprehensive Fix Plan for School ERP

## Critical Issues (Priority 1)

### 1. Token Encoding Issues (CRITICAL)
- **Problem**: Session table stores raw tokens, Better Auth cookies send URL-encoded tokens
- **Impact**: All authentication failures (401/403 errors on protected routes)
- **Fix**: Update session table to store URL-encoded tokens
- **Files**: scripts/fix-token.ts, middleware/auth.ts

### 2. Session Token Storage
- **Location**: lib/db/schema.ts session table
- **Issue**: Token should be URL-encoded to match Better Auth cookie format
- **Solution**: Store tokens as URL-encoded in session table

## Medium Priority Issues

### 3. API Route Permission Usage
- **Problem**: Routes use withV1('settings:read', ...) and withV1('settings:write', ...)
- **Impact**: Routes may be missing proper RBAC checks
- **Fix**: Use appropriate permissions based on functionality

### 4. Profile API Route (Medium)
- **Location**: app/api/profile/route.ts
- **Issue**: Uses 'settings:read' and 'settings:write' permissions
- **Suggestion**: Should use 'users:read' and 'users:write' permissions

### 5. Notifications API Route (Medium)
- **Location**: app/api/notifications/route.ts  
- **Issue**: Uses 'settings:read' permission
- **Suggestion**: Should use 'notifications:read' permission

### 6. Calendar API Route (Medium)
- **Location**: app/api/calendar/route.ts
- **Issue**: Uses 'academics:read' permission
- **Assessment**: Permission seems correct for calendar functionality

## Low to Medium Issues

### 7. Database Schema Verification
- **Status**: Schema looks correct with schools.id and staffRoles structure
- **Action**: Verify all API routes use correct column references

### 8. Permission Logic
- **Status**: Wildcard '*' check in requirePermission function appears correct
- **Action**: Ensure all routes are properly protected

## Implementation Steps

### Step 1: Fix Token Encoding (Week 1)
1. Update session table to store URL-encoded tokens
2. Update middleware to handle URL-encoded tokens correctly
3. Test authentication flow

### Step 2: Fix API Route Permissions (Week 2)
1. Update profile API route to use 'users:read'/'users:write'
2. Update notifications API route to use appropriate permission
3. Verify calendar API route permission

### Step 3: Schema Verification (Week 3)
1. Review all database queries for correct table/column usage
2. Verify relationships between tables
3. Test all protected endpoints

### Step 4: Permission Testing (Week 4)
1. Test school_admin wildcard permissions
2. Test regular role-based permissions
3. Test edge cases (mixed permissions)

## Files to Modify

### Critical:
- scripts/fix-token.ts (update to complete token encoding fix)
- lib/db/schema.ts (ensure session table token encoding)
- src/infrastructure/http/middleware/auth.ts (update token handling)

### Medium:
- app/api/profile/route.ts (fix permission usage)
- app/api/notifications/route.ts (fix permission usage)
- lib/api/auth.ts (verify withV1 usage)
- lib/api/permissions.ts (verify permission definitions)

## Testing

1. After token encoding fix, test authentication
2. After permission fixes, test API endpoints
3. Run integration tests for all affected routes
4. Verify database schema integrity
