import { bankReconciliations } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: bankReconciliations,
  module: 'finance',
  label: 'Reconciliation',
  softDelete: null,
  readPermission: 'payments:read' as const,
  writePermission: 'payments:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
