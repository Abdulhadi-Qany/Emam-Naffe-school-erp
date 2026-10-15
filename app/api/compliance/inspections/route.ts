import { complianceInspections } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: complianceInspections,
  module: 'settings',
  label: 'Inspection',
  requiredFields: ['title'],
  uniqueFields: [],
  searchableFields: ['title', 'inspector'],
  filterFields: ['status'],
  sortableFields: ['createdAt'],
  softDelete: null,
  readPermission: 'settings:read' as const,
  writePermission: 'settings:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
