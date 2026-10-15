/**
 * Central permission registry — the single source of truth for API authorization.
 *
 * Every route declares exactly one permission via `withV1(permission, handler)`
 * (v1 lane) or `requirePermission(user.id, schoolId, permission)` (v2 lane).
 * Permissions are enforced against the `staff_roles.permissions` JSON array,
 * which supports `*` (all permissions) and explicit entries.
 */

export const PERMISSIONS = [
  // People
  'students:read',
  'students:write',
  'admissions:read',
  'admissions:write',
  'staff:read',
  'staff:write',
  'hr:read',
  'hr:write',
  // Academic operations
  'academics:read',
  'academics:write',
  'attendance:read',
  'attendance:write',
  'exams:read',
  'exams:write',
  'homework:read',
  'homework:write',
  // Finance
  'fees:read',
  'fees:write',
  'payments:read',
  'payments:write',
  'finance:read',
  'finance:write',
  'expenses:read',
  'expenses:write',
  'budgets:read',
  'budgets:write',
  'payroll:read',
  'payroll:write',
  // Operations
  'library:read',
  'library:write',
  'transport:read',
  'transport:write',
  'hostel:read',
  'hostel:write',
  'inventory:read',
  'inventory:write',
  'facilities:read',
  'facilities:write',
  'wellbeing:read',
  'wellbeing:write',
  // Engagement
  'communications:read',
  'communications:write',
  'announcements:read',
  'announcements:write',
  'events:read',
  'events:write',
  // Governance
  'reports:read',
  'reports:write',
  'settings:read',
  'settings:write',
  'users:read',
  'users:write',
  'audit:read',
  'documents:read',
  'documents:write',
  'notifications:read',
  'notifications:write',
] as const

export type Permission = (typeof PERMISSIONS)[number]

const PERMISSION_SET = new Set<string>(PERMISSIONS)

export function isPermission(value: string): value is Permission {
  return PERMISSION_SET.has(value)
}

/**
 * Role templates define permissions for different user types in the school ERP.
 * - school_admin: Full access (wildcard '*') — system owner.
 * - principal: Full operational access (all explicit permissions) — school head.
 * - student: Read-only access to their own academics and school life.
 * - parent: Read-only access to their children's records and school communications.
 * The first authenticated user for a school is auto-bootstrapped as school_admin.
 */
export const ROLE_TEMPLATES: Record<string, { name: string; description: string; permissions: string[] }> = {
  school_admin: {
    name: 'School Admin',
    description: 'Full access to every module and setting of the school.',
    permissions: ['*'],
  },
  principal: {
    name: 'Principal',
    description: 'Full operational access across every module — people, academics, attendance, finance, operations, engagement and governance.',
    permissions: [
      // People
      'students:read', 'students:write',
      'admissions:read', 'admissions:write',
      'staff:read', 'staff:write',
      'hr:read', 'hr:write',
      // Academic operations
      'academics:read', 'academics:write',
      'attendance:read', 'attendance:write',
      'exams:read', 'exams:write',
      'homework:read', 'homework:write',
      // Finance
      'fees:read', 'fees:write',
      'payments:read', 'payments:write',
      'finance:read', 'finance:write',
      'expenses:read', 'expenses:write',
      'budgets:read', 'budgets:write',
      'payroll:read', 'payroll:write',
      // Operations
      'library:read', 'library:write',
      'transport:read', 'transport:write',
      'hostel:read', 'hostel:write',
      'inventory:read', 'inventory:write',
      'facilities:read', 'facilities:write',
      // Engagement
      'communications:read', 'communications:write',
      'announcements:read', 'announcements:write',
      'events:read', 'events:write',
      // Governance
      'reports:read',
      'settings:read', 'settings:write',
      'users:read', 'users:write',
      'audit:read',
      'documents:read', 'documents:write',
    ],
  },
  student: {
    name: 'Student',
    description: 'Read-only access to their own academics, attendance, exams, homework and school announcements.',
    permissions: [
      'academics:read',
      'attendance:read',
      'exams:read',
      'homework:read',
      'events:read',
      'announcements:read',
      'communications:read',
    ],
  },
  parent: {
    name: 'Parent',
    description: "Read-only access to their children's records, attendance, academics, fees and school communications.",
    permissions: [
      'students:read',
      'academics:read',
      'attendance:read',
      'exams:read',
      'homework:read',
      'fees:read',
      'payments:read',
      'events:read',
      'announcements:read',
      'communications:read',
    ],
  },
}

/** Maps a role key (as stored in `staff_roles.role`) to its display template. */
export function roleTemplate(role: string) {
  return ROLE_TEMPLATES[role] ?? null
}
