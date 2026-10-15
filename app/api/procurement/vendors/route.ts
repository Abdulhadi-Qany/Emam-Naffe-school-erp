import { procurementVendors } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: procurementVendors,
  module: 'inventory',
  label: 'Vendor',
  requiredFields: ['name'],
  uniqueFields: ['name'],
  searchableFields: ['name', 'contactName', 'email', 'phone'],
  filterFields: ['isActive'],
  sortableFields: ['name', 'rating'],
  softDelete: 'isActive' as const,
  readPermission: 'inventory:read' as const,
  writePermission: 'inventory:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST