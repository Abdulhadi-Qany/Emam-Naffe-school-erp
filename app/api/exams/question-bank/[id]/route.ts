import { examQuestions } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: examQuestions,
  module: 'academics',
  label: 'Question',
  softDelete: null,
  readPermission: 'exams:read' as const,
  writePermission: 'exams:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
