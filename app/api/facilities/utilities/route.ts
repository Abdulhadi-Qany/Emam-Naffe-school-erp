import { utilityBills } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: utilityBills,
  module: 'operations',
  label: 'Utility bill',
  searchableFields: ['name'],
  readPermission: 'facilities:read' as const,
  writePermission: 'facilities:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
