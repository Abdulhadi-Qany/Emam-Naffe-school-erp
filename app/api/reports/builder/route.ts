import { savedReports } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: savedReports,
  module: 'analytics',
  label: 'Report',
  requiredFields: ['name', 'module'],
  uniqueFields: [],
  searchableFields: ['name'],
  filterFields: ['module'],
  sortableFields: ['createdAt'],
  softDelete: null,
  readPermission: 'reports:read' as const,
  writePermission: 'reports:read' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
