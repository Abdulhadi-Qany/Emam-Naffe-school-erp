import { transportAttendance } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: transportAttendance,
  module: 'transport',
  label: 'Attendance',
  requiredFields: ['date'],
  searchableFields: ['description'],
  readPermission: 'transport:read' as const,
  writePermission: 'transport:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
