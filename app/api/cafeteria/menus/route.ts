import { cafeteriaMenus } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: cafeteriaMenus,
  module: 'operations',
  label: 'Menu',
  requiredFields: ['date', 'mealType'],
  uniqueFields: [],
  searchableFields: ['allergenNote'],
  filterFields: ['mealType', 'status'],
  sortableFields: ['date'],
  softDelete: null,
  readPermission: 'facilities:read' as const,
  writePermission: 'facilities:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST