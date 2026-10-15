import { hostelDiscipline } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: hostelDiscipline,
  module: 'hostel',
  label: 'Discipline record',
  requiredFields: ['incident'],
  searchableFields: ['description'],
  readPermission: 'hostel:read' as const,
  writePermission: 'hostel:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
