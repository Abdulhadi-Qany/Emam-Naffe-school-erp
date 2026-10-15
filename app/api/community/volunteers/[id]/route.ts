import { communityVolunteers } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: communityVolunteers,
  module: 'engagement',
  label: 'Volunteer',
  softDelete: null,
  readPermission: 'events:read' as const,
  writePermission: 'events:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE