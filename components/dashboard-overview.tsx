'use client'

import { useEffect, useState } from 'react'
import { Users, CalendarCheck, CircleDollarSign, UserCog, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api/client'
import { useLanguage } from '@/components/i18n/language-provider'

interface OverviewTotals {
  students: number
  newStudents: number
  staff: number
  staffOnCampus: number
  hostelResidents: number
  collections: number
  paymentsCount: number
  outstanding: number
  overdueAmount: number
  overdueInvoices: number
  pendingAdmissions: number
  pendingLeave: number
  attendance: {
    present: number
    attended: number
    late: number
    absent: number
    marked: number
    rate: number
  }
}

interface OverviewPayload {
  generatedAt: string
  totals: OverviewTotals
}

export function DashboardOverview() {
  const { t } = useLanguage()
  const [data, setData] = useState<OverviewPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = await api.get<OverviewPayload>('/dashboard/overview')
      setData(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading && !data) {
    return (
      <div>
        <p className="text-sm text-[#85899d]">{t.dashboard.loading}</p>
      </div>
    )
  }

  const totals = data?.totals

  const stats = [
    {
      label: t.dashboard.statTotalStudents,
      value: totals?.students ?? 0,
      sub: totals ? t.dashboard.changeThisMonthPlus(String(totals.newStudents)) : '',
      icon: Users,
    },
    {
      label: t.dashboard.statTodayAttendance,
      value: totals ? `${totals.attendance.rate}%` : '0%',
      sub: totals
        ? `${totals.attendance.present}/${totals.attendance.marked} ${t.dashboard.presentLabel.toLowerCase()}`
        : '',
      icon: CalendarCheck,
    },
    {
      label: t.dashboard.statFeeCollection,
      value: totals?.collections ?? 0,
      sub: totals ? `${totals.paymentsCount} ${t.dashboard.changeThisMonth.toLowerCase()}` : '',
      icon: CircleDollarSign,
    },
    {
      label: t.dashboard.statStaffOnCampus,
      value: totals?.staffOnCampus ?? 0,
      sub: totals ? `${totals.staff} ${t.dashboard.changeThisMonth.toLowerCase()}` : '',
      icon: UserCog,
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#20243a] dark:text-white">
            {t.sidebar.overview}
          </h1>
          <p className="mt-1 text-sm text-[#85899d]">{t.dashboard.academicYear}</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-[#e7e9f1] px-3 py-2 text-xs font-semibold text-[#625bd0] hover:bg-[#f5f3ff] disabled:opacity-50 dark:border-slate-700"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : undefined} />
          {t.erpWorkspace.refresh}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#e7e9f1] bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#85899d]">{stat.label}</p>
              <stat.icon size={18} className="text-[#625bd0]" />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-[#20243a] dark:text-white">
              {stat.value}
            </p>
            {stat.sub && <p className="mt-1 text-xs text-[#75798d]">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {totals && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#e7e9f1] bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-[#20243a] dark:text-white">{t.dashboard.actionQueueTitle}</h2>
            <p className="mt-1 text-xs text-[#85899d]">{t.dashboard.actionQueueDescription}</p>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center justify-between">
                <span className="text-sm text-[#625bd0]">{t.dashboard.actionAdmission}</span>
                <span className="rounded-full bg-[#eeedff] px-2 py-0.5 text-xs font-semibold text-[#625bd0]">
                  {totals.pendingAdmissions}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-sm text-[#625bd0]">{t.dashboard.actionLeave}</span>
                <span className="rounded-full bg-[#eeedff] px-2 py-0.5 text-xs font-semibold text-[#625bd0]">
                  {totals.pendingLeave}
                </span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[#e7e9f1] bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-[#20243a] dark:text-white">{t.dashboard.attendanceOverview}</h2>
            <p className="mt-1 text-xs text-[#85899d]">{t.dashboard.attendanceDescription}</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#75798d]">{t.dashboard.presentLabel}</span>
                <span className="font-semibold text-[#20243a] dark:text-white">{totals.attendance.present}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#75798d]">{t.dashboard.absentLabel}</span>
                <span className="font-semibold text-[#20243a] dark:text-white">{totals.attendance.absent}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#75798d]">{t.dashboard.lateLabel}</span>
                <span className="font-semibold text-[#20243a] dark:text-white">{totals.attendance.late}</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-[#e7e9f1] bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-sm font-semibold text-[#20243a] dark:text-white">{t.erpWorkspace.sectionRecords}</h2>
            <p className="mt-1 text-xs text-[#85899d]">{t.erpWorkspace.liveReadOnly}</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#75798d]">{t.dashboard.statStaffOnCampus}</span>
                <span className="font-semibold text-[#20243a] dark:text-white">{totals.staffOnCampus}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#75798d]">{t.sidebar.hostel}</span>
                <span className="font-semibold text-[#20243a] dark:text-white">{totals.hostelResidents}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#75798d]">{t.sidebar.financeOverview}</span>
                <span className="font-semibold text-[#20243a] dark:text-white">{totals.outstanding}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
