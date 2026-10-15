import { wellbeingReferrals } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: wellbeingReferrals,
  module: 'students',
  label: 'Referral',
  requiredFields: ['studentId', 'reason'],
  uniqueFields: [],
  searchableFields: ['reason', 'outcome'],
  filterFields: ['status'],
  sortableFields: ['createdAt'],
  softDelete: null,
  readPermission: 'students:read' as const,
  writePermission: 'students:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
