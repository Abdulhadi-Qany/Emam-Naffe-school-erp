import { documentInstances } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: documentInstances,
  module: 'settings',
  label: 'Translation',
  searchableFields: ['name'],
  softDelete: null,
  readPermission: 'settings:read' as const,
  writePermission: 'settings:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
