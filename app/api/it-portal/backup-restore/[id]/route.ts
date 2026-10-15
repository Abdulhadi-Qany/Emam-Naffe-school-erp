import { systemBackups } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: systemBackups,
  module: 'settings',
  label: 'Backup',
  softDelete: null,
  readPermission: 'settings:read' as const,
  writePermission: 'settings:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
