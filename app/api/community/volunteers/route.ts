import { communityVolunteers } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: communityVolunteers,
  module: 'engagement',
  label: 'Volunteer',
  requiredFields: ['name'],
  uniqueFields: [],
  searchableFields: ['name', 'phone', 'email', 'role'],
  filterFields: ['screeningStatus'],
  sortableFields: ['name'],
  softDelete: null,
  readPermission: 'events:read' as const,
  writePermission: 'events:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST