import { lessonPlans } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: lessonPlans,
  module: 'academics',
  label: 'Lesson plan',
  searchableFields: ['name'],
  softDelete: null,
  readPermission: 'academics:read' as const,
  writePermission: 'academics:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
