import { cafeteriaMealSubscriptions } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: cafeteriaMealSubscriptions,
  module: 'operations',
  label: 'Meal subscription',
  searchableFields: ['name'],
  readPermission: 'facilities:read' as const,
  writePermission: 'facilities:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
