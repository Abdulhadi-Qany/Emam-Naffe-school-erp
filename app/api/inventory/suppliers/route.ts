import { procurementVendors } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: procurementVendors,
  module: 'inventory',
  label: 'Supplier',
  searchableFields: ['name'],
  readPermission: 'inventory:read' as const,
  writePermission: 'inventory:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
