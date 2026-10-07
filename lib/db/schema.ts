import { pgTable, text, timestamp, jsonb, unique } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified').notNull().defaultNow(),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(), expiresAt: timestamp('expiresAt').notNull(), token: text('token').notNull().unique(), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(), ipAddress: text('ipAddress'), userAgent: text('userAgent'), userId: text('userId').notNull(),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(), accountId: text('accountId').notNull(), providerId: text('providerId').notNull(), userId: text('userId').notNull(), accessToken: text('accessToken'), refreshToken: text('refreshToken'), idToken: text('idToken'), accessTokenExpiresAt: timestamp('accessTokenExpiresAt'), refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'), scope: text('scope'), password: text('password'), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(), expiresAt: timestamp('expiresAt').notNull(), createdAt: timestamp('createdAt').notNull().defaultNow(), updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const erpRecords = pgTable('erp_records', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), module: text('module').notNull(), title: text('title').notNull(), reference: text('reference').notNull(), status: text('status').notNull().default('Active'), data: jsonb('data').notNull().default({}), createdBy: text('created_by').notNull(), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const staffRoles = pgTable('staff_roles', {
  id: text('id').primaryKey(), schoolId: text('school_id').notNull(), userId: text('user_id').notNull(), role: text('role').notNull(), permissions: jsonb('permissions').notNull().default([]), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ uniqueStaffRole: unique().on(table.schoolId, table.userId, table.role) }))

export type ErpRecord = typeof erpRecords.$inferSelect
export type NewErpRecord = typeof erpRecords.$inferInsert
export type StaffRole = typeof staffRoles.$inferSelect

export const schema = { user, session, account, verification, erpRecords, staffRoles }

export default schema
