import { procurementVendors } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: procurementVendors,
  module: 'inventory',
  label: 'Vendor',
  softDelete: 'isActive' as const,
  readPermission: 'inventory:read' as const,
  writePermission: 'inventory:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE