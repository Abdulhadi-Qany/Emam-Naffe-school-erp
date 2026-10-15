import { portalInvitations } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: portalInvitations,
  module: 'settings',
  label: 'Invitation',
  softDelete: null,
  readPermission: 'settings:read' as const,
  writePermission: 'settings:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
