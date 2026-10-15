import { documentInstances } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: documentInstances,
  module: 'engagement',
  label: 'Certificate',
  softDelete: null,
  readPermission: 'documents:read' as const,
  writePermission: 'documents:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
