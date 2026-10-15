import { messMenus } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: messMenus,
  module: 'hostel',
  label: 'Meal',
  requiredFields: ['date', 'mealType'],
  searchableFields: ['description'],
  readPermission: 'hostel:read' as const,
  writePermission: 'hostel:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
