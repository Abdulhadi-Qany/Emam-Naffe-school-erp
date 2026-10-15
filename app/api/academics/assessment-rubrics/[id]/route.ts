import { assessmentRubrics } from '@/lib/db/schema'
import { createReferenceItemRoutes } from '@/lib/api/reference'

const config = {
  table: assessmentRubrics,
  module: 'academics',
  label: 'Rubric',
  softDelete: null,
  readPermission: 'academics:read' as const,
  writePermission: 'academics:write' as const,
}

const item = createReferenceItemRoutes(config)
export const GET = item.GET
export const PUT = item.PUT
export const DELETE = item.DELETE
