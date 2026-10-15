import { securityIncidents } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: securityIncidents,
  module: 'students',
  label: 'Incident',
  softDelete: null,
  readPermission: 'students:read' as const,
  writePermission: 'students:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
