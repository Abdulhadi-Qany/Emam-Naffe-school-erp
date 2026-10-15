import { securityIncidents } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: securityIncidents,
  module: 'students',
  label: 'Incident',
  requiredFields: ['title'],
  uniqueFields: [],
  searchableFields: ['title', 'description', 'location'],
  filterFields: ['status', 'severity'],
  sortableFields: ['createdAt'],
  softDelete: null,
  readPermission: 'students:read' as const,
  writePermission: 'students:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
