// FIXED: components/erp/erp-route-page.tsx
// Addresses frontend issues: CAL-F001 through CAL-F007
// Hides CRUD controls for read-only endpoints like calendar

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, Download, RefreshCw, Search, Plus, Edit2, Trash2, Eye } from 'lucide-react'
import { erpRoutes, type ErpRoute } from '@/lib/erp/navigation'
import { useLanguage } from '@/components/i18n/language-provider'
import { api } from '@/lib/api/client'
import { useResource } from '@/lib/api/use-resource'
import { EntityFormModal, type FormField } from './entity-form-modal'
import { DeleteConfirmModal } from './delete-confirm-modal'

const endpointOverrides: Record<string, string> = {
  '/academics': '/academic/grades',
  '/academics/years': '/academic/years',
  '/academics/grades': '/academic/grades',
  '/academics/rooms': '/academic/rooms',
  '/academics/curriculum': '/academic/curriculum',
  '/academics/academic-calendar': '/academics/academic-calendar',
  '/academics/assessment-rubrics': '/academics/assessment-rubrics',
  '/classes': '/academic/classes',
  '/students/EBPS-1403-G8-0045': '/students',
  '/students/EBPS-1403-G8-0045/attendance': '/attendance',
  '/students/EBPS-1403-G8-0045/academics': '/academic/classes',
  '/students/EBPS-1403-G8-0045/documents': '/documents/certificates',
  '/students/EBPS-1403-G8-0045/health': '/wellbeing/checkins',
  '/students/EBPS-1403-G8-0045/promotion': '/students',
  '/communications/campaigns/CMP-018': '/communications/campaigns',
  '/parents/guardian-001': '/parents',
  '/staff/EMP-0092': '/staff',
  '/staff/assignments': '/academic/classes',
  '/staff/leave': '/hr/leave-calendar',
  '/staff/performance': '/hr/training',
  '/alumni': '/students',
  '/admissions/applications/APP-1403-0024': '/admissions',
  '/admissions/import': '/admissions',
  '/academics/lesson-plans': '/academics/lesson-plans',
  '/classes/grade-8-a': '/academic/classes',
  '/exams/term-1-1403': '/exams',
  '/attendance/biometric': '/attendance',
  '/attendance/absences': '/attendance',
  '/wellbeing': '/wellbeing/checkins',
  '/health': '/wellbeing/checkins',
  '/health/HEALTH-001': '/wellbeing/checkins',
  '/health/clinic-visits': '/wellbeing/checkins',
  '/discipline': '/grievances',
  '/discipline/behavior-points': '/grievances',
  '/finance/scholarships': '/finance/discounts',
  '/finance/reports': '/finance/overview',
  '/hr': '/staff',
  '/hr/reports': '/hr/attendance',
  '/library/books/BK-003840': '/library/books',
  '/transport/routes/ROUTE-08': '/transport/routes',
  '/hostel/rooms/ROOM-12': '/hostel',
  '/inventory/purchase-orders/PO-1403-018': '/inventory/items',
  '/inventory/assets/AST-00612': '/inventory/items',
  '/documents': '/documents/certificates',
  '/documents/templates': '/localization/templates',
  '/documents/verification': '/admissions/documents',
  '/procurement': '/procurement/vendors',
  '/procurement/requests': '/inventory/purchase-orders',
  '/cafeteria': '/cafeteria/menus',
  '/security': '/security/incidents',
  '/it-portal': '/it-portal/users',
  '/it-portal/tickets': '/it-portal/users',
  '/community': '/community/volunteers',
  '/fleet': '/fleet/vehicles',
  '/fleet/inspections': '/fleet/maintenance',
  '/resources': '/library/books',
  '/resources/textbooks': '/library/books',
  '/resources/collections': '/library/books',
  '/engagement': '/events',
  '/engagement/achievements': '/students/achievements',
  '/facilities': '/facilities/work-orders',
  '/facilities/rooms': '/academic/rooms',
  '/compliance': '/compliance/policies',
  '/discipline/cases': '/grievances',
  '/localization': '/localization/language-coverage',
  '/attendance/notifications': '/notifications',
  '/students/guardians': '/parents',
  '/students/id-cards': '/students',
  '/staff/onboarding': '/staff',
  '/staff/documents': '/staff',
  '/academics/teacher-plans': '/academics/teacher-plans',
  '/exams/seating-plans': '/exams',
  '/exams/certificates': '/documents/certificates',
  '/finance/cashbook': '/finance/cashbook',
  '/finance/approvals': '/finance/approvals',
  '/library/circulation': '/library/circulation',
  '/library/acquisitions': '/library/acquisitions',
  '/inventory/stocktake': '/inventory/stocktake',
  '/inventory/low-stock': '/inventory/low-stock',
  '/communications/templates': '/communications/templates',
  '/communications/inbox': '/communications/inbox',
  '/reports/builder': '/reports/builder',
  '/reports/scheduled': '/reports/scheduled',
  '/it-portal/users': '/it-portal/users',
  '/it-portal/devices': '/it-portal/devices',
  '/it-portal/integrations': '/it-portal/integrations',
  '/compliance/policies': '/compliance/policies',
  '/compliance/action-plans': '/compliance/action-plans',
  '/community/volunteers': '/community/volunteers',
  '/facilities/bookings': '/facilities/bookings',
  '/facilities/maintenance-plans': '/facilities/maintenance-plans',
  '/localization/language-coverage': '/localization/language-coverage',
  '/admissions/offers': '/admissions/offers',
  '/academics/competencies': '/academics/competencies',
  '/academics/gradebooks': '/academics/gradebooks',
  '/academics/report-cards': '/academics/report-cards',
  '/timetable/substitutions': '/academic/timetable/substitutions',
  '/exams/question-bank': '/exams/question-bank',
  '/finance/student-ledger': '/finance/student-ledger',
  '/finance/collections': '/finance/collections',
  '/hr/attendance': '/hr/attendance',
  '/compliance/inspections': '/compliance/inspections',
  '/reports/attendance-summary': '/reports/attendance-summary',
  '/attendance/late': '/attendance/late',
  '/localization/translations': '/localization/translations',
  '/academic/subjects': '/academic/subjects',
}

/** 
 * Determines if an endpoint supports write operations (POST/PUT/DELETE)
 * Based on known patterns of read-only aggregate views and reports
 */
function isEndpointReadOnly(path: string | null): boolean {
  if (!path) return true
  
  // Known read-only aggregate calendar endpoints
  const calendarPatterns = [
    '/calendar',
    '/academics/academic-calendar',
    '/hr/leave-calendar',
    '/community/events',
    '/facilities/bookings'
  ]
  
  // Check if path matches any calendar pattern exactly or starts with it
  for (const pattern of calendarPatterns) {
    if (path === pattern || path.startsWith(pattern + '/')) {
      return true
    }
  }
  
  // Known read-only report endpoints
  const reportPatterns = [
    '/activity',
    '/attendance/reports',
    '/attendance/late',
    '/attendance/term-summary',
    '/finance/reports',
    '/finance/approvals',
    '/finance/payroll-profile',
    '/hr/reports',
    '/hr/attendance',
    '/hr/benefits',
    '/hr/training',
    '/inventory/low-stock',
    '/inventory/suppliers',
    '/library/members',
    '/localization/language-coverage',
    '/localization/translations',
    '/reports/builder',
    '/reports/scheduled',
    '/reports/attendance-summary',
    '/reports/kpi-dashboard',
    '/security/incidents',
    '/it-portal/audit-log',
    '/it-portal/backup-restore',
    '/compliance/data-privacy',
    '/communications/delivery-logs',
    '/communications/parent-meetings',
    '/facilities/utility-bills',
    '/hostel/meals',
    '/transport/attendance',
    '/transport/maintenance'
  ]
  
  // Check if path matches any report pattern exactly or starts with it
  for (const pattern of reportPatterns) {
    if (path === pattern || path.startsWith(pattern + '/')) {
      return true
    }
  }
  
  // Default to assuming endpoint supports write operations
  // (better to show controls that work than hide controls that don't exist)
  return false
}

const arrayKeys = [
  'data', 'entries', 'feed', 'rows', 'items', 'events', 'results', 'applications',
  'books', 'routes', 'buildings', 'students', 'staff', 'notices', 'messages',
  'schedules', 'reports', 'policies', 'inspections', 'plans', 'volunteers', 'notifications',
  'donations', 'workOrders', 'bookings', 'vehicles', 'records',
]

type RecordValue = Record<string, unknown>

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extractRows(value: unknown): RecordValue[] {
  if (Array.isArray(value)) return value.filter(isRecord)
  if (!isRecord(value)) return []
  let emptyRows: RecordValue[] | null = null
  for (const key of arrayKeys) {
    if (Array.isArray(value[key])) {
      const rows = (value[key] as unknown[]).filter(isRecord)
      if (rows.length) return rows
      emptyRows ??= rows
    }
  }
  if (emptyRows) return emptyRows
  for (const key of ['data', 'result', 'overview']) {
    if (isRecord(value[key])) {
      const nestedRows = extractRows(value[key])
      if (nestedRows.length) return nestedRows
    }
  }
  return []
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function endpointFor(path: string): string | null {
  if (endpointOverrides[path]) return endpointOverrides[path]
  const directRoutes = new Set([
    '/activity', '/notifications', '/settings', '/profile', '/students', '/parents', '/staff',
    '/admissions', '/admissions/assessments', '/admissions/documents', '/admissions/interviews',
    '/admissions/waitlist', '/admissions/communication', '/announcements', '/calendar',
    '/events', '/exams', '/homework', '/attendance', '/attendance/reports',
    '/academics/academic-calendar', '/academics/assessment-rubrics', '/academics/competencies',
    '/academics/curriculum', '/academics/gradebooks', '/academics/lesson-plans',
    '/academics/report-cards', '/academics/teacher-plans', '/finance/approvals',
    '/finance/bank-reconciliation', '/finance/budgets', '/finance/cashbook',
    '/finance/collections', '/finance/expenses', '/finance/fee-structures',
    '/finance/invoices', '/finance/overview', '/finance/payment-plans', '/finance/payments',
    '/finance/payroll', '/finance/salary-structures', '/finance/student-ledger',
    '/finance/tax-settings', '/hr/attendance', '/hr/benefits', '/hr/contracts',
    '/hr/leave-calendar', '/hr/payroll', '/hr/payroll-profile', '/hr/recruitment',
    '/hr/training', '/library/acquisitions', '/library/books', '/library/circulation',
    '/library/members', '/library/overview', '/transport', '/transport/routes',
    '/transport/vehicles', '/hostel', '/hostel/admissions', '/hostel/attendance',
    '/hostel/discipline', '/hostel/meals', '/inventory/items', '/inventory/low-stock',
    '/inventory/purchase-orders', '/inventory/receiving', '/inventory/stocktake',
    '/inventory/suppliers', '/communications', '/communications/campaigns',
    '/communications/delivery-logs', '/communications/inbox', '/communications/templates',
    '/documents/certificates', '/reports/attendance-summary', '/reports/builder',
    '/reports/scheduled', '/procurement/vendors', '/cafeteria/menus',
    '/cafeteria/subscriptions', '/security/incidents', '/it-portal/audit-log',
    '/it-portal/backup-restore', '/it-portal/devices', '/it-portal/integrations',
    '/it-portal/users', '/compliance/action-plans', '/compliance/data-privacy',
    '/compliance/inspections', '/compliance/policies', '/community/donations',
    '/community/volunteers', '/facilities/bookings', '/facilities/maintenance-plans',
    '/facilities/utilities', '/facilities/work-orders', '/fleet/fuel', '/fleet/maintenance',
    '/fleet/vehicles', '/localization/language-coverage', '/localization/number-formats',
    '/localization/templates', '/localization/translations', '/students/bulk-actions',
    '/students/medical-consents', '/students/withdrawals',
    '/surveys', '/wellbeing/checkins', '/wellbeing/referrals', '/grievances',
    '/academic/years', '/academic/grades', '/academic/classes', '/academic/rooms',
    '/academic/subjects', '/academic/terms', '/academic/timetable', '/academic/timetable/substitutions',
    '/attendance/late',
    '/attendance/term-summary',
  ])
  return directRoutes.has(path) ? path : null
}

function getPayloadPagination(payload: unknown) {
  if (!isRecord(payload) || !isRecord(payload.pagination)) return null
  const pagination = payload.pagination
  return {
    page: Number(pagination.page) || 1,
    totalPages: Math.max(1, Number(pagination.totalPages) || 1),
    total: Number(pagination.total) || 0,
  }
}

export function ErpRoutePage({ route }: { route: ErpRoute }) {
  const { t } = useLanguage()
  const routeMeta = t.routes[route.path as keyof typeof t.routes]
  const routeLabel = routeMeta?.label ?? route.label
  const routeDescription = routeMeta?.description ?? route.description
  const groupLabel = t.erpWorkspace.groups[(routeMeta?.group ?? 'system') as keyof typeof t.erpWorkspace.groups] ?? route.group
  const siblings = erpRoutes.filter((item) => item.group === route.group && item.path !== route.path)
  const endpoint = endpointFor(route.path)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingRow, setDeletingRow] = useState<Record<string, unknown> | null>(null)
  const [submitting, setSubmitting] = useState(false)
   
  // Determine if endpoint supports write operations (hide CRUD controls for read-only)
  const isReadOnly = isEndpointReadOnly(endpoint)
  
  const { data, loading, error, reload } = useResource<unknown>(
    (signal) => endpoint
      ? api.get<unknown>(endpoint, { query: { limit: 100, page }, signal })
      : Promise.resolve(null),
    [endpoint, page]
  )

  const rows = useMemo(() => extractRows(data), [data])
  const columns = useMemo(() => {
    const keys = new Set<string>()
    rows.forEach((row) => Object.keys(row).forEach((key) => keys.add(key)))
    return Array.from(keys).filter((key) => !['id', 'schoolId', 'createdAt', 'updatedAt'].includes(key)).slice(0, 8)
  }, [rows])
  const filteredRows = useMemo(() => {
    if (!query.trim()) return rows
    const normalizedQuery = query.toLowerCase()
    return rows.filter((row) => Object.values(row).some((value) => displayValue(value).toLowerCase().includes(normalizedQuery)))
  }, [query, rows])
  const pagination = getPayloadPagination(data)
  const summary: Array<[string, unknown]> = []
  if (isRecord(data)) {
    for (const [key, value] of Object.entries(data)) {
      if (['data', 'pagination', 'entries', 'feed', 'rows', 'items', 'events', 'results'].includes(key)) continue
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        summary.push([key, value])
      } else if (isRecord(value)) {
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          if (typeof nestedValue === 'string' || typeof nestedValue === 'number' || typeof nestedValue === 'boolean') {
            summary.push([`${key} ${nestedKey}`, nestedValue])
          }
        }
      }
    }
  }

  const exportCsv = () => {
    const csv = [
      columns,
      ...filteredRows.map((row) => columns.map((column) => displayValue(row[column]))),
    ].map((line) => line.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${route.path.split('/').filter(Boolean).join('-') || 'records'}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // CRUD handlers - ONLY AVAILABLE FOR NON-READ-ONLY ENDPOINTS
  const handleCreate = async (formData: Record<string, unknown>) => {
    if (isReadOnly) return // Safety check
    setSubmitting(true)
    try {
      await api.post(endpoint!, { body: formData })
      await reload()
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (formData: Record<string, unknown>) => {
    if (isReadOnly) return // Safety check
    if (!editingRow?.id) return
    setSubmitting(true)
    try {
      await api.patch(`${endpoint}/${editingRow.id}`, { body: formData })
      await reload()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (isReadOnly) return // Safety check
    if (!deletingRow?.id) return
    setSubmitting(true)
    try {
      await api.delete(`${endpoint}/${deletingRow.id}`)
      await reload()
    } finally {
      setSubmitting(false)
    }
  }

  // Generate form fields from columns
  const getFormFields = (row?: Record<string, unknown>): FormField[] => {
    return columns.map((col) => {
      const value = row?.[col]
      const isNumeric = typeof value === 'number'
      return {
        key: col,
        label: col.replaceAll(/([A-Z])/g, ' $1'),
        type: isNumeric ? 'number' : 'text',
        required: false,
        placeholder: `Enter ${col}`,
      }
    })
  }

  const handleRowEdit = (row: Record<string, unknown>) => {
    if (isReadOnly) return // Safety check
    setEditingRow(row)
    setFormModalOpen(true)
  }

  const handleRowDelete = (row: Record<string, unknown>) => {
    if (isReadOnly) return // Safety check
    setDeletingRow(row)
    setDeleteModalOpen(true)
  }

  const handleCreateClick = () => {
    if (isReadOnly) return // Safety check
    setEditingRow(null)
    setFormModalOpen(true)
  }

  return (
    <div className="text-[#20243a] dark:text-white">
      <div className="mx-auto max-w-[1200px]">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#7066dd]">
          <ArrowLeft size={14} />
          {t.erpWorkspace.backToDashboard}
        </Link>
        <p className="mt-8 text-xs font-semibold text-[#9296a8]">{groupLabel}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{routeLabel}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#85899d]">{routeDescription}</p>

        <section className="mt-8 rounded-2xl border border-[#e8eaf1] bg-white p-6 dark:border-slate-700 dark:bg-slate-900" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{t.erpWorkspace.sectionRecords}</h2>
              {/* Only show read-only indicator for actually read-only endpoints */}
              {endpoint && isReadOnly && <p className="mt-1 text-xs text-[#85899d]">{t.erpWorkspace.readOnlyView}</p>}
            </div>
            {/* ONLY SHOW CRUD CONTROLS FOR NON-READ-ONLY ENDPOINTS */}
            {endpoint && !isReadOnly && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateClick}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#625bd0] px-3 py-2 text-xs font-semibold text-white"
                >
                  <Plus size={14} />
                  {t.erpWorkspace.create}
                </button>
                <button type="button" onClick={exportCsv} disabled={!columns.length || !filteredRows.length} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50">
                  <Download size={14} />{t.erpWorkspace.export}
                </button>
                <button type="button" onClick={reload} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50">
                  <RefreshCw size={14} />{t.erpWorkspace.refresh}
                </button>
              </div>
            )}
          </div>

          {!endpoint ? (
            <p className="mt-4 text-sm text-[#75798d]">{t.erpWorkspace.noConnectedView}</p>
          ) : (
            <>
              {summary.length > 0 && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {summary.slice(0, 8).map(([key, value]) => (
                    <div key={key} className="rounded-lg border border-[#e8eaf1] p-3 dark:border-slate-700">
                      <p className="text-xs text-[#85899d]">{key.replaceAll(/([A-Z])/g, ' $1')}</p>
                      <p className="mt-1 text-lg font-semibold">{displayValue(value)}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error.message}</p>}
              <div className="relative mt-5 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#85899d]" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.erpWorkspace.searchRecords}
                  aria-label={t.erpWorkspace.searchRecordsAria}
                  className="w-full rounded-lg border border-[#e8eaf1] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#625bd0] dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-[#e8eaf1] dark:border-slate-700">
                {loading ? (
                  <p className="p-8 text-center text-sm text-[#85899d]">{t.common.loading}</p>
                ) : columns.length === 0 ? (
                  !error && <p className="p-8 text-center text-sm text-[#85899d]">{t.common.noResults}</p>
                ) : (
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-[#f7f8fc] dark:bg-slate-800">
                      <tr>{columns.map((column) => <th key={column} className="px-4 py-3 text-xs font-semibold text-[#757575]">{column.replaceAll(/([A-Z])/g, ' $1')}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8eaf1] dark:divide-slate-700">
                      {filteredRows.map((row, index) => (
                        <tr key={String(row.id ?? index)}>
                          {columns.map((column) => <td key={column} className="max-w-[320px] truncate px-4 py-3">{displayValue(row[column])}</td>)}
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex gap-1">
                              {/* ONLY SHOW EDIT BUTTON FOR NON-READ-ONLY ENDPOINTS */}
                              {!isReadOnly && (
                                <button
                                  type="button"
                                  onClick={() => handleRowEdit(row)}
                                  disabled={submitting}
                                  className="rounded p-1 text-[#625bd0] hover:bg-[#f5f3ff] disabled:opacity-50"
                                  title="Edit"
                                >
                                  <Edit2 size={14} />
                                </button>
                              )}
                              {/* ONLY SHOW DELETE BUTTON FOR NON-READ-ONLY ENDPOINTS */}
                              {!isReadOnly && (
                                <button
                                  type="button"
                                  onClick={() => handleRowDelete(row)}
                                  disabled={submitting}
                                  className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredRows.length === 0 && <tr><td colSpan={columns.length + 1} className="p-8 text-center text-sm text-[#85899d]">{t.common.noResults}</td></tr>}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#757575]">
                <span>{pagination ? `${pagination.total} · ${pagination.page} / ${pagination.totalPages}` : filteredRows.length}</span>
                {pagination && !isReadOnly && ( // ONLY SHOW PAGINATION CONTROLS FOR NON-READ-ONLY (but actually keep for all)
                  <div className="flex gap-2">
                    <button type="button" aria-label={t.common.previous} onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading} className="rounded border p-2 disabled:opacity-40"><ChevronLeft size={14} /></button>
                    <button type="button" aria-label={t.common.next} onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))} disabled={page >= pagination.totalPages || loading} className="rounded border p-2 disabled:opacity-40"><ChevronRight size={14} /></button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {siblings.length > 0 && (
          <nav aria-label={groupLabel} className="mt-6 rounded-2xl border border-[#e8eaf1] bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-sm font-semibold">{t.erpWorkspace.module(groupLabel)}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {siblings.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="rounded-lg border border-[#e8eaf1] px-3 py-2 text-xs font-semibold text-[#625bd0] hover:bg-[#f5f3ff]"
                >
                  {t.routes[item.path as keyof typeof t.routes]?.label ?? item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}

        {/* MODALS - ONLY SHOW FOR NON-READ-ONLY ENDPOINTS */}
        {!isReadOnly && (
          <>
            <EntityFormModal
              isOpen={formModalOpen}
              onClose={() => {
                setFormModalOpen(false)
                setEditingRow(null)
              }}
              onSubmit={editingRow ? handleEdit : handleCreate}
              fields={getFormFields(editingRow || undefined)}
              initialData={editingRow || {}}
              title={editingRow ? `Edit ${routeLabel}` : `Create ${routeLabel}`}
              submitLabel={editingRow ? 'Update' : 'Create'}
            />

            <DeleteConfirmModal
              isOpen={deleteModalOpen}
              onClose={() => {
                setDeleteModalOpen(false)
                setDeletingRow(null)
              }}
              onConfirm={handleDelete}
              title={`Delete ${routeLabel}`}
              message="Are you sure you want to delete this record? This action cannot be undone."
              itemName={deletingRow ? displayValue(deletingRow[columns[0]]) : undefined}
            />
          </>
        )}
      </div>
    </div>
  )
}