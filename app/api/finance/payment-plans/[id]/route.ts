import { paymentPlans } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: paymentPlans,
  module: 'finance',
  label: 'Payment plan',
  softDelete: null,
  readPermission: 'fees:read' as const,
  writePermission: 'fees:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
