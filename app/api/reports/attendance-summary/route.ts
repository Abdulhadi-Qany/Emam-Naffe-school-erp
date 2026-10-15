import { reportCards } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: reportCards,
  module: 'academics',
  label: 'Report card',
  requiredFields: ['studentId'],
  searchableFields: ['description'],
  readPermission: 'reports:read' as const,
  writePermission: 'reports:read' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
