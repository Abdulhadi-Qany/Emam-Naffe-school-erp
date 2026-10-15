import { dataProcessingRecords } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: dataProcessingRecords,
  module: 'settings',
  label: 'Data processing record',
  softDelete: null,
  readPermission: 'audit:read' as const,
  writePermission: 'settings:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
