import { reportCards } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: reportCards,
  module: 'academics',
  label: 'Report card',
  softDelete: null,
  readPermission: 'reports:read' as const,
  writePermission: 'reports:read' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
