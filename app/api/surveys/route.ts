import { surveys } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: surveys,
  module: 'engagement',
  label: 'Survey',
  requiredFields: ['title'],
  uniqueFields: [],
  searchableFields: ['title', 'description'],
  filterFields: ['surveyType', 'isActive'],
  sortableFields: ['startDate', 'title'],
  softDelete: null,
  readPermission: 'communications:read' as const,
  writePermission: 'communications:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST