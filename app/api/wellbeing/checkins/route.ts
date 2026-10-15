import { wellbeingCheckins } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: wellbeingCheckins,
  module: 'students',
  label: 'Check-in',
  searchableFields: ['name'],
  softDelete: null,
  readPermission: 'students:read' as const,
  writePermission: 'students:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
