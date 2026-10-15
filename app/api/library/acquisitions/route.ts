import { assets } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: assets,
  module: 'library',
  label: 'Acquisition',
  searchableFields: ['name'],
  softDelete: null,
  readPermission: 'library:read' as const,
  writePermission: 'library:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
