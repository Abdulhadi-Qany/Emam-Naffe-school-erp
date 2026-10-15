import { complianceActionPlans } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: complianceActionPlans,
  module: 'settings',
  label: 'Action plan',
  requiredFields: ['finding', 'action'],
  uniqueFields: [],
  searchableFields: ['finding', 'action', 'owner'],
  filterFields: ['status'],
  sortableFields: ['createdAt'],
  softDelete: null,
  readPermission: 'settings:read' as const,
  writePermission: 'settings:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
