import { admissionWaitlists } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: admissionWaitlists,
  module: 'admissions',
  label: 'Waitlist entry',
  softDelete: null,
  readPermission: 'admissions:read' as const,
  writePermission: 'admissions:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
