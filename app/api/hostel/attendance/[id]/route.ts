import { hostelAttendance } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: hostelAttendance,
  module: 'hostel',
  label: 'Attendance',
  softDelete: null,
  readPermission: 'hostel:read' as const,
  writePermission: 'hostel:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
