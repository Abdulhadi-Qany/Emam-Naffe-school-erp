import { absenceRequests } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: absenceRequests,
  module: 'attendance',
  label: 'Absence request',
  requiredFields: ['studentId', 'reason'],
  uniqueFields: [],
  searchableFields: ['reason'],
  filterFields: ['status', 'studentId'],
  sortableFields: ['date'],
  softDelete: null,
  readPermission: 'attendance:read' as const,
  writePermission: 'attendance:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
