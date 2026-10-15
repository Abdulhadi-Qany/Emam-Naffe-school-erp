import { communityDonations } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: communityDonations,
  module: 'engagement',
  label: 'Donation',
  requiredFields: ['donorName', 'amount'],
  uniqueFields: ['receiptNumber'],
  searchableFields: ['donorName', 'receiptNumber', 'purpose'],
  filterFields: ['status', 'donorType'],
  sortableFields: ['createdAt'],
  softDelete: null,
  readPermission: 'events:read' as const,
  writePermission: 'events:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
