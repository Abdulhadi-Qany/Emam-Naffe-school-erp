import { communicationCampaigns } from '@/lib/db/schema'
import { createReferenceRoutes } from '@/lib/api/reference'

const config = {
  table: communicationCampaigns,
  module: 'engagement',
  label: 'Campaign',
  requiredFields: ['name', 'channel'],
  uniqueFields: [],
  searchableFields: ['name', 'content'],
  filterFields: ['status', 'channel'],
  sortableFields: ['scheduledAt'],
  softDelete: null,
  readPermission: 'communications:read' as const,
  writePermission: 'communications:write' as const,
}

const collection = createReferenceRoutes(config)
export const GET = collection.GET
export const POST = collection.POST
