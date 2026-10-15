'use client'

import { Suspense } from 'react'
import { useLanguage } from '@/components/i18n/language-provider'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage()
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20">{t.common.loading}</div>}>
      {children}
    </Suspense>
  )
}
