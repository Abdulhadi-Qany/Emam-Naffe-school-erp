import { notFound } from 'next/navigation'
import ErpRoutePage from '@/components/erp/erp-route-page'
import { allErpPaths, findErpRoute } from '@/lib/erp/navigation'

export function generateStaticParams() {
  return allErpPaths.filter((path) => path !== '/404').map((path) => ({ slug: path.split('/').filter(Boolean) }))
}

export default async function ErpPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const path = `/${slug.join('/')}`
  const route = findErpRoute(path)
  if (route.path === '/404') notFound()
  return <ErpRoutePage route={route} />
}
