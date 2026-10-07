'use server'

import { and, desc, eq, ilike, or } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { erpRecords, staffRoles } from '@/lib/db/schema'

const SCHOOL_ID = 'emam-bukhari-private-school'
const MAX_TEXT = 180
const MAX_PAGE_SIZE = 100

type RecordInput = { module: string; title: string; reference: string; status?: string; data?: Record<string, unknown> }
type RecordUpdate = Partial<Pick<RecordInput, 'title' | 'reference' | 'status' | 'data'>>

function requiredText(value: unknown, field: string) {
  if (typeof value !== 'string') throw new Error(`${field} is required`)
  const normalized = value.trim()
  if (!normalized || normalized.length > MAX_TEXT) throw new Error(`${field} is invalid`)
  return normalized
}

function moduleName(value: unknown) {
  const module = requiredText(value, 'Module')
  if (!/^[a-z0-9][a-z0-9/_-]*$/.test(module)) throw new Error('Module is invalid')
  return module
}

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function requirePermission(userId: string, permission: string) {
  const roles = await db.select({ permissions: staffRoles.permissions }).from(staffRoles).where(and(eq(staffRoles.schoolId, SCHOOL_ID), eq(staffRoles.userId, userId)))
  const allowed = roles.some(({ permissions }) => Array.isArray(permissions) && (permissions as unknown[]).some((item) => item === '*' || item === permission))
  if (!allowed) throw new Error('Forbidden')
}

export async function listRecords(moduleValue: string, options?: { query?: string; page?: number; pageSize?: number }) {
  const module = moduleName(moduleValue)
  const userId = await requireUser()
  await requirePermission(userId, `${module}:read`)
  const page = Math.max(1, Math.floor(options?.page ?? 1))
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(options?.pageSize ?? 25)))
  const query = options?.query?.trim()
  const filters = [eq(erpRecords.schoolId, SCHOOL_ID), eq(erpRecords.module, module)]
  if (query) filters.push(or(ilike(erpRecords.title, `%${query}%`), ilike(erpRecords.reference, `%${query}%`)) as typeof filters[number])
  const rows = await db.select().from(erpRecords).where(and(...filters)).orderBy(desc(erpRecords.updatedAt)).limit(pageSize).offset((page - 1) * pageSize)
  return { rows, page, pageSize }
}

export async function createRecord(input: RecordInput) {
  const module = moduleName(input?.module)
  const title = requiredText(input?.title, 'Title')
  const reference = requiredText(input?.reference, 'Reference')
  const status = input.status ? requiredText(input.status, 'Status') : 'Active'
  const userId = await requireUser()
  await requirePermission(userId, `${module}:write`)
  const [record] = await db.insert(erpRecords).values({ id: crypto.randomUUID(), schoolId: SCHOOL_ID, module, title, reference, status, data: input.data ?? {}, createdBy: userId }).returning()
  revalidatePath('/')
  return record
}

export async function updateRecord(id: string, input: RecordUpdate) {
  const recordId = requiredText(id, 'Record ID')
  const userId = await requireUser()
  const [existing] = await db.select({ module: erpRecords.module }).from(erpRecords).where(and(eq(erpRecords.id, recordId), eq(erpRecords.schoolId, SCHOOL_ID)))
  if (!existing) throw new Error('Not found')
  await requirePermission(userId, `${existing.module}:write`)
  const values = { ...(input.title !== undefined ? { title: requiredText(input.title, 'Title') } : {}), ...(input.reference !== undefined ? { reference: requiredText(input.reference, 'Reference') } : {}), ...(input.status !== undefined ? { status: requiredText(input.status, 'Status') } : {}), ...(input.data !== undefined ? { data: input.data } : {}), updatedAt: new Date() }
  const [updated] = await db.update(erpRecords).set(values).where(and(eq(erpRecords.id, recordId), eq(erpRecords.schoolId, SCHOOL_ID))).returning()
  revalidatePath('/')
  return updated
}

export async function deleteRecord(id: string) {
  const recordId = requiredText(id, 'Record ID')
  const userId = await requireUser()
  const [existing] = await db.select({ module: erpRecords.module }).from(erpRecords).where(and(eq(erpRecords.id, recordId), eq(erpRecords.schoolId, SCHOOL_ID)))
  if (!existing) throw new Error('Not found')
  await requirePermission(userId, `${existing.module}:delete`)
  await db.delete(erpRecords).where(and(eq(erpRecords.id, recordId), eq(erpRecords.schoolId, SCHOOL_ID)))
  revalidatePath('/')
  return { success: true }
}
