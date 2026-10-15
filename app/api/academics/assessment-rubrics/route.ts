import { assessmentRubrics } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: assessmentRubrics,
  module: 'academics',
  label: 'Rubric',
  requiredFields: ['name'],
  uniqueFields: [],
  searchableFields: ['name'],
  filterFields: ['status', 'subjectId', 'gradeId'],
  sortableFields: ['name'],
  softDelete: null,
  readPermission: 'academics:read' as const,
  writePermission: 'academics:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
