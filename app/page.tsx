import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { AppLayout } from '@/components/layout/app-layout'
import { DashboardOverview } from '@/components/dashboard-overview'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  return (
    <AppLayout>
      <DashboardOverview />
    </AppLayout>
  )
}
