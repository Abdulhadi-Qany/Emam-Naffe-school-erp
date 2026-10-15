import { reportSchedules } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: reportSchedules,
  module: 'analytics',
  label: 'Scheduled report',
  requiredFields: ['name', 'cadence'],
  uniqueFields: [],
  searchableFields: ['name'],
  filterFields: ['status', 'cadence'],
  sortableFields: ['nextRunAt'],
  softDelete: null,
  readPermission: 'reports:read' as const,
  writePermission: 'reports:read' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
