import { studentHealthRecords } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: studentHealthRecords,
  module: 'students',
  label: 'Medical consent',
  searchableFields: ['name'],
  softDelete: null,
  readPermission: 'students:read' as const,
  writePermission: 'students:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
