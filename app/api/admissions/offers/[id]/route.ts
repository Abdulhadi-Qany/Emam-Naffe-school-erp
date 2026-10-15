import { admissionOffers } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: admissionOffers,
  module: 'admissions',
  label: 'Offer',
  softDelete: null,
  readPermission: 'admissions:read' as const,
  writePermission: 'admissions:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
