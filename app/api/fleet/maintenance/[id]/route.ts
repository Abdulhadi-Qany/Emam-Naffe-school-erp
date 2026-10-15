import { vehicleMaintenance } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: vehicleMaintenance,
  module: 'transport',
  label: 'Maintenance',
  readPermission: 'transport:read' as const,
  writePermission: 'transport:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
