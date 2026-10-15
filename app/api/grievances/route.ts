import { grievances } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: grievances,
  module: 'engagement',
  label: 'Grievance',
  requiredFields: ['subject', 'description'],
  uniqueFields: [],
  searchableFields: ['subject', 'description', 'grievanceNumber', 'complainantName'],
  filterFields: ['status', 'priority', 'category'],
  sortableFields: ['createdAt', 'priority'],
  softDelete: null,
  readPermission: 'communications:read' as const,
  writePermission: 'communications:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST