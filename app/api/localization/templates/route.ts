import { documentTemplates } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: documentTemplates,
  module: 'settings',
  label: 'Template',
  requiredFields: ['name'],
  uniqueFields: ['name'],
  searchableFields: ['name', 'category'],
  filterFields: ['status', 'category'],
  sortableFields: ['createdAt'],
  softDelete: null,
  readPermission: 'settings:read' as const,
  writePermission: 'settings:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
