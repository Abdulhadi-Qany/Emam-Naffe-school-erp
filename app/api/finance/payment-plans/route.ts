import { paymentPlans } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: paymentPlans,
  module: 'finance',
  label: 'Payment plan',
  requiredFields: ['studentId'],
  uniqueFields: [],
  searchableFields: [],
  filterFields: ['status', 'studentId'],
  sortableFields: ['createdAt'],
  softDelete: null,
  readPermission: 'fees:read' as const,
  writePermission: 'fees:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
