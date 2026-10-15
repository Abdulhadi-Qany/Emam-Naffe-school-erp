'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import {
  GraduationCap,
  Users,
  BookOpen,
  CalendarDays,
  FileSpreadsheet,
  ClipboardCheck,
  Library,
  CircleDollarSign,
  UserCog,
  Bus,
  ShieldCheck,
  MessageSquare,
  Megaphone,
  FileText,
  SlidersHorizontal,
  HeartPulse,
  Package,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Settings,
  Bell,
  Search,
  Globe,
  Moon,
  Sun,
  UserRound
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/i18n/language-provider'
import type { Dictionary } from '@/lib/i18n'

const buildModuleGroups = (t: Dictionary) => [
  {
    title: t.sidebar.dashboard,
    items: [
      { href: '/', label: t.sidebar.overview, icon: GraduationCap },
      { href: '/calendar', label: t.sidebar.calendar, icon: CalendarDays },
      { href: '/activity', label: t.sidebar.activity, icon: ClipboardCheck },
    ]
  },
  {
    title: t.sidebar.people,
    items: [
      { href: '/students', label: t.sidebar.students, icon: Users },
      { href: '/students/new', label: t.sidebar.newEnrollment, icon: Users },
      { href: '/parents', label: t.sidebar.guardians, icon: Users },
      { href: '/staff', label: t.sidebar.staff, icon: UserCog },
      { href: '/admissions', label: t.sidebar.admissions, icon: ClipboardCheck },
    ]
  },
  {
    title: t.sidebar.academics,
    items: [
      { href: '/academics', label: t.sidebar.academicManagement, icon: BookOpen },
      { href: '/classes', label: t.sidebar.classes, icon: BookOpen },
      { href: '/academics/subjects', label: t.sidebar.subjects, icon: BookOpen },
      { href: '/timetable', label: t.sidebar.timetable, icon: CalendarDays },
      { href: '/exams', label: t.sidebar.exams, icon: FileSpreadsheet },
      { href: '/homework', label: t.sidebar.homework, icon: BookOpen },
    ]
  },
  {
    title: t.sidebar.attendance,
    items: [
      { href: '/attendance', label: t.sidebar.dailyAttendance, icon: ClipboardCheck },
      { href: '/attendance/reports', label: t.sidebar.reports, icon: FileSpreadsheet },
    ]
  },
  {
    title: t.sidebar.finance,
    items: [
      { href: '/finance', label: t.sidebar.financeOverview, icon: CircleDollarSign },
      { href: '/finance/fee-structures', label: t.sidebar.feeStructures, icon: CircleDollarSign },
      { href: '/finance/invoices', label: t.sidebar.invoices, icon: FileText },
      { href: '/finance/payments', label: t.sidebar.payments, icon: CircleDollarSign },
      { href: '/finance/payroll', label: t.sidebar.payroll, icon: UserCog },
    ]
  },
  {
    title: t.sidebar.operations,
    items: [
      { href: '/library', label: t.sidebar.library, icon: Library },
      { href: '/transport', label: t.sidebar.transport, icon: Bus },
      { href: '/hostel', label: t.sidebar.hostel, icon: ShieldCheck },
      { href: '/inventory', label: t.sidebar.inventory, icon: Package },
    ]
  },
  {
    title: t.sidebar.communication,
    items: [
      { href: '/announcements', label: t.sidebar.announcements, icon: Megaphone },
      { href: '/communications', label: t.sidebar.messages, icon: MessageSquare },
      { href: '/community/events', label: t.sidebar.events, icon: CalendarDays },
    ]
  },
  {
    title: t.sidebar.administration,
    items: [
      { href: '/reports', label: t.sidebar.reports, icon: SlidersHorizontal },
      { href: '/settings', label: t.sidebar.settings, icon: Settings },
    ]
  }
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const { lang, setLang, t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (saved === 'light' || saved === 'dark') setTheme(saved)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0f172a]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 border-r border-[#e7e9f1] bg-white dark:border-slate-700 dark:bg-slate-900 transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-xl bg-[#1B5E20] text-white">
                <GraduationCap size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#20243a] dark:text-white">EBPS</p>
                <p className="text-[10px] text-[#757575] dark:text-slate-400">Emam Bukhari</p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-2">
            {buildModuleGroups(t).map((group) => (
              <div key={group.title} className="mb-4">
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-[#a0a3b3] dark:text-slate-400">
                  {group.title}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                        pathname === item.href
                          ? 'bg-[#eeedff] text-[#625bd0] dark:bg-slate-800 dark:text-slate-200'
                          : 'text-[#777b91] hover:bg-[#f7f7fb] dark:text-slate-300 dark:hover:bg-slate-800'
                      )}
                    >
                      <item.icon size={17} />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-[#e7e9f1] p-3 dark:border-slate-700">
            <p className="text-[10px] text-center text-[#a0a3b3] dark:text-slate-400">
              {t.header.version}
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e7e9f1] bg-white/95 px-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <div>
              <p className="text-xs text-[#a0a3b3] dark:text-slate-400">
                {t.header.schoolName} · {t.header.city}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLang(lang === 'en' ? 'fa' : lang === 'fa' ? 'ps' : 'en')}
              className="text-xs"
              aria-label={t.header.switchLanguage}
              title={t.header.switchLanguage}
            >
              <Globe size={18} />
              <span className="ml-1 hidden sm:inline">{t.language[lang]}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t.header.toggleTheme} title={t.header.toggleTheme}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </Button>
            <Button variant="ghost" size="icon">
              <Bell size={18} />
            </Button>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2"
              >
                <div className="grid size-7 place-items-center rounded-full bg-[#1B5E20] text-xs font-bold text-white">
                  AD
                </div>
                <span className="hidden md:inline text-sm">{t.header.admin}</span>
                <ChevronDown size={14} />
              </Button>
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-[#e7e9f1] bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[#f7f7fb] dark:hover:bg-slate-700"
                    >
                      <UserRound size={14} />
                      {t.header.profile}
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[#f7f7fb] dark:hover:bg-slate-700"
                    >
                      <Settings size={14} />
                      {t.header.settings}
                    </Link>
                     <button
                       onClick={() =>
                         authClient.signOut().then(() => {
                           router.refresh()
                           router.push('/sign-in')
                         })
                       }
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-[#f7f7fb] dark:hover:bg-slate-700"
                    >
                      <LogOut size={14} />
                      {t.header.signOut}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

export default AppLayout
