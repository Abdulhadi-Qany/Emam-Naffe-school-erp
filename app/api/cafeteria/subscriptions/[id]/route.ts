import { cafeteriaMealSubscriptions } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: cafeteriaMealSubscriptions,
  module: 'operations',
  label: 'Meal subscription',
  readPermission: 'facilities:read' as const,
  writePermission: 'facilities:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
