import { compliancePolicies } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: compliancePolicies,
  module: 'settings',
  label: 'Policy',
  requiredFields: ['title', 'category'],
  uniqueFields: ['title'],
  searchableFields: ['title', 'category', 'owner'],
  filterFields: ['status', 'category'],
  sortableFields: ['createdAt'],
  softDelete: null,
  readPermission: 'settings:read' as const,
  writePermission: 'settings:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
