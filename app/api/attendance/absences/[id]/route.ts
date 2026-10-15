import { absenceRequests } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: absenceRequests,
  module: 'attendance',
  label: 'Absence request',
  softDelete: null,
  readPermission: 'attendance:read' as const,
  writePermission: 'attendance:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
