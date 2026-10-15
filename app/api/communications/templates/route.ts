import { communicationTemplates } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: communicationTemplates,
  module: 'engagement',
  label: 'Template',
  requiredFields: ['name', 'body'],
  uniqueFields: ['name'],
  searchableFields: ['name', 'subject', 'body'],
  filterFields: ['channel', 'language'],
  sortableFields: ['name'],
  softDelete: null,
  readPermission: 'communications:read' as const,
  writePermission: 'communications:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
