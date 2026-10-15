import { rooms } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = createReferenceItemRoutes({
  table: rooms,
  module: 'academics',
  label: 'Room',
  uniqueFields: ['name'],
  softDelete: 'isActive',
  readPermission: 'academics:read',
  writePermission: 'academics:write',
})

export const GET = config.GET
export const PUT = config.PUT
export const DELETE = config.DELETE
