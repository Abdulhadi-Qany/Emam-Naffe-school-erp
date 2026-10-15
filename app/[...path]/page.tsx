import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { AppLayout } from '@/components/layout/app-layout'
import { ErpRoutePage } from '@/components/erp/erp-route-page'
import { findErpRoute } from '@/lib/erp/navigation'

export const dynamic = 'force-dynamic'

export default async function ErpPage({
  params,
}: {
  params: Promise<{ path: string[] }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const { path } = await params
  const routePath = `/${path.join('/')}`
  const route = findErpRoute(routePath)

  return (
    <AppLayout>
      <ErpRoutePage route={route} />
    </AppLayout>
  )
}
