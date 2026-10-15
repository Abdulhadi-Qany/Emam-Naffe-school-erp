import { staffTrainings } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: staffTrainings,
  module: 'hr',
  label: 'Training',
  softDelete: null,
  readPermission: 'hr:read' as const,
  writePermission: 'hr:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
