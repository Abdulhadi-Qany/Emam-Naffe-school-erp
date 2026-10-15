import { documentInstances } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: documentInstances,
  module: 'engagement',
  label: 'Certificate',
  requiredFields: ['title', 'entityType'],
  uniqueFields: [],
  searchableFields: ['title', 'serialNumber'],
  filterFields: ['status', 'entityType'],
  sortableFields: ['createdAt'],
  softDelete: null,
  readPermission: 'documents:read' as const,
  writePermission: 'documents:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
