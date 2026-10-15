import { transportAssignments } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: transportAssignments,
  module: 'transport',
  label: 'Assignment',
  requiredFields: ['routeId', 'studentId'],
  uniqueFields: [],
  searchableFields: ['stopName'],
  filterFields: ['routeId', 'isActive', 'studentId'],
  sortableFields: ['createdAt'],
  softDelete: null,
  readPermission: 'transport:read' as const,
  writePermission: 'transport:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
