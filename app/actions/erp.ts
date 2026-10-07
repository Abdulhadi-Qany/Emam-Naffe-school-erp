'use server'

import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { erpRecords, staffRoles } from '@/lib/db/schema'

const SCHOOL_ID = 'emam-bukhari-private-school'

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

async function requirePermission(userId: string, permission: string) {
  const roles = await db.select({ permissions: staffRoles.permissions }).from(staffRoles).where(and(eq(staffRoles.schoolId, SCHOOL_ID), eq(staffRoles.userId, userId)))
  if (!roles.length) throw new Error('Forbidden')
  const allowed = roles.some(({ permissions }) => Array.isArray(permissions) && (permissions as string[]).includes('*')) || roles.some(({ permissions }) => Array.isArray(permissions) && (permissions as string[]).includes(permission))
  if (!allowed) throw new Error('Forbidden')
}

export async function listRecords(module: string) {
  const userId = await requireUser()
  await requirePermission(userId, `${module}:read`)
  return db.select().from(erpRecords).where(and(eq(erpRecords.schoolId, SCHOOL_ID), eq(erpRecords.module, module))).orderBy(desc(erpRecords.updatedAt))
}

export async function createRecord(input: { module: string; title: string; reference: string; status?: string; data?: Record<string, unknown> }) {
  const userId = await requireUser()
  await requirePermission(userId, `${input.module}:write`)
  const id = crypto.randomUUID()
  const [record] = await db.insert(erpRecords).values({ id, schoolId: SCHOOL_ID, module: input.module, title: input.title.trim(), reference: input.reference.trim(), status: input.status ?? 'Active', data: input.data ?? {}, createdBy: userId }).returning()
  revalidatePath('/')
  return record
}

export async function updateRecord(id: string, input: Partial<{ title: string; reference: string; status: string; data: Record<string, unknown> }>) {
  const userId = await requireUser()
  const [existing] = await db.select({ module: erpRecords.module }).from(erpRecords).where(and(eq(erpRecords.id, id), eq(erpRecords.schoolId, SCHOOL_ID)))
  if (!existing) throw new Error('Not found')
  await requirePermission(userId, `${existing.module}:write`)
  const [record] = await db.update(erpRecords).set({ ...input, updatedAt: new Date() }).where(and(eq(erpRecords.id, id), eq(erpRecords.schoolId, SCHOOL_ID))).returning()
  revalidatePath('/')
  return record
}

export async function deleteRecord(id: string) {
  const userId = await requireUser()
  const [existing] = await db.select({ module: erpRecords.module }).from(erpRecords).where(and(eq(erpRecords.id, id), eq(erpRecords.schoolId, SCHOOL_ID)))
  if (!existing) throw new Error('Not found')
  await requirePermission(userId, `${existing.module}:delete`)
  await db.delete(erpRecords).where(and(eq(erpRecords.id, id), eq(erpRecords.schoolId, SCHOOL_ID)))
  revalidatePath('/')
  return { success: true }
}
