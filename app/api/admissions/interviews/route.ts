import { interviews } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: interviews,
  module: 'admissions',
  label: 'Interview',
  requiredFields: ['applicationId', 'interviewDate'],
  searchableFields: ['description'],
  readPermission: 'admissions:read' as const,
  writePermission: 'admissions:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
