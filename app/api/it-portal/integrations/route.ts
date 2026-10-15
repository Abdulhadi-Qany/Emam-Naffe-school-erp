import { integrations } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: integrations,
  module: 'settings',
  label: 'Integration',
  requiredFields: ['name', 'provider'],
  uniqueFields: ['name'],
  searchableFields: ['name', 'provider'],
  filterFields: ['status', 'type'],
  sortableFields: ['createdAt'],
  softDelete: null,
  readPermission: 'settings:read' as const,
  writePermission: 'settings:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
