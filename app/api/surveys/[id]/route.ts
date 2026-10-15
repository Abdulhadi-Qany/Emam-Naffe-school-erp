import { surveys } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: surveys,
  module: 'engagement',
  label: 'Survey',
  softDelete: null,
  readPermission: 'communications:read' as const,
  writePermission: 'communications:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE