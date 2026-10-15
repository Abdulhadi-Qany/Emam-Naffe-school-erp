import { staffTrainings } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: staffTrainings,
  module: 'hr',
  label: 'Training',
  searchableFields: ['name'],
  softDelete: null,
  readPermission: 'hr:read' as const,
  writePermission: 'hr:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
