'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, Check, Download, Filter, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import Link from 'next/link'
import { ErpRoute } from '@/lib/erp/navigation'
import { listRecords, createRecord, deleteRecord } from '@/app/actions/erp'

/**
 * Live ERP workspace.
 *
 * Every route rendered by `app/[...path]/page.tsx` lands here. The page is fully
 * wired to the backend server actions in `app/actions/erp.ts`, which persist to
 * the `erp_records` table (module-scoped CRUD store) with per-module RBAC.
 *
 *   list  → listRecords(module, { query, page, pageSize })
 *   add   → createRecord({ module, title, reference, status, data })
 *   del   → deleteRecord(id)
 */

interface ErpRecord {
  id: string
  title: string
  reference: string
  status: string | null
  data: Record<string, unknown> | null
  createdAt: Date | string
}

const statuses = ['Active', 'Pending review', 'Verified', 'Needs attention']

const kindLabels: Record<ErpRoute['kind'], string> = {
  directory: 'Directory workspace',
  detail: 'Record detail',
  workflow: 'Workflow workspace',
  report: 'Reporting workspace',
  calendar: 'Planning workspace',
  settings: 'Configuration workspace',
}

/** Route path → erp_records module key (validated server-side as [a-z0-9/_-]). */
function moduleFromPath(route: ErpRoute): string {
  const raw = route.path.replace(/^\/+/, '').toLowerCase()
  return /^[a-z0-9][a-z0-9/_-]*$/.test(raw) ? raw : route.group.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

export function ErpRoutePage({ route }: { route: ErpRoute }) {
  const module = useMemo(() => moduleFromPath(route), [route])
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [activeSection, setActiveSection] = useState(route.kind === 'detail' ? 'Overview' : 'Records')
  const [selected, setSelected] = useState<string[]>([])

  const [rows, setRows] = useState<ErpRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [reference, setReference] = useState('')
  const [status, setStatus] = useState('Active')
  const [notes, setNotes] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listRecords(module, { page: 1, pageSize: 100 })
      setRows(res.rows as unknown as ErpRecord[])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to load records')
    } finally {
      setLoading(false)
    }
  }, [module])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(
    () =>
      rows.filter((row) =>
        `${row.title} ${row.reference} ${row.status ?? ''}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [rows, query],
  )

  const notify = (text: string) => {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 2400)
  }
  const toggle = (ref: string) =>
    setSelected((cur) => (cur.includes(ref) ? cur.filter((r) => r !== ref) : [...cur, ref]))

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || !reference.trim()) {
      notify('Name and reference are required')
      return
    }
    setSaving(true)
    try {
      await createRecord({
        module,
        title: title.trim(),
        reference: reference.trim(),
        status,
        data: notes.trim() ? { notes: notes.trim() } : {},
      })
      setShowForm(false)
      setTitle('')
      setReference('')
      setNotes('')
      notify('Record saved successfully')
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Could not save record')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteRecord(id)
      notify('Record deleted successfully')
      setSelected((cur) => cur.filter((r) => r !== id))
      await load()
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Could not delete record')
    }
  }

  function exportCsv() {
    const header = 'Reference,Name,Status\n'
    const body = visible.map((r) => `"${r.reference}","${r.title}","${r.status ?? ''}"`).join('\n')
    const blob = new Blob([header + body], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${module.replace(/\//g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    notify('Export prepared')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{route.label}</h1>
          <p className="mt-1 text-sm text-slate-500">{kindLabels[route.kind]} · {route.group}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export
          </button>
          <button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            <Plus className="h-4 w-4" /> New record
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss" className="text-emerald-600 hover:text-emerald-900"><X className="h-4 w-4" /></button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error} <button type="button" onClick={() => void load()} className="ml-2 font-semibold underline">Retry</button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search records…" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <SlidersHorizontal className="h-4 w-4" />
          {selected.length > 0 && <span className="font-medium text-slate-700">{selected.length} selected</span>}
          <Filter className="h-4 w-4" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-10 px-4 py-3" />
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (<tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Loading records…</td></tr>)}
            {!loading && visible.length === 0 && (<tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No records yet. Create your first record to get started.</td></tr>)}
            {!loading && visible.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggle(row.id)} className="h-4 w-4 rounded border-slate-300" />
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{row.reference}</td>
                <td className="px-4 py-3 text-slate-700">{row.title}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    <Check className="h-3 w-3" /> {row.status ?? 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => void handleDelete(row.id)} className="text-rose-600 hover:text-rose-800" aria-label={`Delete ${row.reference}`}>
                    <X className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={handleCreate} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">New {route.label} record</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Name *</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={180} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500" placeholder="e.g. Grade 5 timetable" />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Reference *</span>
              <input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={180} required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500" placeholder="e.g. TTB-001" />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500">
                {statuses.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Notes</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500" placeholder="Optional details…" />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
                <Check className="h-4 w-4" /> {saving ? 'Saving…' : 'Save record'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

