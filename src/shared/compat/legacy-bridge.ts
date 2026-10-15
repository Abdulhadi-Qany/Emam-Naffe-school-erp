/**
 * v1 → Clean Compatibility Bridge.
 *
 * Legacy `app/api/**` routes keep their URLs (frontend compat) but delegate
 * to the Clean lane: container → use-case/repository → CleanPresenter.
 * This removes ALL direct Drizzle imports from v1 route files.
 *
 * Mapping: legacy URL segment → Clean module kind + permission.
 */
import type { ModuleRegistration } from '@/src/shared/crud/GenericModule';
import { MODULE_REGISTRATIONS } from '@/src/shared/crud';

interface LegacyMapping {
  /** Legacy URL prefix, e.g. 'academic/grades' or 'announcements'. */
  legacy: string;
  /** Clean module kind, e.g. 'Grade'. Use null for bespoke handlers. */
  kind: string | null;
  /** Bespoke handler key for staff/students/finance. */
  bespoke?: 'staff' | 'students' | 'invoices';
  permission: string;
}

const KIND_BY_ROUTE = new Map<string, ModuleRegistration>();
for (const r of MODULE_REGISTRATIONS) KIND_BY_ROUTE.set(r.route, r);

/** Resolve a legacy path (relative to app/api) to a Clean target. */
export function resolveLegacy(path: string): LegacyMapping | null {
  const norm = path.replace(/\\/g, '/').replace(/\/\[id\].*$/, '').replace(/\/route\.ts$/, '');
  // Direct route match (e.g. 'announcements' → route 'announcements').
  const direct = KIND_BY_ROUTE.get(norm);
  if (direct) return { legacy: norm, kind: direct.kind, permission: direct.permission };
  // Nested legacy prefixes (e.g. 'academic/grades' → route 'grades').
  const last = norm.split('/').pop()!;
  const byLast = KIND_BY_ROUTE.get(last);
  if (byLast) return { legacy: norm, kind: byLast.kind, permission: byLast.permission };
  // Bespoke aggregates.
  if (norm === 'staff' || norm.startsWith('staff/')) return { legacy: norm, kind: null, bespoke: 'staff', permission: 'staff' };
  if (norm === 'students' || norm.startsWith('students')) return { legacy: norm, kind: null, bespoke: 'students', permission: 'students' };
  if (norm.startsWith('finance')) return { legacy: norm, kind: null, bespoke: 'invoices', permission: 'finance' };
  return null;
}

export function listResolvableLegacyPaths(paths: string[]): Array<{ path: string; mapping: LegacyMapping }> {
  const out: Array<{ path: string; mapping: LegacyMapping }> = [];
  for (const p of paths) {
    const m = resolveLegacy(p);
    if (m) out.push({ path: p, mapping: m });
  }
  return out;
}
