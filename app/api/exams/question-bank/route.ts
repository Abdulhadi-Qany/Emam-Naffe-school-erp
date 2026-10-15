import { examQuestions } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: examQuestions,
  module: 'academics',
  label: 'Question',
  requiredFields: ['question'],
  uniqueFields: [],
  searchableFields: ['question', 'topic'],
  filterFields: ['status', 'subjectId', 'difficulty'],
  sortableFields: ['createdAt'],
  softDelete: null,
  readPermission: 'exams:read' as const,
  writePermission: 'exams:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
