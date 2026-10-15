import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { eq, and, or, like, desc, asc, count, SQL } from 'drizzle-orm'
import { PgTable, PgColumn } from 'drizzle-orm/pg-core'

interface CrudOptions {
  table: PgTable
  searchableFields?: (string | SQL)[]
  requiredFields?: string[]
  idField?: string
  orderBy?: SQL | PgColumn
  softDelete?: boolean
  transformInput?: (body: any) => Record<string, any>
  transformOutput?: (record: any) => any
}

/**
 * @deprecated — Transaction-Script factory, retained ONLY for backward-compat
 * of legacy v1 routes. ALL new code MUST use the Clean Architecture lane:
 * GenericEntity + GenericDrizzleRepository + Create/Update/List handlers
 * + CleanPresenter via `src/shared/crud` and thin `app/api/v2/**` controllers.
 * See docs/CLEAN_ARCHITECTURE_ROADMAP.md. Do not add new usages.
 */
export function createCrudHandlers(options: CrudOptions) {
  const { table, searchableFields = [], requiredFields = [], idField = 'id', orderBy, softDelete = true, transformInput, transformOutput } = options

  const getIdColumn = (table as any)[idField]

  async function handleGet(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url)
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = (page - 1) * limit
      const query = searchParams.get('query')
      const status = searchParams.get('status')
      const sortBy = searchParams.get('sortBy')
      const sortOrder = searchParams.get('sortOrder') || 'desc'

      const conditions: SQL[] = []

      // Status filter
      if (status) {
        conditions.push(eq((table as any).status, status))
      }

      // Search query
      if (query && searchableFields.length > 0) {
        const q = `%${query}%`
        const searchConditions = searchableFields.map((field) => {
          if (typeof field === 'string') {
            return like((table as any)[field], q)
          }
          return field
        })
        const searchCondition = or(...searchConditions)
        if (searchCondition) conditions.push(searchCondition)
      }

      // Get total count
      const [totalResult] = await db.select({ count: count() }).from(table)
      const total = totalResult?.count || 0

      // Build query
      let queryBuilder: any = db.select().from(table)
      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(and(...conditions))
      }

      // Apply ordering
      if (orderBy) {
        queryBuilder = queryBuilder.orderBy(sortOrder === 'asc' ? asc(orderBy) : desc(orderBy))
      } else if (sortBy) {
        const sortColumn = (table as any)[sortBy]
        queryBuilder = queryBuilder.orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn))
      } else {
        queryBuilder = queryBuilder.orderBy(desc((table as any).createdAt))
      }

      // Apply pagination
      const result = await queryBuilder.limit(limit).offset(offset)

      const data = transformOutput ? result.map(transformOutput) : result

      return NextResponse.json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total,
        },
      })
    } catch (error) {
      console.error(`Error fetching ${table}:`, error)
      return NextResponse.json({ error: `Failed to fetch data` }, { status: 500 })
    }
  }

  async function handlePost(request: NextRequest) {
    try {
      const body = await request.json()

      // Validate required fields
      const missingFields = requiredFields.filter((field) => !body[field])
      if (missingFields.length > 0) {
        return NextResponse.json(
          { error: `Missing required fields: ${missingFields.join(', ')}` },
          { status: 400 }
        )
      }

      // Transform input
      const inputData = transformInput ? transformInput(body) : body

      // Add ID and timestamps
      const recordData = {
        ...inputData,
        id: body.id || crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const [newRecord] = await db.insert(table).values(recordData).returning()

      const data = transformOutput ? transformOutput(newRecord) : newRecord

      return NextResponse.json(data, { status: 201 })
    } catch (error) {
      console.error(`Error creating ${table}:`, error)
      return NextResponse.json({ error: `Failed to create record` }, { status: 500 })
    }
  }

  async function handleGetById(request: NextRequest, params: Promise<{ id: string }>) {
    try {
      const { id } = await params

      const [record] = await db.select().from(table).where(eq(getIdColumn, id))

      if (!record) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 })
      }

      const data = transformOutput ? transformOutput(record) : record

      return NextResponse.json(data)
    } catch (error) {
      console.error(`Error fetching ${table}:`, error)
      return NextResponse.json({ error: `Failed to fetch record` }, { status: 500 })
    }
  }

  async function handlePut(request: NextRequest, params: Promise<{ id: string }>) {
    try {
      const { id } = await params
      const body = await request.json()

      // Check if record exists
      const [existingRecord] = await db.select().from(table).where(eq(getIdColumn, id))
      if (!existingRecord) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 })
      }

      // Transform input
      const inputData = transformInput ? transformInput(body) : body

      // Update record
      const [updatedRecord] = await db.update(table).set({
        ...inputData,
        updatedAt: new Date(),
      }).where(eq(getIdColumn, id)).returning()

      const data = transformOutput ? transformOutput(updatedRecord) : updatedRecord

      return NextResponse.json(data)
    } catch (error) {
      console.error(`Error updating ${table}:`, error)
      return NextResponse.json({ error: `Failed to update record` }, { status: 500 })
    }
  }

  async function handleDelete(request: NextRequest, params: Promise<{ id: string }>) {
    try {
      const { id } = await params

      // Check if record exists
      const [existingRecord] = await db.select().from(table).where(eq(getIdColumn, id))
      if (!existingRecord) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 })
      }

      if (softDelete && (table as any).status) {
        // Soft delete
        const [deletedRecord] = await db.update(table).set({
          status: 'deleted',
          updatedAt: new Date(),
        }).where(eq(getIdColumn, id)).returning()

        return NextResponse.json({ message: 'Record deleted successfully', record: deletedRecord })
      } else {
        // Hard delete
        await db.delete(table).where(eq(getIdColumn, id))
        return NextResponse.json({ message: 'Record deleted successfully' })
      }
    } catch (error) {
      console.error(`Error deleting ${table}:`, error)
      return NextResponse.json({ error: `Failed to delete record` }, { status: 500 })
    }
  }

  return {
    GET: handleGet,
    POST: handlePost,
    GET_BY_ID: handleGetById,
    PUT: handlePut,
    DELETE: handleDelete,
  }
}

/**
 * Create a complete route handler with dynamic params
 */
export function createRouteHandler(options: CrudOptions) {
  const handlers = createCrudHandlers(options)

  return {
    GET: handlers.GET,
    POST: handlers.POST,
  }
}

/**
 * Create a dynamic route handler (with [id] param)
 * Next.js passes (request, context) where context = { params: Promise<{ id: string }> }
 */
export function createDynamicRouteHandler(options: CrudOptions) {
  const handlers = createCrudHandlers(options)

  return {
    GET: (request: NextRequest, context: { params: Promise<{ id: string }> }) =>
      handlers.GET_BY_ID(request, context.params),
    PUT: (request: NextRequest, context: { params: Promise<{ id: string }> }) =>
      handlers.PUT(request, context.params),
    DELETE: (request: NextRequest, context: { params: Promise<{ id: string }> }) =>
      handlers.DELETE(request, context.params),
  }
}
