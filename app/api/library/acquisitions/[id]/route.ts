import { assets } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: assets,
  module: 'library',
  label: 'Acquisition',
  softDelete: null,
  readPermission: 'library:read' as const,
  writePermission: 'library:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
