import { integrations } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: integrations,
  module: 'settings',
  label: 'Integration',
  softDelete: null,
  readPermission: 'settings:read' as const,
  writePermission: 'settings:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
