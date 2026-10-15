/**
 * Config-driven factory for reference-data endpoints.
 *
 * Covers the repeated pattern of "list with joins + create + get/update/soft
 * delete" for simple tables (grades, sections, subjects, rooms, periods, years,
 * terms, holidays, shifts, â€¦). Routes that need richer business logic (students,
 * invoices, payroll, timetable) stay hand-written.
 *
 * Example:
 * ```ts
 * const config = defineReference({
 *   table: rooms,
 *   module: 'academics',
 *   label: 'Room',
 *   requiredFields: ['name', 'schoolId'],
 *   searchableFields: ['name', 'roomType', 'building'],
 *   sortableFields: ['name', 'roomType'],
 *   softDelete: 'isActive',
 * })
 * export const { GET, POST } = createReferenceRoutes(config)
 * export const { GET: ID_GET, PUT, DELETE } = createReferenceItemRoutes(config)
 * ```
 */

import type { NextRequest } from 'next/server'
import type { NextResponse } from 'next/server'
import type { PgTable } from 'drizzle-orm/pg-core'
import { and, eq, sql, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db'
import { ok, created, deleted, paged, badRequest, notFound, conflict, parsePagination, parseSort, withV1, audit } from '@/lib/api'
import type { Permission } from '@/lib/api/permissions'

export interface ReferenceConfig<T extends PgTable = PgTable> {
  table: T
  /** Audit module name (students | academics | finance | â€¦). */
  module: string
  /** Singular human label used in error messages, e.g. "Room". */
  label: string
  /** Fields the collection list filters on (beyond `query` search). */
  filterFields?: string[]
  /** Columns searched by the `query` parameter (ilike). */
  searchableFields?: string[]
  /** Whitelisted sort columns. */
  sortableFields?: string[]
  /** Fields required on create. */
  requiredFields?: string[]
  /** Column names enforced unique per school on create (composite). */
  uniqueFields?: string[]
  /** Soft-delete strategy: `status` sets `status='deleted'`, `isActive` sets false. */
  softDelete?: 'status' | 'isActive' | null
  readPermission: Permission
  writePermission: Permission
  /** Custom list select (joins/computed columns). Receives the base filters. */
  listSelect?: (dbClient: typeof db) => any
  /** Column the `status` filter applies to (defaults to `status`). */
  statusField?: string
  /** Column the `isActive` filter applies to (defaults to `isActive`). */
  activeField?: string
}

/** Columns callers may never set directly (server-owned). */
const SERVER_OWNED = new Set(['id', 'schoolId', 'createdAt', 'updatedAt'])

function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (SERVER_OWNED.has(key)) continue
    if (value === undefined) continue
    clean[key] = value
  }
  return clean
}

function buildWhere(config: ReferenceConfig, params: URLSearchParams, query: string | null): SQL | undefined {
  const table = config.table as any
  const conditions: SQL[] = []

  for (const field of config.filterFields ?? []) {
    const value = params.get(field)
    if (value !== null && value !== '') {
      const column = table[field]
      if (column) conditions.push(eq(column, value))
    }
  }

  if (query && (config.searchableFields ?? []).length > 0) {
    const q = `%${query}%`
    const search = (config.searchableFields ?? [])
      .map((field) => table[field])
      .filter(Boolean)
      .map((column) => sql`${column} ilike ${q}`)
    if (search.length > 0) conditions.push(sql`(${sql.join(search, sql` or `)})`)
  }

  return conditions.length > 0 ? and(...conditions) : undefined
}

function applySort(config: ReferenceConfig, params: URLSearchParams, queryBuilder: any): any {
  const sortable = config.sortableFields ?? []
  const sortBy = params.get('sortBy') ?? sortable[0]
  const sortOrder = params.get('sortOrder') === 'desc' ? 'desc' : 'asc'
  if (sortBy && sortable.includes(sortBy)) {
    const table = config.table as any
    const column = table[sortBy]
    if (column) return queryBuilder.orderBy(sql`${column} ${sql.raw(sortOrder)}`)
  }
  const table = config.table as any
  return table.createdAt ? queryBuilder.orderBy(sql`${table.createdAt} desc`) : queryBuilder
}

/** Creates GET + POST for the collection route. */
export function createReferenceRoutes(config: ReferenceConfig) {
  async function GET(request: NextRequest): Promise<NextResponse> {
    return withV1(config.readPermission, async ({ schoolId }, req) => {
      const { searchParams } = new URL(req.url)
      const pagination = parsePagination(searchParams)
      const query = searchParams.get('query')
      const table = config.table as any
      const where = and(eq(table.schoolId, schoolId), buildWhere(config, searchParams, query))

      const [totalRow] = await db.select({ count: sql<number>`count(*)::int` }).from(config.table).where(where)
      const total = totalRow?.count ?? 0

      const rows = config.listSelect
        ? await applySort(config, searchParams, config.listSelect(db).where(where)).limit(pagination.limit).offset(pagination.offset)
        : await applySort(config, searchParams, db.select().from(config.table).where(where)).limit(pagination.limit).offset(pagination.offset)

      return paged(rows, pagination, total)
    })(request)
  }

  async function POST(request: NextRequest): Promise<NextResponse> {
    return withV1(config.writePermission, async ({ user, schoolId }, req) => {
      const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
      if (!body) return badRequest('Invalid JSON body')

      for (const field of config.requiredFields ?? []) {
        if (body[field] === undefined || body[field] === null || body[field] === '') {
          return badRequest(`${field} is required`)
        }
      }

      if ((config.uniqueFields ?? []).length > 0) {
        const conditions = [eq((config.table as any).schoolId, schoolId)]
        for (const field of config.uniqueFields!) {
          const value = body[field]
          if (value !== undefined && value !== null && value !== '') {
            conditions.push(eq((config.table as any)[field], String(value).trim() as never))
          }
        }
        if (conditions.length > 1) {
          const [duplicate] = await db.select({ id: (config.table as any).id }).from(config.table).where(and(...conditions)).limit(1)
          if (duplicate) return conflict(`A ${config.label.toLowerCase()} with the same ${(config.uniqueFields as string[]).join('/')} already exists`)
        }
      }

      const createdRows = (await db
        .insert(config.table)
        .values({
          id: crypto.randomUUID(),
          schoolId,
          ...sanitizeBody(body),
        } as never)
        .returning()) as unknown as { id: string }[]
      const createdRow = createdRows[0]

      await audit({
        schoolId,
        userId: user.id,
        action: 'created',
        module: config.module,
        entityType: config.label.toLowerCase(),
        entityId: createdRow.id,
      })

      return created(createdRow)
    })(request)
  }

  return { GET, POST }
}

/** Creates GET + PUT + DELETE for the dynamic [id] route. */
export function createReferenceItemRoutes(config: ReferenceConfig) {
  async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    return withV1(config.readPermission, async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
      const { id } = await ctx.params
      const [row] = await db.select().from(config.table).where(and(
        eq((config.table as any).id, id),
        eq((config.table as any).schoolId, schoolId)
      )).limit(1)
      if (!row) return notFound(`${config.label} not found`)
      return ok(row)
    })(request, context)
  }

  async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    return withV1(config.writePermission, async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
      const { id } = await ctx.params
      const [existing] = await db.select().from(config.table).where(and(
        eq((config.table as any).id, id),
        eq((config.table as any).schoolId, schoolId)
      )).limit(1)
      if (!existing) return notFound(`${config.label} not found`)

      const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
      if (!body) return badRequest('Invalid JSON body')

      if ((config.uniqueFields ?? []).length > 0) {
        const values: Record<string, unknown> = {}
        let changed = false
        for (const field of config.uniqueFields!) {
          const value = body[field]
          if (value !== undefined && String(value).trim() !== String((existing as any)[field])) {
            values[field] = String(value).trim()
            changed = true
          }
        }
        if (changed) {
          const conditions = [eq((config.table as any).schoolId, (existing as any).schoolId)]
          for (const [field, value] of Object.entries(values)) {
            conditions.push(eq((config.table as any)[field], value as never))
          }
          const [duplicate] = await db.select({ id: (config.table as any).id }).from(config.table).where(and(...conditions)).limit(1)
          if (duplicate && duplicate.id !== id) return conflict(`A ${config.label.toLowerCase()} with the same ${(config.uniqueFields as string[]).join('/')} already exists`)
        }
      }

      const updatedRows = (await db
        .update(config.table)
        .set({ ...sanitizeBody(body), updatedAt: new Date() } as never)
        .where(and(
          eq((config.table as any).id, id),
          eq((config.table as any).schoolId, schoolId)
        ))
        .returning()) as unknown as Record<string, unknown>[]
      const updated = updatedRows[0]

      await audit({
        schoolId: (existing as any).schoolId,
        userId: user.id,
        action: 'updated',
        module: config.module,
        entityType: config.label.toLowerCase(),
        entityId: id,
      })

      return ok(updated)
    })(request, context)
  }

  async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<NextResponse> {
    return withV1(config.writePermission, async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
      const { id } = await ctx.params
      const [existing] = await db.select().from(config.table).where(and(
        eq((config.table as any).id, id),
        eq((config.table as any).schoolId, schoolId)
      )).limit(1)
      if (!existing) return notFound(`${config.label} not found`)

      if (config.softDelete === 'status') {
        await db.update(config.table).set({ status: 'deleted', updatedAt: new Date() } as never).where(and(
          eq((config.table as any).id, id),
          eq((config.table as any).schoolId, schoolId)
        ))
      } else if (config.softDelete === 'isActive') {
        await db.update(config.table).set({ isActive: false, updatedAt: new Date() } as never).where(and(
          eq((config.table as any).id, id),
          eq((config.table as any).schoolId, schoolId)
        ))
      } else {
        await db.delete(config.table).where(and(
          eq((config.table as any).id, id),
          eq((config.table as any).schoolId, schoolId)
        ))
      }

      await audit({
        schoolId: (existing as any).schoolId,
        userId: user.id,
        action: 'deleted',
        module: config.module,
        entityType: config.label.toLowerCase(),
        entityId: id,
      })

      return deleted(`${config.label} deleted successfully`)
    })(request, context)
  }

  return { GET, PUT, DELETE }
}

/** Convenience for `defineReference` typing inference in route files. */
export function defineReference<T extends PgTable>(config: ReferenceConfig<T>): ReferenceConfig<T> {
  return config
}
