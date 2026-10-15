'use client'

import { useState } from 'react'
import { X, Check, AlertCircle } from 'lucide-react'

interface FormField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'email' | 'tel'
  required?: boolean
  options?: string[]
  placeholder?: string
  readOnly?: boolean
}

interface EntityFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  fields: FormField[]
  initialData?: Record<string, unknown>
  title: string
  submitLabel?: string
}

export function EntityFormModal({
  isOpen,
  onClose,
  onSubmit,
  fields,
  initialData = {},
  title,
  submitLabel = 'Save',
}: EntityFormModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  value={(formData[field.key] as string) ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  readOnly={field.readOnly}
                  className="w-full rounded-lg border border-[#e8eaf1] px-3 py-2 text-sm outline-none focus:border-[#625bd0] dark:border-slate-700 dark:bg-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
              ) : field.type === 'select' ? (
                <select
                  value={(formData[field.key] as string) ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full rounded-lg border border-[#e8eaf1] px-3 py-2 text-sm outline-none focus:border-[#625bd0] dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={(formData[field.key] as boolean) ?? false}
                  onChange={(e) => handleChange(field.key, e.target.checked)}
                  className="rounded"
                />
              ) : (
                <input
                  type={field.type}
                  value={(formData[field.key] as string) ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  readOnly={field.readOnly}
                  className="w-full rounded-lg border border-[#e8eaf1] px-3 py-2 text-sm outline-none focus:border-[#625bd0] dark:border-slate-700 dark:bg-slate-800 disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
              )}
            </div>
          ))}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#625bd0] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Check size={16} />
              {submitting ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}