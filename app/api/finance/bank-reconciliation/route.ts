import { bankReconciliations } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: bankReconciliations,
  module: 'finance',
  label: 'Reconciliation',
  requiredFields: ['statementDate'],
  uniqueFields: [],
  searchableFields: ['bankName'],
  filterFields: ['status'],
  sortableFields: ['statementDate'],
  softDelete: null,
  readPermission: 'payments:read' as const,
  writePermission: 'payments:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
