import { dataProcessingRecords } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: dataProcessingRecords,
  module: 'settings',
  label: 'Data processing record',
  requiredFields: ['purpose'],
  uniqueFields: [],
  searchableFields: ['purpose', 'lawfulBasis', 'subjectType'],
  filterFields: ['status', 'subjectType'],
  sortableFields: ['createdAt'],
  softDelete: null,
  readPermission: 'audit:read' as const,
  writePermission: 'settings:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
