/**
 * Audit logging — writes to the `audit_logs` table (fire-and-forget).
 *
 * Audits power `/api/activity`, `/api/it-portal/audit-log`, change history on
 * student/finance profiles and compliance evidence. A failing audit write must
 * never break the business request, so errors are swallowed and logged.
 */

import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'

export interface AuditEntry {
  schoolId: string
  userId?: string | null
  action: string // created | updated | deleted | approved | rejected | published | ...
  module: string // students | finance | academics | ...
  entityType: string
  entityId: string
  changes?: Record<string, unknown>
  ipAddress?: string | null
  userAgent?: string | null
}

/** Records an audit entry. Never throws. */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      schoolId: entry.schoolId,
      userId: entry.userId ?? null,
      action: entry.action,
      module: entry.module,
      entityType: entry.entityType,
      entityId: entry.entityId,
      changes: entry.changes ?? {},
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    })
  } catch (error) {
    console.error('Audit write failed', { entry, error })
  }
}

/** Best-effort request metadata extraction for audits. */
export function requestMeta(request: Request): { ipAddress: string | null; userAgent: string | null } {
  const forwarded = request.headers.get('x-forwarded-for')
  return {
    ipAddress: forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip'),
    userAgent: request.headers.get('user-agent'),
  }
}

/** Computes a minimal before/after diff for changed fields. */
export function diff(before: Record<string, unknown> | null, after: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!before) return undefined
  const changes: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(after)) {
    if (before[key] !== value) changes[key] = { from: before[key], to: value }
  }
  return Object.keys(changes).length > 0 ? changes : undefined
}
