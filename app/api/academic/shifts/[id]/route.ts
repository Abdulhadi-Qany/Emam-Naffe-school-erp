import { shifts } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = createReferenceItemRoutes({
  table: shifts,
  module: 'academics',
  label: 'Shift',
  softDelete: 'isActive',
  readPermission: 'academics:read',
  writePermission: 'academics:write',
})

export const GET = config.GET
export const PUT = config.PUT
export const DELETE = config.DELETE
