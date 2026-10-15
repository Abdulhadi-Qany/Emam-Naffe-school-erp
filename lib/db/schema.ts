import { pgTable, text, timestamp, jsonb, boolean, integer, numeric, unique, index, pgEnum, AnyPgColumn } from 'drizzle-orm/pg-core'

// ==========================================
// ENUMS
// ==========================================

export const userTypeEnum = pgEnum('user_type', ['staff', 'student', 'parent'])
export const genderEnum = pgEnum('gender', ['male', 'female', 'other'])
export const statusEnum = pgEnum('status', ['active', 'inactive', 'suspended', 'deleted', 'graduated', 'transferred', 'dropped_out'])
export const leaveStatusEnum = pgEnum('leave_status', ['pending', 'approved', 'rejected', 'cancelled'])
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late', 'excused', 'holiday'])
export const feeStatusEnum = pgEnum('fee_status', ['pending', 'partial', 'paid', 'overdue', 'waived'])
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'bank_transfer', 'cheque', 'card', 'mobile_payment'])
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'refunded'])
export const payrollStatusEnum = pgEnum('payroll_status', ['draft', 'approved', 'paid', 'cancelled'])
export const payslipStatusEnum = pgEnum('payslip_status', ['pending', 'paid', 'void'])
export const examStatusEnum = pgEnum('exam_status', ['scheduled', 'ongoing', 'completed', 'cancelled'])
export const bookStatusEnum = pgEnum('book_status', ['available', 'issued', 'reserved', 'lost', 'damaged'])
export const maintenanceStatusEnum = pgEnum('maintenance_status', ['scheduled', 'in_progress', 'completed', 'cancelled'])
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'urgent'])
export const shiftTypeEnum = pgEnum('shift_type', ['morning', 'afternoon', 'evening'])
export const holidayTypeEnum = pgEnum('holiday_type', ['national', 'religious', 'school', 'exam'])
export const termTypeEnum = pgEnum('term_type', ['semester', 'trimester', 'quarter'])
export const employmentTypeEnum = pgEnum('employment_type', ['full_time', 'part_time', 'contract', 'temporary'])
export const reservationStatusEnum = pgEnum('reservation_status', ['active', 'fulfilled', 'cancelled', 'expired'])
export const disciplineSeverityEnum = pgEnum('discipline_severity', ['minor', 'moderate', 'major'])
export const disciplineStatusEnum = pgEnum('discipline_status', ['open', 'under_review', 'resolved', 'escalated'])
export const assetStatusEnum = pgEnum('asset_status', ['active', 'maintenance', 'retired', 'disposed'])
export const stockMovementTypeEnum = pgEnum('stock_movement_type', ['purchase', 'sale', 'adjustment', 'transfer', 'return'])
export const orderStatusEnum = pgEnum('order_status', ['draft', 'submitted', 'approved', 'received', 'cancelled'])
export const integrationStatusEnum = pgEnum('integration_status', ['active', 'inactive', 'error'])
export const notificationTypeEnum = pgEnum('notification_type', ['info', 'warning', 'error', 'success'])
export const noticePriorityEnum = pgEnum('notice_priority', ['low', 'medium', 'high', 'urgent'])
export const eventTypeEnum = pgEnum('event_type', ['academic', 'holiday', 'meeting', 'sports', 'cultural'])
export const surveyTypeEnum = pgEnum('survey_type', ['feedback', 'poll', 'assessment'])
export const timetableDayEnum = pgEnum('timetable_day', ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'])
export const dayOfWeekEnum = pgEnum('day_of_week', ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'])

// ==========================================
// AUTHENTICATION (Better Auth + Drizzle Adapter)
// ==========================================
// Tables managed by Better Auth (v1.7.7, drizzle adapter):
// user, session, account, verification.
// Column names/flags must match @better-auth/core/dist/db/get-tables.mjs (v1.7.7).
// `id` is added by the adapter as the physical primary key column.
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  userId: text('userId').notNull(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull(),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

// ==========================================
// SCHOOL CONFIGURATION
// ==========================================

export const schools = pgTable('schools', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameDari: text('name_dari'),
  namePashto: text('name_pashto'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  province: text('province'),
  country: text('country').notNull().default('Afghanistan'),
  logo: text('logo'),
  favicon: text('favicon'),
  timezone: text('timezone').notNull().default('Asia/Kabul'),
  currency: text('currency').notNull().default('AFN'),
  academicYearStartMonth: integer('academic_year_start_month').notNull().default(3),
  website: text('website'),
  status: statusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  emailIdx: index('schools_email_idx').on(table.email),
  statusIdx: index('schools_status_idx').on(table.status),
}))

export const schoolBranches = pgTable('school_branches', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code'),
  address: text('address'),
  city: text('city'),
  province: text('province'),
  phone: text('phone'),
  email: text('email'),
  principalId: text('principal_id').references(() => staff.id, { onDelete: 'set null' }),
  isMainBranch: boolean('is_main_branch').notNull().default(false),
  status: statusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('school_branches_school_id_idx').on(table.schoolId),
  codeIdx: index('school_branches_code_idx').on(table.code),
}))

export const academicYears = pgTable('academic_years', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  solarHijriYear: integer('solar_hijri_year').notNull(),
  solarHijriStartDate: timestamp('solar_hijri_start_date', { withTimezone: true }).notNull(),
  solarHijriEndDate: timestamp('solar_hijri_end_date', { withTimezone: true }).notNull(),
  isCurrent: boolean('is_current').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('academic_years_school_id_idx').on(table.schoolId),
  isCurrentIdx: index('academic_years_is_current_idx').on(table.isCurrent),
}))

export const terms = pgTable('terms', {
  id: text('id').primaryKey(),
  academicYearId: text('academic_year_id').notNull().references(() => academicYears.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  termNumber: integer('term_number').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  isCurrent: boolean('is_current').notNull().default(false),
  termType: termTypeEnum('term_type').notNull().default('semester'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  academicYearIdIdx: index('terms_academic_year_id_idx').on(table.academicYearId),
}))

export const holidays = pgTable('holidays', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  nameDari: text('name_dari'),
  namePashto: text('name_pashto'),
  holidayType: holidayTypeEnum('holiday_type').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  isRecurring: boolean('is_recurring').notNull().default(false),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('holidays_school_id_idx').on(table.schoolId),
}))

export const shifts = pgTable('shifts', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  shiftType: shiftTypeEnum('shift_type').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  applicableGrades: jsonb('applicable_grades').notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('shifts_school_id_idx').on(table.schoolId),
}))

export const configSettings = pgTable('config_settings', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: jsonb('value').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolKeyUnique: unique().on(table.schoolId, table.key),
  schoolIdIdx: index('config_settings_school_id_idx').on(table.schoolId),
}))

// ==========================================
// USER MANAGEMENT & AUTHENTICATION
// ==========================================

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').references(() => schools.id, { onDelete: 'cascade' }),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  password: text('password').notNull(),
  twoFactorSecret: text('two_factor_secret'),
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  lastLoginIp: text('last_login_ip'),
  status: statusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  schoolIdIdx: index('users_school_id_idx').on(table.schoolId),
  statusIdx: index('users_status_idx').on(table.status),
}))

export const roles = pgTable('roles', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('roles_school_id_idx').on(table.schoolId),
}))

export const permissions = pgTable('permissions', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  module: text('module').notNull(),
  action: text('action').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('permissions_school_id_idx').on(table.schoolId),
  moduleActionIdx: index('permissions_module_action_idx').on(table.module, table.action),
}))

export const userRoles = pgTable('user_roles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  assignedBy: text('assigned_by').references(() => user.id, { onDelete: 'set null' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdRoleIdUnique: unique().on(table.userId, table.roleId),
  userIdIdx: index('user_roles_user_id_idx').on(table.userId),
  roleIdIdx: index('user_roles_role_id_idx').on(table.roleId),
  schoolIdIdx: index('user_roles_school_id_idx').on(table.schoolId),
}))

export const rolePermissions = pgTable('role_permissions', {
  id: text('id').primaryKey(),
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: text('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  rolePermissionUnique: unique().on(table.roleId, table.permissionId),
  roleIdIdx: index('role_permissions_role_id_idx').on(table.roleId),
  permissionIdIdx: index('role_permissions_permission_id_idx').on(table.permissionId),
}))

export const userSessions = pgTable('user_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('user_sessions_user_id_idx').on(table.userId),
  tokenIdx: index('user_sessions_token_idx').on(table.token),
}))

export const userProfiles = pgTable('user_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }).unique(),
  userType: userTypeEnum('user_type').notNull(),
  firstName: text('first_name').notNull(),
  fatherName: text('father_name').notNull(),
  grandfatherName: text('grandfather_name'),
  familyName: text('family_name').notNull(),
  fullName: text('full_name').notNull(),
  dateOfBirth: timestamp('date_of_birth', { withTimezone: true }),
  placeOfBirth: text('place_of_birth'),
  gender: genderEnum('gender'),
  bloodGroup: text('blood_group'),
  nationality: text('nationality').notNull().default('Afghan'),
  nationalId: text('national_id'),
  photo: text('photo'),
  address: text('address'),
  city: text('city'),
  province: text('province'),
  country: text('country'),
  phone: text('phone'),
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactPhone: text('emergency_contact_phone'),
  religion: text('religion'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('user_profiles_user_id_idx').on(table.userId),
}))

export const loginHistory = pgTable('login_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent').notNull(),
  location: jsonb('location').notNull().default({}),
  success: boolean('success').notNull().default(true),
  failureReason: text('failure_reason'),
  loggedInAt: timestamp('logged_in_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('login_history_user_id_idx').on(table.userId),
  loggedInAtIdx: index('login_history_logged_in_at_idx').on(table.loggedInAt),
}))

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').references(() => schools.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  module: text('module').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  changes: jsonb('changes').notNull().default({}),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('audit_logs_school_id_idx').on(table.schoolId),
  userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
  entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
}))

// ==========================================
// STUDENT MANAGEMENT
// ==========================================

export const students = pgTable('students', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  studentId: text('student_id').notNull().unique(),
  registrationNumber: text('registration_number').notNull().unique(),
  admissionNumber: text('admission_number').notNull().unique(),
  firstName: text('first_name').notNull(),
  fatherName: text('father_name').notNull(),
  grandfatherName: text('grandfather_name'),
  familyName: text('family_name').notNull(),
  fullName: text('full_name').notNull(),
  dateOfBirth: timestamp('date_of_birth', { withTimezone: true }).notNull(),
  placeOfBirth: text('place_of_birth'),
  gender: genderEnum('gender').notNull(),
  bloodGroup: text('blood_group'),
  nationality: text('nationality').notNull().default('Afghan'),
  nationalId: text('national_id'),
  photo: text('photo'),
  address: text('address'),
  city: text('city'),
  province: text('province'),
  country: text('country'),
  phone: text('phone'),
  email: text('email'),
  religion: text('religion'),
  fatherMobile: text('father_mobile'),
  currentGradeId: text('current_grade_id').references(() => grades.id, { onDelete: 'set null' }),
  currentSectionId: text('current_section_id').references(() => sections.id, { onDelete: 'set null' }),
  enrollmentDate: timestamp('enrollment_date', { withTimezone: true }).notNull(),
  status: statusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('students_school_id_idx').on(table.schoolId),
  studentIdIdx: index('students_student_id_idx').on(table.studentId),
  userIdIdx: index('students_user_id_idx').on(table.userId),
  gradeIdx: index('students_grade_idx').on(table.currentGradeId),
  statusIdx: index('students_status_idx').on(table.status),
}))

export const studentGuardians = pgTable('student_guardians', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  name: text('name'),
  relationship: text('relationship').notNull(),
  mobile: text('mobile'),
  phone: text('phone'),
  email: text('email'),
  occupation: text('occupation'),
  tazkiraNumber: text('tazkira_number'),
  nationalId: text('national_id'),
  isPrimary: boolean('is_primary').notNull().default(false),
  canPickup: boolean('can_pickup').notNull().default(true),
  receivesSMS: boolean('receives_sms').notNull().default(true),
  receivesEmail: boolean('receives_email').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  studentIdIdx: index('student_guardians_student_id_idx').on(table.studentId),
  userIdIdx: index('student_guardians_user_id_idx').on(table.userId),
}))

export const studentDocuments = pgTable('student_documents', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  documentType: text('document_type').notNull(),
  title: text('title').notNull(),
  fileUrl: text('file_url').notNull(),
  status: text('status').notNull().default('pending'),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  uploadedBy: text('uploaded_by').references(() => user.id, { onDelete: 'set null' }),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  expiryDate: timestamp('expiry_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  studentIdIdx: index('student_documents_student_id_idx').on(table.studentId),
}))

export const studentHealthRecords = pgTable('student_health_records', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  condition: text('condition'),
  allergy: text('allergy'),
  medication: text('medication'),
  dosage: text('dosage'),
  physicianName: text('physician_name'),
  physicianPhone: text('physician_phone'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  studentIdIdx: index('student_health_records_student_id_idx').on(table.studentId),
}))

export const studentSpecialCategories = pgTable('student_special_categories', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  description: text('description'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  studentIdIdx: index('student_special_categories_student_id_idx').on(table.studentId),
}))

export const studentTimeline = pgTable('student_timeline', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  recordedBy: text('recorded_by').references(() => user.id, { onDelete: 'set null' }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  studentIdIdx: index('student_timeline_student_id_idx').on(table.studentId),
  recordedAtIdx: index('student_timeline_recorded_at_idx').on(table.recordedAt),
}))

export const studentIdCards = pgTable('student_id_cards', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  cardNumber: text('card_number').notNull().unique(),
  issueDate: timestamp('issue_date', { withTimezone: true }).notNull(),
  expiryDate: timestamp('expiry_date', { withTimezone: true }).notNull(),
  status: text('status').notNull().default('active'),
  printedBy: text('printed_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  studentIdIdx: index('student_id_cards_student_id_idx').on(table.studentId),
  cardNumberIdx: index('student_id_cards_card_number_idx').on(table.cardNumber),
}))

export const admissionApplications = pgTable('admission_applications', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  applicationNumber: text('application_number').notNull().unique(),
  firstName: text('first_name').notNull(),
  fatherName: text('father_name').notNull(),
  grandfatherName: text('grandfather_name'),
  familyName: text('family_name').notNull(),
  dateOfBirth: timestamp('date_of_birth', { withTimezone: true }).notNull(),
  gender: genderEnum('gender').notNull(),
  applyingForGradeId: text('applying_for_grade_id').references(() => grades.id, { onDelete: 'set null' }),
  previousSchool: text('previous_school'),
  documents: jsonb('documents').notNull().default([]),
  status: text('status').notNull().default('pending'),
  reviewedBy: text('reviewed_by').references(() => user.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('admission_applications_school_id_idx').on(table.schoolId),
  statusIdx: index('admission_applications_status_idx').on(table.status),
}))

export const admissionNumberSequences = pgTable('admission_number_sequences', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  academicYearId: text('academic_year_id').notNull().references(() => academicYears.id, { onDelete: 'cascade' }),
  prefix: text('prefix').notNull(),
  currentNumber: integer('current_number').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolYearIdx: index('admission_number_sequences_school_year_idx').on(table.schoolId, table.academicYearId),
  schoolPrefixIdx: index('admission_number_sequences_school_prefix_idx').on(table.schoolId, table.prefix),
}))

// ==========================================
// STAFF MANAGEMENT
// ==========================================

export const staff = pgTable('staff', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }).unique(),
  staffId: text('staff_id').notNull().unique(),
  employeeCode: text('employee_code').notNull().unique(),
  firstName: text('first_name').notNull(),
  fatherName: text('father_name').notNull(),
  grandfatherName: text('grandfather_name'),
  familyName: text('family_name').notNull(),
  fullName: text('full_name').notNull(),
  dateOfBirth: timestamp('date_of_birth', { withTimezone: true }),
  gender: genderEnum('gender').notNull(),
  bloodGroup: text('blood_group'),
  nationality: text('nationality').notNull().default('Afghan'),
  nationalId: text('national_id'),
  photo: text('photo'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  province: text('province'),
  departmentId: text('department_id').references((): AnyPgColumn => departments.id, { onDelete: 'set null' }),
  designation: text('designation'),
  employmentType: employmentTypeEnum('employment_type').notNull().default('full_time'),
  joinDate: timestamp('join_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  status: statusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('staff_school_id_idx').on(table.schoolId),
  staffIdIdx: index('staff_staff_id_idx').on(table.staffId),
  userIdIdx: index('staff_user_id_idx').on(table.userId),
  departmentIdIdx: index('staff_department_id_idx').on(table.departmentId),
  statusIdx: index('staff_status_idx').on(table.status),
}))

export const staffQualifications = pgTable('staff_qualifications', {
  id: text('id').primaryKey(),
  staffId: text('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  degree: text('degree').notNull(),
  field: text('field').notNull(),
  institution: text('institution').notNull(),
  year: integer('year'),
  grade: text('grade'),
  certificateUrl: text('certificate_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  staffIdIdx: index('staff_qualifications_staff_id_idx').on(table.staffId),
}))

export const staffCertifications = pgTable('staff_certifications', {
  id: text('id').primaryKey(),
  staffId: text('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  certificationName: text('certification_name').notNull(),
  issuingAuthority: text('issuing_authority').notNull(),
  issueDate: timestamp('issue_date', { withTimezone: true }).notNull(),
  expiryDate: timestamp('expiry_date', { withTimezone: true }),
  certificateUrl: text('certificate_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  staffIdIdx: index('staff_certifications_staff_id_idx').on(table.staffId),
}))

export const staffTrainings = pgTable('staff_trainings', {
  id: text('id').primaryKey(),
  staffId: text('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  trainingName: text('training_name').notNull(),
  organizer: text('organizer').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  location: text('location'),
  certificateUrl: text('certificate_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  staffIdIdx: index('staff_trainings_staff_id_idx').on(table.staffId),
}))

export const staffAttendance = pgTable('staff_attendance', {
  id: text('id').primaryKey(),
  staffId: text('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).notNull(),
  checkIn: timestamp('check_in', { withTimezone: true }),
  checkOut: timestamp('check_out', { withTimezone: true }),
  status: attendanceStatusEnum('status').notNull(),
  remarks: text('remarks'),
  recordedBy: text('recorded_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  staffIdDateIdx: index('staff_attendance_staff_id_date_idx').on(table.staffId, table.date),
  dateIdx: index('staff_attendance_date_idx').on(table.date),
}))

export const staffLeave = pgTable('staff_leave', {
  id: text('id').primaryKey(),
  staffId: text('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  leaveTypeId: text('leave_type_id').notNull().references(() => leaveTypes.id, { onDelete: 'restrict' }),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  reason: text('reason'),
  status: leaveStatusEnum('status').notNull().default('pending'),
  approvedBy: text('approved_by').references(() => user.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  staffIdIdx: index('staff_leave_staff_id_idx').on(table.staffId),
  statusIdx: index('staff_leave_status_idx').on(table.status),
}))

export const staffLeaveBalances = pgTable('staff_leave_balances', {
  id: text('id').primaryKey(),
  staffId: text('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  leaveTypeId: text('leave_type_id').notNull().references(() => leaveTypes.id, { onDelete: 'cascade' }),
  academicYearId: text('academic_year_id').notNull().references(() => academicYears.id, { onDelete: 'cascade' }),
  totalDays: numeric('total_days').notNull().default('0'),
  usedDays: numeric('used_days').notNull().default('0'),
  remainingDays: numeric('remaining_days').notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  staffLeaveTypeYearUnique: unique().on(table.staffId, table.leaveTypeId, table.academicYearId),
  staffIdIdx: index('staff_leave_balances_staff_id_idx').on(table.staffId),
}))

export const staffAppraisals = pgTable('staff_appraisals', {
  id: text('id').primaryKey(),
  staffId: text('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  appraiserId: text('appraiser_id').notNull().references(() => staff.id, { onDelete: 'restrict' }),
  appraisalPeriod: text('appraisal_period').notNull(),
  rating: numeric('rating').notNull(),
  strengths: text('strengths'),
  areasForImprovement: text('areas_for_improvement'),
  goals: text('goals'),
  comments: text('comments'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  staffIdIdx: index('staff_appraisals_staff_id_idx').on(table.staffId),
  appraiserIdIdx: index('staff_appraisals_appraiser_id_idx').on(table.appraiserId),
}))

export const staffDisciplinaryRecords = pgTable('staff_disciplinary_records', {
  id: text('id').primaryKey(),
  staffId: text('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  incidentDate: timestamp('incident_date', { withTimezone: true }).notNull(),
  incidentDescription: text('incident_description').notNull(),
  severity: disciplineSeverityEnum('severity').notNull(),
  actionTaken: text('action_taken').notNull(),
  reportedBy: text('reported_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  staffIdIdx: index('staff_disciplinary_records_staff_id_idx').on(table.staffId),
}))

export const exitManagement = pgTable('exit_management', {
  id: text('id').primaryKey(),
  staffId: text('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  exitType: text('exit_type').notNull(),
  lastWorkingDate: timestamp('last_working_date', { withTimezone: true }).notNull(),
  reason: text('reason').notNull(),
  clearanceStatus: text('clearance_status').notNull().default('pending'),
  exitInterview: text('exit_interview'),
  processedBy: text('processed_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  staffIdIdx: index('exit_management_staff_id_idx').on(table.staffId),
}))

export const recruitmentApplications = pgTable('recruitment_applications', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  position: text('position').notNull(),
  departmentId: text('department_id').references((): AnyPgColumn => departments.id, { onDelete: 'set null' }),
  applicantName: text('applicant_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  resumeUrl: text('resume_url'),
  status: text('status').notNull().default('received'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('recruitment_applications_school_id_idx').on(table.schoolId),
  statusIdx: index('recruitment_applications_status_idx').on(table.status),
}))

export const interviews = pgTable('interviews', {
  id: text('id').primaryKey(),
  applicationId: text('application_id').notNull().references(() => recruitmentApplications.id, { onDelete: 'cascade' }),
  interviewerId: text('interviewer_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
  interviewDate: timestamp('interview_date', { withTimezone: true }).notNull(),
  location: text('location'),
  type: text('type').notNull(),
  feedback: text('feedback'),
  rating: numeric('rating'),
  status: text('status').notNull().default('scheduled'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  applicationIdIdx: index('interviews_application_id_idx').on(table.applicationId),
  interviewerIdIdx: index('interviews_interviewer_id_idx').on(table.interviewerId),
}))

// ==========================================
// ACADEMIC MANAGEMENT
// ==========================================

export const grades = pgTable('grades', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  level: integer('level').notNull(),
  description: text('description'),
  status: statusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('grades_school_id_idx').on(table.schoolId),
  levelIdx: index('grades_level_idx').on(table.level),
}))

export const sections = pgTable('sections', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  gradeId: text('grade_id').notNull().references(() => grades.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  capacity: integer('capacity'),
  classTeacherId: text('class_teacher_id').references(() => staff.id, { onDelete: 'set null' }),
  status: statusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('sections_school_id_idx').on(table.schoolId),
  gradeIdIdx: index('sections_grade_id_idx').on(table.gradeId),
}))

export const classes = pgTable('classes', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  gradeId: text('grade_id').notNull().references(() => grades.id, { onDelete: 'cascade' }),
  sectionId: text('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  capacity: integer('capacity'),
  roomId: text('room_id').references(() => rooms.id, { onDelete: 'set null' }),
  status: statusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('classes_school_id_idx').on(table.schoolId),
  gradeIdIdx: index('classes_grade_id_idx').on(table.gradeId),
  sectionIdIdx: index('classes_section_id_idx').on(table.sectionId),
}))

export const subjects = pgTable('subjects', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  creditHours: numeric('credit_hours').notNull().default('0'),
  isElective: boolean('is_elective').notNull().default(false),
  status: statusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('subjects_school_id_idx').on(table.schoolId),
  codeIdx: index('subjects_code_idx').on(table.code),
}))

export const subjectGroups = pgTable('subject_groups', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('subject_groups_school_id_idx').on(table.schoolId),
}))

// ==========================================
// TIMETABLE & SCHEDULING
// ==========================================

export const periods = pgTable('periods', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  periodNumber: integer('period_number').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  duration: integer('duration').notNull(),
  isBreak: boolean('is_break').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('periods_school_id_idx').on(table.schoolId),
}))

export const timetableEntries = pgTable('timetable_entries', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  classId: text('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  subjectId: text('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  teacherId: text('teacher_id').references(() => staff.id, { onDelete: 'set null' }),
  roomId: text('room_id').references(() => rooms.id, { onDelete: 'set null' }),
  periodId: text('period_id').notNull().references(() => periods.id, { onDelete: 'cascade' }),
  dayOfWeek: dayOfWeekEnum('day_of_week').notNull(),
  academicYearId: text('academic_year_id').references(() => academicYears.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('timetable_entries_school_id_idx').on(table.schoolId),
  classDayPeriodIdx: index('timetable_entries_class_day_period_idx').on(table.classId, table.dayOfWeek, table.periodId),
  teacherDayPeriodIdx: index('timetable_entries_teacher_day_period_idx').on(table.teacherId, table.dayOfWeek, table.periodId),
}))

export const substitutions = pgTable('substitutions', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  originalTeacherId: text('original_teacher_id').references(() => staff.id, { onDelete: 'set null' }),
  substituteTeacherId: text('substitute_teacher_id').references(() => staff.id, { onDelete: 'set null' }),
  classId: text('class_id').references(() => classes.id, { onDelete: 'cascade' }),
  subjectId: text('subject_id').references(() => subjects.id, { onDelete: 'cascade' }),
  periodId: text('period_id').references(() => periods.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).notNull(),
  reason: text('reason'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('substitutions_school_id_idx').on(table.schoolId),
}))

export const rooms = pgTable('rooms', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  roomType: text('room_type').notNull(),
  capacity: integer('capacity'),
  building: text('building'),
  floor: text('floor'),
  facilities: jsonb('facilities').notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('rooms_school_id_idx').on(table.schoolId),
}))

// ==========================================
// LESSON PLANS & HOMEWORK
// ==========================================

export const lessonPlans = pgTable('lesson_plans', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  teacherId: text('teacher_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  subjectId: text('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  classId: text('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).notNull(),
  periodId: text('period_id').references(() => periods.id, { onDelete: 'set null' }),
  topic: text('topic').notNull(),
  learningObjectives: jsonb('learning_objectives').notNull().default([]),
  priorKnowledge: text('prior_knowledge'),
  teachingMaterials: jsonb('teaching_materials').notNull().default([]),
  methodology: text('methodology'),
  activities: jsonb('activities').notNull().default([]),
  assessment: text('assessment'),
  homework: text('homework'),
  reflection: text('reflection'),
  principalRemarks: text('principal_remarks'),
  status: text('status').notNull().default('draft'),
  approvedBy: text('approved_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('lesson_plans_school_id_idx').on(table.schoolId),
  teacherIdx: index('lesson_plans_teacher_id_idx').on(table.teacherId),
  classDateIdx: index('lesson_plans_class_date_idx').on(table.classId, table.date),
}))

export const homework = pgTable('homework', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  teacherId: text('teacher_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  subjectId: text('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  classId: text('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  assignedDate: timestamp('assigned_date', { withTimezone: true }).notNull().defaultNow(),
  maxMarks: numeric('max_marks').notNull().default('0'),
  attachments: jsonb('attachments').notNull().default([]),
  type: text('type').notNull().default('homework'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('homework_school_id_idx').on(table.schoolId),
  classDueIdx: index('homework_class_due_idx').on(table.classId, table.dueDate),
}))

export const homeworkSubmissions = pgTable('homework_submissions', {
  id: text('id').primaryKey(),
  homeworkId: text('homework_id').notNull().references(() => homework.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  submissionDate: timestamp('submission_date', { withTimezone: true }).notNull().defaultNow(),
  content: text('content'),
  attachments: jsonb('attachments').notNull().default([]),
  marks: numeric('marks'),
  feedback: text('feedback'),
  gradedBy: text('graded_by').references(() => staff.id, { onDelete: 'set null' }),
  gradedAt: timestamp('graded_at', { withTimezone: true }),
  status: text('status').notNull().default('submitted'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  homeworkStudentUnique: unique().on(table.homeworkId, table.studentId),
  homeworkIdx: index('homework_submissions_homework_id_idx').on(table.homeworkId),
  studentIdx: index('homework_submissions_student_id_idx').on(table.studentId),
}))

// ==========================================
// ATTENDANCE
// ==========================================

export const studentAttendance = pgTable('student_attendance', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  classId: text('class_id').references(() => classes.id, { onDelete: 'set null' }),
  date: timestamp('date', { withTimezone: true }).notNull(),
  status: attendanceStatusEnum('status').notNull().default('present'),
  remarks: text('remarks'),
  recordedBy: text('recorded_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('student_attendance_school_id_idx').on(table.schoolId),
  studentDateUnique: unique().on(table.studentId, table.date),
  classDateIdx: index('student_attendance_class_date_idx').on(table.classId, table.date),
  dateIdx: index('student_attendance_date_idx').on(table.date),
}))

// ==========================================
// EXAMINATIONS & ASSESSMENT
// ==========================================

export const exams = pgTable('exams', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  examType: text('exam_type').notNull(),
  academicYearId: text('academic_year_id').references(() => academicYears.id, { onDelete: 'cascade' }),
  termId: text('term_id').references(() => terms.id, { onDelete: 'cascade' }),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  totalMarks: numeric('total_marks').notNull().default('100'),
  passMarks: numeric('pass_marks').notNull().default('40'),
  status: examStatusEnum('status').notNull().default('scheduled'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('exams_school_id_idx').on(table.schoolId),
  academicYearIdx: index('exams_academic_year_id_idx').on(table.academicYearId),
  statusIdx: index('exams_status_idx').on(table.status),
}))

export const examSchedules = pgTable('exam_schedules', {
  id: text('id').primaryKey(),
  examId: text('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  subjectId: text('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  classId: text('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  duration: integer('duration').notNull(),
  roomId: text('room_id').references(() => rooms.id, { onDelete: 'set null' }),
  maxMarks: numeric('max_marks').notNull().default('100'),
  passMarks: numeric('pass_marks').notNull().default('40'),
  invigilators: jsonb('invigilators').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  examIdx: index('exam_schedules_exam_id_idx').on(table.examId),
  classDateIdx: index('exam_schedules_class_date_idx').on(table.classId, table.date),
}))

export const examMarks = pgTable('exam_marks', {
  id: text('id').primaryKey(),
  examScheduleId: text('exam_schedule_id').notNull().references(() => examSchedules.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  theoryMarks: numeric('theory_marks'),
  practicalMarks: numeric('practical_marks'),
  internalAssessment: numeric('internal_assessment'),
  totalMarks: numeric('total_marks'),
  grade: text('grade'),
  remarks: text('remarks'),
  status: text('status').notNull().default('present'),
  enteredBy: text('entered_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  scheduleStudentUnique: unique().on(table.examScheduleId, table.studentId),
  studentIdx: index('exam_marks_student_id_idx').on(table.studentId),
}))

export const examResults = pgTable('exam_results', {
  id: text('id').primaryKey(),
  examId: text('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  classId: text('class_id').references(() => classes.id, { onDelete: 'set null' }),
  totalMarks: numeric('total_marks').notNull().default('0'),
  maxMarks: numeric('max_marks').notNull().default('0'),
  percentage: numeric('percentage').notNull().default('0'),
  grade: text('grade'),
  result: text('result').notNull().default('pending'),
  rank: integer('rank'),
  classRank: integer('class_rank'),
  sectionRank: integer('section_rank'),
  remarks: text('remarks'),
  approvedBy: text('approved_by').references(() => user.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  examStudentUnique: unique().on(table.examId, table.studentId),
  examIdx: index('exam_results_exam_id_idx').on(table.examId),
  studentIdx: index('exam_results_student_id_idx').on(table.studentId),
}))

export const reportCards = pgTable('report_cards', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  classId: text('class_id').references(() => classes.id, { onDelete: 'set null' }),
  examId: text('exam_id').references(() => exams.id, { onDelete: 'set null' }),
  termId: text('term_id').references(() => terms.id, { onDelete: 'set null' }),
  academicYearId: text('academic_year_id').references(() => academicYears.id, { onDelete: 'cascade' }),
  totalMarks: numeric('total_marks').notNull().default('0'),
  maxMarks: numeric('max_marks').notNull().default('0'),
  percentage: numeric('percentage').notNull().default('0'),
  grade: text('grade'),
  result: text('result').notNull().default('pending'),
  rank: integer('rank'),
  attendancePresent: integer('attendance_present').notNull().default(0),
  attendanceTotal: integer('attendance_total').notNull().default(0),
  attendancePercentage: numeric('attendance_percentage').notNull().default('0'),
  teacherRemarks: text('teacher_remarks'),
  principalRemarks: text('principal_remarks'),
  promotedTo: text('promoted_to'),
  generatedBy: text('generated_by').references(() => user.id, { onDelete: 'set null' }),
  generatedAt: timestamp('generated_at', { withTimezone: true }),
  status: text('status').notNull().default('draft', ),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('report_cards_school_id_idx').on(table.schoolId),
  studentExamUnique: unique().on(table.studentId, table.examId),
  studentIdx: index('report_cards_student_id_idx').on(table.studentId),
}))

// ==========================================
// FEE & FINANCIAL MANAGEMENT
// ==========================================

export const feeStructures = pgTable('fee_structures', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  feeType: text('fee_type').notNull(),
  amount: numeric('amount').notNull().default('0'),
  frequency: text('frequency').notNull().default('monthly'),
  gradeId: text('grade_id').references(() => grades.id, { onDelete: 'cascade' }),
  sectionId: text('section_id').references(() => sections.id, { onDelete: 'cascade' }),
  dueDate: integer('due_date').notNull().default(10),
  lateFeeAmount: numeric('late_fee_amount').notNull().default('0'),
  lateFeeType: text('late_fee_type').notNull().default('fixed'),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
  effectiveTo: timestamp('effective_to', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('fee_structures_school_id_idx').on(table.schoolId),
}))

export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  feeStructureId: text('fee_structure_id').references(() => feeStructures.id, { onDelete: 'set null' }),
  issueDate: timestamp('issue_date', { withTimezone: true }).notNull().defaultNow(),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  subtotal: numeric('subtotal').notNull().default('0'),
  discount: numeric('discount').notNull().default('0'),
  tax: numeric('tax').notNull().default('0'),
  totalAmount: numeric('total_amount').notNull().default('0'),
  paidAmount: numeric('paid_amount').notNull().default('0'),
  balanceAmount: numeric('balance_amount').notNull().default('0'),
  status: feeStatusEnum('status').notNull().default('pending'),
  notes: text('notes'),
  generatedBy: text('generated_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('invoices_school_id_idx').on(table.schoolId),
  invoiceNumberIdx: index('invoices_invoice_number_idx').on(table.invoiceNumber),
  studentIdx: index('invoices_student_id_idx').on(table.studentId),
  statusIdx: index('invoices_status_idx').on(table.status),
  dueDateIdx: index('invoices_due_date_idx').on(table.dueDate),
}))

export const invoiceItems = pgTable('invoice_items', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  feeStructureId: text('fee_structure_id').references(() => feeStructures.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  quantity: numeric('quantity').notNull().default('1'),
  unitPrice: numeric('unit_price').notNull().default('0'),
  discount: numeric('discount').notNull().default('0'),
  tax: numeric('tax').notNull().default('0'),
  amount: numeric('amount').notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  invoiceIdx: index('invoice_items_invoice_id_idx').on(table.invoiceId),
}))

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  receiptNumber: text('receipt_number').notNull().unique(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  invoiceId: text('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
  amount: numeric('amount').notNull().default('0'),
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('cash'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('completed'),
  transactionId: text('transaction_id'),
  referenceNumber: text('reference_number'),
  bankName: text('bank_name'),
  chequeNumber: text('cheque_number'),
  mobileProvider: text('mobile_provider'),
  paymentDate: timestamp('payment_date', { withTimezone: true }).notNull().defaultNow(),
  receivedBy: text('received_by').references(() => user.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('payments_school_id_idx').on(table.schoolId),
  receiptNumberIdx: index('payments_receipt_number_idx').on(table.receiptNumber),
  studentIdx: index('payments_student_id_idx').on(table.studentId),
  paymentDateIdx: index('payments_payment_date_idx').on(table.paymentDate),
  paymentMethodIdx: index('payments_payment_method_idx').on(table.paymentMethod),
}))

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  expenseNumber: text('expense_number').notNull().unique(),
  category: text('category').notNull(),
  subcategory: text('subcategory'),
  description: text('description'),
  amount: numeric('amount').notNull().default('0'),
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('cash'),
  vendor: text('vendor'),
  invoiceNumber: text('invoice_number'),
  expenseDate: timestamp('expense_date', { withTimezone: true }).notNull().defaultNow(),
  approvedBy: text('approved_by').references(() => user.id, { onDelete: 'set null' }),
  enteredBy: text('entered_by').references(() => user.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('approved'),
  attachments: jsonb('attachments').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('expenses_school_id_idx').on(table.schoolId),
  expenseNumberIdx: index('expenses_expense_number_idx').on(table.expenseNumber),
  categoryIdx: index('expenses_category_idx').on(table.category),
  expenseDateIdx: index('expenses_expense_date_idx').on(table.expenseDate),
}))

export const budgets = pgTable('budgets', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  subcategory: text('subcategory'),
  academicYearId: text('academic_year_id').references(() => academicYears.id, { onDelete: 'cascade' }),
  allocatedAmount: numeric('allocated_amount').notNull().default('0'),
  spentAmount: numeric('spent_amount').notNull().default('0'),
  remainingAmount: numeric('remaining_amount').notNull().default('0'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('budgets_school_id_idx').on(table.schoolId),
  categoryYearUnique: unique().on(table.schoolId, table.category, table.academicYearId),
}))

export const discounts = pgTable('discounts', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('student_id').references(() => students.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  discountType: text('discount_type').notNull().default('percentage'),
  discountValue: numeric('discount_value').notNull().default('0'),
  applicableFeeTypes: jsonb('applicable_fee_types').notNull().default([]),
  startDate: timestamp('start_date', { withTimezone: true }).notNull().defaultNow(),
  endDate: timestamp('end_date', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  approvedBy: text('approved_by').references(() => user.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('discounts_school_id_idx').on(table.schoolId),
  studentIdx: index('discounts_student_id_idx').on(table.studentId),
}))

// ==========================================
// PAYROLL MANAGEMENT
// ==========================================

export const salaryStructures = pgTable('salary_structures', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  staffId: text('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }).unique(),
  basicSalary: numeric('basic_salary').notNull().default('0'),
  houseAllowance: numeric('house_allowance').notNull().default('0'),
  transportAllowance: numeric('transport_allowance').notNull().default('0'),
  foodAllowance: numeric('food_allowance').notNull().default('0'),
  positionAllowance: numeric('position_allowance').notNull().default('0'),
  performanceBonus: numeric('performance_bonus').notNull().default('0'),
  overtimeRate: numeric('overtime_rate').notNull().default('0'),
  taxDeduction: numeric('tax_deduction').notNull().default('0'),
  loanDeduction: numeric('loan_deduction').notNull().default('0'),
  otherDeductions: numeric('other_deductions').notNull().default('0'),
  bankName: text('bank_name'),
  bankBranch: text('bank_branch'),
  accountNumber: text('account_number'),
  accountHolder: text('account_holder'),
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('bank_transfer'),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
  effectiveTo: timestamp('effective_to', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('salary_structures_school_id_idx').on(table.schoolId),
  staffIdIdx: index('salary_structures_staff_id_idx').on(table.staffId),
  activeIdx: index('salary_structures_active_idx').on(table.isActive),
}))

export const payrollRuns = pgTable('payroll_runs', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  periodLabel: text('period_label').notNull(),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  status: payrollStatusEnum('status').notNull().default('draft'),
  employeeCount: integer('employee_count').notNull().default(0),
  totalGross: numeric('total_gross').notNull().default('0'),
  totalDeductions: numeric('total_deductions').notNull().default('0'),
  totalNet: numeric('total_net').notNull().default('0'),
  notes: text('notes'),
  generatedBy: text('generated_by').references(() => user.id, { onDelete: 'set null' }),
  approvedBy: text('approved_by').references(() => user.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  paidBy: text('paid_by').references(() => user.id, { onDelete: 'set null' }),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('payroll_runs_school_id_idx').on(table.schoolId),
  statusIdx: index('payroll_runs_status_idx').on(table.status),
  schoolPeriodUnique: unique().on(table.schoolId, table.periodLabel),
}))

export const payslips = pgTable('payslips', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  payrollRunId: text('payroll_run_id').notNull().references(() => payrollRuns.id, { onDelete: 'cascade' }),
  staffId: text('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  slipNumber: text('slip_number').notNull().unique(),
  basicSalary: numeric('basic_salary').notNull().default('0'),
  houseAllowance: numeric('house_allowance').notNull().default('0'),
  transportAllowance: numeric('transport_allowance').notNull().default('0'),
  foodAllowance: numeric('food_allowance').notNull().default('0'),
  positionAllowance: numeric('position_allowance').notNull().default('0'),
  performanceBonus: numeric('performance_bonus').notNull().default('0'),
  overtimePay: numeric('overtime_pay').notNull().default('0'),
  grossSalary: numeric('gross_salary').notNull().default('0'),
  taxDeduction: numeric('tax_deduction').notNull().default('0'),
  loanRepayment: numeric('loan_repayment').notNull().default('0'),
  absenceDeduction: numeric('absence_deduction').notNull().default('0'),
  otherDeductions: numeric('other_deductions').notNull().default('0'),
  totalDeductions: numeric('total_deductions').notNull().default('0'),
  netSalary: numeric('net_salary').notNull().default('0'),
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('bank_transfer'),
  status: payslipStatusEnum('status').notNull().default('pending'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  remarks: text('remarks'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  runStaffUnique: unique().on(table.payrollRunId, table.staffId),
  schoolIdIdx: index('payslips_school_id_idx').on(table.schoolId),
  runIdx: index('payslips_payroll_run_id_idx').on(table.payrollRunId),
  staffIdx: index('payslips_staff_id_idx').on(table.staffId),
  statusIdx: index('payslips_status_idx').on(table.status),
}))

// ==========================================
// LIBRARY MANAGEMENT
// ==========================================

export const books = pgTable('books', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  bookId: text('book_id').notNull().unique(),
  isbn: text('isbn'),
  title: text('title').notNull(),
  titleDari: text('title_dari'),
  titlePashto: text('title_pashto'),
  author: text('author'),
  translator: text('translator'),
  publisher: text('publisher'),
  publicationYear: integer('publication_year'),
  edition: text('edition'),
  language: text('language').notNull().default('Dari'),
  category: text('category'),
  subcategory: text('subcategory'),
  gradeLevel: text('grade_level'),
  bookType: text('book_type').notNull().default('textbook'),
  deweyDecimal: text('dewey_decimal'),
  totalCopies: integer('total_copies').notNull().default(1),
  availableCopies: integer('available_copies').notNull().default(1),
  shelfLocation: text('shelf_location'),
  rackNumber: text('rack_number'),
  condition: text('condition').notNull().default('new'),
  price: numeric('price').notNull().default('0'),
  acquisitionDate: timestamp('acquisition_date', { withTimezone: true }).notNull().defaultNow(),
  acquisitionSource: text('acquisition_source').notNull().default('purchase'),
  coverImage: text('cover_image'),
  description: text('description'),
  keywords: jsonb('keywords').notNull().default([]),
  status: bookStatusEnum('status').notNull().default('available'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('books_school_id_idx').on(table.schoolId),
  bookIdIdx: index('books_book_id_idx').on(table.bookId),
  isbnIdx: index('books_isbn_idx').on(table.isbn),
  titleIdx: index('books_title_idx').on(table.title),
  categoryIdx: index('books_category_idx').on(table.category),
}))

export const libraryMembers = pgTable('library_members', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  memberId: text('member_id').notNull().unique(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  studentId: text('student_id').references(() => students.id, { onDelete: 'set null' }),
  staffId: text('staff_id').references(() => staff.id, { onDelete: 'set null' }),
  memberType: text('member_type').notNull().default('student'),
  maxBooks: integer('max_books').notNull().default(3),
  loanPeriod: integer('loan_period').notNull().default(14),
  renewalLimit: integer('renewal_limit').notNull().default(2),
  finePerDay: numeric('fine_per_day').notNull().default('5'),
  isActive: boolean('is_active').notNull().default(true),
  joinedDate: timestamp('joined_date', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('library_members_school_id_idx').on(table.schoolId),
  memberIdIdx: index('library_members_member_id_idx').on(table.memberId),
}))

export const bookIssues = pgTable('book_issues', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  issueNumber: text('issue_number').notNull().unique(),
  bookId: text('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  memberId: text('member_id').notNull().references(() => libraryMembers.id, { onDelete: 'cascade' }),
  issueDate: timestamp('issue_date', { withTimezone: true }).notNull().defaultNow(),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  returnDate: timestamp('return_date', { withTimezone: true }),
  conditionAtIssue: text('condition_at_issue').notNull().default('good'),
  conditionAtReturn: text('condition_at_return'),
  fineAmount: numeric('fine_amount').notNull().default('0'),
  finePaid: boolean('fine_paid').notNull().default(false),
  issuedBy: text('issued_by').references(() => user.id, { onDelete: 'set null' }),
  returnedBy: text('returned_by').references(() => user.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('issued'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('book_issues_school_id_idx').on(table.schoolId),
  issueNumberIdx: index('book_issues_issue_number_idx').on(table.issueNumber),
  bookIdx: index('book_issues_book_id_idx').on(table.bookId),
  memberIdx: index('book_issues_member_id_idx').on(table.memberId),
  statusIdx: index('book_issues_status_idx').on(table.status),
  dueDateIdx: index('book_issues_due_date_idx').on(table.dueDate),
}))

export const bookReservations = pgTable('book_reservations', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  bookId: text('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  memberId: text('member_id').notNull().references(() => libraryMembers.id, { onDelete: 'cascade' }),
  reservedDate: timestamp('reserved_date', { withTimezone: true }).notNull().defaultNow(),
  expiryDate: timestamp('expiry_date', { withTimezone: true }).notNull(),
  fulfilledAt: timestamp('fulfilled_at', { withTimezone: true }),
  status: reservationStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('book_reservations_school_id_idx').on(table.schoolId),
  bookMemberUnique: unique().on(table.bookId, table.memberId),
  bookIdx: index('book_reservations_book_id_idx').on(table.bookId),
  memberIdx: index('book_reservations_member_id_idx').on(table.memberId),
}))

// ==========================================
// TRANSPORT MANAGEMENT
// ==========================================

export const transportRoutes = pgTable('transport_routes', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  routeId: text('route_id').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  startPoint: text('start_point').notNull(),
  endPoint: text('end_point').notNull(),
  distance: numeric('distance').notNull().default('0'),
  estimatedTime: text('estimated_time'),
  numberOfStops: integer('number_of_stops').notNull().default(0),
  stops: jsonb('stops').notNull().default([]),
  vehicleId: text('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
  driverId: text('driver_id').references(() => staff.id, { onDelete: 'set null' }),
  attendantId: text('attendant_id').references(() => staff.id, { onDelete: 'set null' }),
  shiftType: shiftTypeEnum('shift_type').notNull().default('morning'),
  feeAmount: numeric('fee_amount').notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('transport_routes_school_id_idx').on(table.schoolId),
  routeIdIdx: index('transport_routes_route_id_idx').on(table.routeId),
}))

export const vehicles = pgTable('vehicles', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  vehicleId: text('vehicle_id').notNull().unique(),
  registrationNumber: text('registration_number').notNull().unique(),
  vehicleType: text('vehicle_type').notNull(),
  make: text('make'),
  model: text('model'),
  year: integer('year'),
  capacity: integer('capacity'),
  color: text('color'),
  engineNumber: text('engine_number'),
  chassisNumber: text('chassis_number'),
  insuranceDetails: jsonb('insurance_details').notNull().default({}),
  insuranceExpiry: timestamp('insurance_expiry', { withTimezone: true }),
  registrationExpiry: timestamp('registration_expiry', { withTimezone: true }),
  fitnessCertificate: text('fitness_certificate'),
  fitnessExpiry: timestamp('fitness_expiry', { withTimezone: true }),
  purchaseDate: timestamp('purchase_date', { withTimezone: true }),
  purchasePrice: numeric('purchase_price').notNull().default('0'),
  ownerInfo: jsonb('owner_info').notNull().default({}),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('vehicles_school_id_idx').on(table.schoolId),
  vehicleIdIdx: index('vehicles_vehicle_id_idx').on(table.vehicleId),
  registrationNumberIdx: index('vehicles_registration_number_idx').on(table.registrationNumber),
}))

export const vehicleMaintenance = pgTable('vehicle_maintenance', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  maintenanceType: text('maintenance_type').notNull(),
  description: text('description'),
  cost: numeric('cost').notNull().default('0'),
  serviceDate: timestamp('service_date', { withTimezone: true }).notNull().defaultNow(),
  nextServiceDate: timestamp('next_service_date', { withTimezone: true }),
  odometerReading: integer('odometer_reading'),
  serviceProvider: text('service_provider'),
  status: maintenanceStatusEnum('status').notNull().default('completed'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  vehicleIdx: index('vehicle_maintenance_vehicle_id_idx').on(table.vehicleId),
}))

export const studentTransport = pgTable('student_transport', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  routeId: text('route_id').notNull().references(() => transportRoutes.id, { onDelete: 'cascade' }),
  stopName: text('stop_name'),
  pickupTime: text('pickup_time'),
  dropTime: text('drop_time'),
  transportFee: numeric('transport_fee').notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
  parentConsent: boolean('parent_consent').notNull().default(true),
  emergencyContact: text('emergency_contact'),
  specialNeeds: text('special_needs'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull().defaultNow(),
  endDate: timestamp('end_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('student_transport_school_id_idx').on(table.schoolId),
  studentRouteUnique: unique().on(table.studentId, table.routeId),
  studentIdx: index('student_transport_student_id_idx').on(table.studentId),
  routeIdx: index('student_transport_route_id_idx').on(table.routeId),
}))

export const transportAttendance = pgTable('transport_attendance', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentTransportId: text('student_transport_id').notNull().references(() => studentTransport.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).notNull(),
  boardingTime: text('boarding_time'),
  dropTime: text('drop_time'),
  boardingStatus: text('boarding_status').notNull().default('present'),
  dropStatus: text('drop_status').notNull().default('present'),
  smsSent: boolean('sms_sent').notNull().default(false),
  recordedBy: text('recorded_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('transport_attendance_school_id_idx').on(table.schoolId),
  studentDateUnique: unique().on(table.studentTransportId, table.date),
  dateIdx: index('transport_attendance_date_idx').on(table.date),
}))

// ==========================================
// HOSTEL MANAGEMENT
// ==========================================

export const hostels = pgTable('hostels', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  hostelType: text('hostel_type').notNull(),
  totalRooms: integer('total_rooms').notNull().default(0),
  totalBeds: integer('total_beds').notNull().default(0),
  wardenId: text('warden_id').references(() => staff.id, { onDelete: 'set null' }),
  timings: jsonb('timings').notNull().default({}),
  visitorPolicy: text('visitor_policy'),
  messInfo: jsonb('mess_info').notNull().default({}),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('hostels_school_id_idx').on(table.schoolId),
}))

export const hostelRooms = pgTable('hostel_rooms', {
  id: text('id').primaryKey(),
  hostelId: text('hostel_id').notNull().references(() => hostels.id, { onDelete: 'cascade' }),
  roomNumber: text('room_number').notNull(),
  roomType: text('room_type').notNull().default('dormitory'),
  capacity: integer('capacity').notNull().default(4),
  occupiedBeds: integer('occupied_beds').notNull().default(0),
  facilities: jsonb('facilities').notNull().default([]),
  floor: text('floor'),
  wing: text('wing'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  hostelIdx: index('hostel_rooms_hostel_id_idx').on(table.hostelId),
  hostelRoomUnique: unique().on(table.hostelId, table.roomNumber),
}))

export const hostelAllocations = pgTable('hostel_allocations', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  roomId: text('room_id').notNull().references(() => hostelRooms.id, { onDelete: 'cascade' }),
  bedNumber: text('bed_number'),
  allocationDate: timestamp('allocation_date', { withTimezone: true }).notNull().defaultNow(),
  expectedVacateDate: timestamp('expected_vacate_date', { withTimezone: true }),
  actualVacateDate: timestamp('actual_vacate_date', { withTimezone: true }),
  hostelFee: numeric('hostel_fee').notNull().default('0'),
  messFee: numeric('mess_fee').notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
  status: text('status').notNull().default('active'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('hostel_allocations_school_id_idx').on(table.schoolId),
  studentRoomUnique: unique().on(table.studentId, table.roomId),
  studentIdx: index('hostel_allocations_student_id_idx').on(table.studentId),
  roomIdx: index('hostel_allocations_room_id_idx').on(table.roomId),
}))

export const hostelAttendance = pgTable('hostel_attendance', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).notNull(),
  morningAttendance: text('morning_attendance').notNull().default('present'),
  eveningAttendance: text('evening_attendance').notNull().default('present'),
  nightAttendance: text('night_attendance').notNull().default('present'),
  leaveType: text('leave_type'),
  outpassNumber: text('outpass_number'),
  outTime: text('out_time'),
  inTime: text('in_time'),
  remarks: text('remarks'),
  recordedBy: text('recorded_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('hostel_attendance_school_id_idx').on(table.schoolId),
  studentDateUnique: unique().on(table.studentId, table.date),
  dateIdx: index('hostel_attendance_date_idx').on(table.date),
}))

export const hostelDiscipline = pgTable('hostel_discipline', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  incidentDate: timestamp('incident_date', { withTimezone: true }).notNull().defaultNow(),
  incidentType: text('incident_type').notNull(),
  description: text('description').notNull(),
  severity: disciplineSeverityEnum('severity').notNull().default('minor'),
  actionTaken: text('action_taken'),
  reportedBy: text('reported_by').references(() => user.id, { onDelete: 'set null' }),
  parentNotified: boolean('parent_notified').notNull().default(false),
  status: text('status').notNull().default('open'),
  followUp: text('follow_up'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('hostel_discipline_school_id_idx').on(table.schoolId),
  studentIdx: index('hostel_discipline_student_id_idx').on(table.studentId),
}))

export const messMenus = pgTable('mess_menus', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  hostelId: text('hostel_id').notNull().references(() => hostels.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).notNull(),
  mealType: text('meal_type').notNull(),
  menu: jsonb('menu').notNull().default([]),
  specialMeal: text('special_meal'),
  preparedBy: text('prepared_by'),
  feedback: jsonb('feedback').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('mess_menus_school_id_idx').on(table.schoolId),
  hostelDateMealUnique: unique().on(table.hostelId, table.date, table.mealType),
}))

// ==========================================
// COMMUNICATION & NOTIFICATION
// ==========================================

export const announcements = pgTable('announcements', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  titleDari: text('title_dari'),
  titlePashto: text('title_pashto'),
  description: text('description').notNull(),
  descriptionDari: text('description_dari'),
  descriptionPashto: text('description_pashto'),
  category: text('category').notNull().default('general'),
  priority: noticePriorityEnum('priority').notNull().default('medium'),
  targetAudience: jsonb('target_audience').notNull().default(['all']),
  targetGrades: jsonb('target_grades').notNull().default([]),
  targetClasses: jsonb('target_classes').notNull().default([]),
  attachment: text('attachment'),
  publishDate: timestamp('publish_date', { withTimezone: true }).notNull().defaultNow(),
  expiryDate: timestamp('expiry_date', { withTimezone: true }),
  isPinned: boolean('is_pinned').notNull().default(false),
  viewCount: integer('view_count').notNull().default(0),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('published'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('announcements_school_id_idx').on(table.schoolId),
  priorityIdx: index('announcements_priority_idx').on(table.priority),
  categoryIdx: index('announcements_category_idx').on(table.category),
  publishDateIdx: index('announcements_publish_date_idx').on(table.publishDate),
}))

export const smsMessages = pgTable('sms_messages', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  recipientType: text('recipient_type').notNull(),
  recipientId: text('recipient_id'),
  phoneNumber: text('phone_number').notNull(),
  message: text('message').notNull(),
  templateId: text('template_id'),
  senderId: text('sender_id'),
  provider: text('provider'),
  status: text('status').notNull().default('pending'),
  deliveryReport: jsonb('delivery_report').notNull().default({}),
  cost: numeric('cost').notNull().default('0'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('sms_messages_school_id_idx').on(table.schoolId),
  phoneIdx: index('sms_messages_phone_number_idx').on(table.phoneNumber),
  statusIdx: index('sms_messages_status_idx').on(table.status),
}))

export const emailMessages = pgTable('email_messages', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  recipientType: text('recipient_type').notNull(),
  recipientId: text('recipient_id'),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  templateId: text('template_id'),
  attachments: jsonb('attachments').notNull().default([]),
  status: text('status').notNull().default('pending'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  bounceReason: text('bounce_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('email_messages_school_id_idx').on(table.schoolId),
  emailIdx: index('email_messages_email_idx').on(table.email),
  statusIdx: index('email_messages_status_idx').on(table.status),
}))

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  notificationType: notificationTypeEnum('notification_type').notNull().default('info'),
  module: text('module'),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  actionUrl: text('action_url'),
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('notifications_school_id_idx').on(table.schoolId),
  userIdIdx: index('notifications_user_id_idx').on(table.userId),
  isReadIdx: index('notifications_is_read_idx').on(table.isRead),
  createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
}))

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  recipientId: text('recipient_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  groupId: text('group_id'),
  message: text('message').notNull(),
  attachments: jsonb('attachments').notNull().default([]),
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at', { withTimezone: true }),
  parentMessageId: text('parent_message_id').references((): AnyPgColumn => messages.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('messages_school_id_idx').on(table.schoolId),
  senderIdx: index('messages_sender_id_idx').on(table.senderId),
  recipientIdx: index('messages_recipient_id_idx').on(table.recipientId),
  groupIdx: index('messages_group_id_idx').on(table.groupId),
}))

export const events = pgTable('events', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  titleDari: text('title_dari'),
  titlePashto: text('title_pashto'),
  description: text('description'),
  eventType: eventTypeEnum('event_type').notNull().default('academic'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  venue: text('venue'),
  organizer: text('organizer'),
  targetAudience: jsonb('target_audience').notNull().default(['all']),
  budget: numeric('budget').notNull().default('0'),
  actualCost: numeric('actual_cost').notNull().default('0'),
  chiefGuest: text('chief_guest'),
  invitationUrl: text('invitation_url'),
  attachments: jsonb('attachments').notNull().default([]),
  isPublished: boolean('is_published').notNull().default(false),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('planned'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('events_school_id_idx').on(table.schoolId),
  eventTypeIdx: index('events_event_type_idx').on(table.eventType),
  startDateIdx: index('events_start_date_idx').on(table.startDate),
}))

export const surveys = pgTable('surveys', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  surveyType: surveyTypeEnum('survey_type').notNull().default('feedback'),
  targetAudience: jsonb('target_audience').notNull().default(['all']),
  questions: jsonb('questions').notNull().default([]),
  startDate: timestamp('start_date', { withTimezone: true }).notNull().defaultNow(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  isAnonymous: boolean('is_anonymous').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('surveys_school_id_idx').on(table.schoolId),
  surveyTypeIdx: index('surveys_survey_type_idx').on(table.surveyType),
}))

export const surveyResponses = pgTable('survey_responses', {
  id: text('id').primaryKey(),
  surveyId: text('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  responses: jsonb('responses').notNull().default({}),
  rating: integer('rating'),
  sentiment: text('sentiment'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  surveyIdx: index('survey_responses_survey_id_idx').on(table.surveyId),
  userIdx: index('survey_responses_user_id_idx').on(table.userId),
}))

export const grievances = pgTable('grievances', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  grievanceNumber: text('grievance_number').notNull().unique(),
  category: text('category').notNull(),
  subcategory: text('subcategory'),
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  complainantName: text('complainant_name'),
  complainantType: text('complainant_type').notNull().default('parent'),
  complainantId: text('complainant_id').references(() => user.id, { onDelete: 'set null' }),
  contactInfo: jsonb('contact_info').notNull().default({}),
  isAnonymous: boolean('is_anonymous').notNull().default(false),
  attachments: jsonb('attachments').notNull().default([]),
  priority: priorityEnum('priority').notNull().default('medium'),
  assignedTo: text('assigned_to').references(() => user.id, { onDelete: 'set null' }),
  resolution: text('resolution'),
  feedback: text('feedback'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  status: text('status').notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('grievances_school_id_idx').on(table.schoolId),
  grievanceNumberIdx: index('grievances_grievance_number_idx').on(table.grievanceNumber),
  categoryIdx: index('grievances_category_idx').on(table.category),
  statusIdx: index('grievances_status_idx').on(table.status),
}))

// ==========================================
// DISCIPLINE & ACHIEVEMENTS
// ==========================================

export const studentDiscipline = pgTable('student_discipline', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  incidentDate: timestamp('incident_date', { withTimezone: true }).notNull().defaultNow(),
  incidentType: text('incident_type').notNull(),
  description: text('description').notNull(),
  severity: disciplineSeverityEnum('severity').notNull().default('minor'),
  actionTaken: text('action_taken'),
  reportedBy: text('reported_by').references(() => user.id, { onDelete: 'set null' }),
  parentNotified: boolean('parent_notified').notNull().default(false),
  parentAcknowledged: boolean('parent_acknowledged').notNull().default(false),
  followUp: text('follow_up'),
  status: disciplineStatusEnum('status').notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('student_discipline_school_id_idx').on(table.schoolId),
  studentIdx: index('student_discipline_student_id_idx').on(table.studentId),
  statusIdx: index('student_discipline_status_idx').on(table.status),
}))

export const studentAchievements = pgTable('student_achievements', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  achievementType: text('achievement_type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  event: text('event'),
  organizer: text('organizer'),
  date: timestamp('date', { withTimezone: true }).notNull().defaultNow(),
  position: text('position'),
  award: text('award'),
  certificateUrl: text('certificate_url'),
  points: integer('points').notNull().default(0),
  recordedBy: text('recorded_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('student_achievements_school_id_idx').on(table.schoolId),
  studentIdx: index('student_achievements_student_id_idx').on(table.studentId),
}))

// ==========================================
// INVENTORY & ASSETS
// ==========================================

export const assets = pgTable('assets', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  assetCode: text('asset_code').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  subcategory: text('subcategory'),
  description: text('description'),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price').notNull().default('0'),
  totalValue: numeric('total_value').notNull().default('0'),
  location: text('location'),
  roomId: text('room_id').references(() => rooms.id, { onDelete: 'set null' }),
  assignedTo: text('assigned_to').references(() => staff.id, { onDelete: 'set null' }),
  purchaseDate: timestamp('purchase_date', { withTimezone: true }).notNull().defaultNow(),
  warrantyExpiry: timestamp('warranty_expiry', { withTimezone: true }),
  condition: text('condition').notNull().default('new'),
  status: assetStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('assets_school_id_idx').on(table.schoolId),
  assetCodeIdx: index('assets_asset_code_idx').on(table.assetCode),
  categoryIdx: index('assets_category_idx').on(table.category),
}))

export const stockMovements = pgTable('stock_movements', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  assetId: text('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  movementType: stockMovementTypeEnum('movement_type').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price').notNull().default('0'),
  totalValue: numeric('total_value').notNull().default('0'),
  reference: text('reference'),
  vendor: text('vendor'),
  remarks: text('remarks'),
  movementDate: timestamp('movement_date', { withTimezone: true }).notNull().defaultNow(),
  recordedBy: text('recorded_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('stock_movements_school_id_idx').on(table.schoolId),
  assetIdx: index('stock_movements_asset_id_idx').on(table.assetId),
  movementTypeIdx: index('stock_movements_movement_type_idx').on(table.movementType),
}))

// ==========================================
// MOE COMPLIANCE
// ==========================================

export const moeReports = pgTable('moe_reports', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  reportType: text('report_type').notNull(),
  reportName: text('report_name').notNull(),
  period: text('period').notNull(),
  submissionDate: timestamp('submission_date', { withTimezone: true }).notNull().defaultNow(),
  data: jsonb('data').notNull().default({}),
  format: text('format').notNull().default('json'),
  status: text('status').notNull().default('draft'),
  submittedBy: text('submitted_by').references(() => user.id, { onDelete: 'set null' }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('moe_reports_school_id_idx').on(table.schoolId),
  reportTypeIdx: index('moe_reports_report_type_idx').on(table.reportType),
  periodIdx: index('moe_reports_period_idx').on(table.period),
}))

export const emisData = pgTable('emis_data', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  academicYearId: text('academic_year_id').references(() => academicYears.id, { onDelete: 'cascade' }),
  dataType: text('data_type').notNull(),
  data: jsonb('data').notNull().default({}),
  recordCount: integer('record_count').notNull().default(0),
  exportFormat: text('export_format').notNull().default('csv'),
  exportedBy: text('exported_by').references(() => user.id, { onDelete: 'set null' }),
  exportedAt: timestamp('exported_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('emis_data_school_id_idx').on(table.schoolId),
  dataTypeIdx: index('emis_data_data_type_idx').on(table.dataType),
}))

// ==========================================
// LEAVE TYPES (referenced by staff_leave)
// ==========================================

export const leaveTypes = pgTable('leave_types', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  nameDari: text('name_dari'),
  namePashto: text('name_pashto'),
  description: text('description'),
  annualQuota: integer('annual_quota').notNull().default(0),
  isPaid: boolean('is_paid').notNull().default(true),
  requiresDocument: boolean('requires_document').notNull().default(false),
  minDays: integer('min_days').notNull().default(1),
  maxDays: integer('max_days').notNull().default(30),
  isCarryForward: boolean('is_carry_forward').notNull().default(false),
  maxCarryForward: integer('max_carry_forward').notNull().default(0),
  isEncashable: boolean('is_encashable').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('leave_types_school_id_idx').on(table.schoolId),
}))

// ==========================================
// DEPARTMENTS (referenced by staff)
// ==========================================

export const departments = pgTable('departments', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  nameDari: text('name_dari'),
  namePashto: text('name_pashto'),
  description: text('description'),
  headId: text('head_id').references((): AnyPgColumn => staff.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('departments_school_id_idx').on(table.schoolId),
}))

// ==========================================
// INTEGRATIONS
// ==========================================

export const integrations = pgTable('integrations', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  config: jsonb('config').notNull().default({}),
  apiKey: text('api_key'),
  isActive: boolean('is_active').notNull().default(true),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  status: integrationStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('integrations_school_id_idx').on(table.schoolId),
  typeIdx: index('integrations_type_idx').on(table.type),
}))

// ==========================================
// STAFF ROLES & PERMISSIONS
// ==========================================

export const staffRoles = pgTable('staff_roles', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  userId: text('user_id').references((): AnyPgColumn => user.id, { onDelete: 'cascade' }),
  staffId: text('staff_id').references((): AnyPgColumn => staff.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  permissions: jsonb('permissions').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('staff_roles_school_id_idx').on(table.schoolId),
  userIdIdx: index('staff_roles_user_id_idx').on(table.userId),
}))

// ==========================================
// GENERIC ERP RECORDS (module-scoped CRUD store)
// ==========================================

export const erpRecords = pgTable('erp_records', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  module: text('module').notNull(),
  title: text('title').notNull(),
  reference: text('reference').notNull(),
  status: text('status').notNull().default('Active'),
  data: jsonb('data').notNull().default({}),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdIdx: index('erp_records_school_id_idx').on(table.schoolId),
  moduleIdx: index('erp_records_module_idx').on(table.module),
}))



// ==========================================
// NEW ENUMS (backend completeness plan)
// ==========================================

export const facilityWorkOrderStatusEnum = pgEnum('facility_work_order_status', [
  'open',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
])

export const procurementRequestStatusEnum = pgEnum('procurement_request_status', [
  'draft',
  'submitted',
  'budget_checked',
  'approved',
  'rejected',
  'converted',
])

export const complianceRecordStatusEnum = pgEnum('compliance_record_status', [
  'draft',
  'active',
  'under_review',
  'superseded',
  'archived',
])

export const inspectionStatusEnum = pgEnum('inspection_status', [
  'scheduled',
  'in_progress',
  'completed',
  'findings_open',
  'closed',
])

export const incidentSeverityEnum = pgEnum('incident_severity', ['low', 'medium', 'high', 'critical'])

export const incidentStatusEnum = pgEnum('incident_status', ['reported', 'investigating', 'resolved', 'escalated', 'closed'])

export const wellbeingReferralStatusEnum = pgEnum('wellbeing_referral_status', [
  'open',
  'in_support',
  'monitoring',
  'closed',
])

export const cafeteriaMealTypeEnum = pgEnum('cafeteria_meal_type', ['breakfast', 'lunch', 'snack'])

export const volunteerStatusEnum = pgEnum('volunteer_status', ['applied', 'screened', 'active', 'inactive'])

export const donationStatusEnum = pgEnum('donation_status', ['pledged', 'received', 'refunded', 'rejected'])

export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'accepted', 'expired', 'revoked'])

export const documentInstanceStatusEnum = pgEnum('document_instance_status', [
  'draft',
  'generated',
  'printed',
  'signed',
  'void',
])

// ==========================================
// GENERIC BUSINESS NUMBER SEQUENCES
// ==========================================

export const numberSequences = pgTable('number_sequences', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: integer('value').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolKeyUnique: unique('number_sequences_school_key_unique').on(table.schoolId, table.key),
  schoolIdx: index('number_sequences_school_idx').on(table.schoolId),
}))

// ==========================================
// FACILITIES (operations)
// ==========================================

export const facilityWorkOrders = pgTable('facility_work_orders', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  reference: text('reference').notNull().unique(),
  roomId: text('room_id').references(() => rooms.id, { onDelete: 'set null' }),
  assetId: text('asset_id').references(() => assets.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  priority: priorityEnum('priority').notNull().default('medium'),
  status: facilityWorkOrderStatusEnum('status').notNull().default('open'),
  requestedBy: text('requested_by').references(() => user.id, { onDelete: 'set null' }),
  assignedTo: text('assigned_to').references(() => staff.id, { onDelete: 'set null' }),
  cost: numeric('cost').notNull().default('0'),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  evidence: jsonb('evidence').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('facility_work_orders_school_idx').on(table.schoolId),
  statusIdx: index('facility_work_orders_status_idx').on(table.status),
  roomIdx: index('facility_work_orders_room_idx').on(table.roomId),
}))

export const facilityBookings = pgTable('facility_bookings', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  roomId: text('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  bookedBy: text('booked_by').references(() => user.id, { onDelete: 'set null' }),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurrenceRule: text('recurrence_rule'),
  status: text('status').notNull().default('confirmed'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('facility_bookings_school_idx').on(table.schoolId),
  roomIdx: index('facility_bookings_room_idx').on(table.roomId),
  slotIdx: index('facility_bookings_slot_idx').on(table.startAt, table.endAt),
}))

export const utilityBills = pgTable('utility_bills', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  reference: text('reference').notNull().unique(),
  utilityType: text('utility_type').notNull(),
  provider: text('provider'),
  billDate: timestamp('bill_date', { withTimezone: true }).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  meterReading: numeric('meter_reading'),
  previousReading: numeric('previous_reading'),
  consumption: numeric('consumption'),
  amount: numeric('amount').notNull().default('0'),
  paymentId: text('payment_id'),
  status: text('status').notNull().default('unpaid'),
  anomalyNote: text('anomaly_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('utility_bills_school_idx').on(table.schoolId),
  typeIdx: index('utility_bills_type_idx').on(table.utilityType),
  billDateIdx: index('utility_bills_bill_date_idx').on(table.billDate),
}))

// ==========================================
// PROCUREMENT
// ==========================================

export const procurementVendors = pgTable('procurement_vendors', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  contactName: text('contact_name'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  taxId: text('tax_id'),
  paymentTerms: text('payment_terms'),
  rating: integer('rating'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('procurement_vendors_school_idx').on(table.schoolId),
  schoolNameUnique: unique('procurement_vendors_school_name_unique').on(table.schoolId, table.name),
}))

export const procurementRequests = pgTable('procurement_requests', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  reference: text('reference').notNull().unique(),
  departmentId: text('department_id').references(() => departments.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  items: jsonb('items').notNull().default([]),
  estimatedCost: numeric('estimated_cost').notNull().default('0'),
  budgetYearId: text('budget_year_id').references(() => academicYears.id, { onDelete: 'set null' }),
  status: procurementRequestStatusEnum('status').notNull().default('draft'),
  requestedBy: text('requested_by').references(() => user.id, { onDelete: 'set null' }),
  approvedBy: text('approved_by').references(() => user.id, { onDelete: 'set null' }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  purchaseOrderId: text('purchase_order_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('procurement_requests_school_idx').on(table.schoolId),
  statusIdx: index('procurement_requests_status_idx').on(table.status),
}))

export const purchaseOrders = pgTable('purchase_orders', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  orderNumber: text('order_number').notNull().unique(),
  vendorId: text('vendor_id').references(() => procurementVendors.id, { onDelete: 'set null' }),
  requestId: text('request_id').references(() => procurementRequests.id, { onDelete: 'set null' }),
  orderDate: timestamp('order_date', { withTimezone: true }).notNull().defaultNow(),
  expectedDate: timestamp('expected_date', { withTimezone: true }),
  receivedDate: timestamp('received_date', { withTimezone: true }),
  totalAmount: numeric('total_amount').notNull().default('0'),
  status: orderStatusEnum('status').notNull().default('draft'),
  approvedBy: text('approved_by').references(() => user.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('purchase_orders_school_idx').on(table.schoolId),
  vendorIdx: index('purchase_orders_vendor_idx').on(table.vendorId),
  statusIdx: index('purchase_orders_status_idx').on(table.status),
}))

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: text('id').primaryKey(),
  purchaseOrderId: text('purchase_order_id').notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  assetId: text('asset_id').references(() => assets.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  quantity: numeric('quantity').notNull().default('1'),
  unitPrice: numeric('unit_price').notNull().default('0'),
  receivedQuantity: numeric('received_quantity').notNull().default('0'),
  amount: numeric('amount').notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orderIdx: index('purchase_order_items_order_idx').on(table.purchaseOrderId),
}))

// ==========================================
// COMPLIANCE & DATA PRIVACY
// ==========================================

export const compliancePolicies = pgTable('compliance_policies', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  category: text('category').notNull(),
  owner: text('owner'),
  content: text('content'),
  version: text('version').notNull().default('1.0'),
  effectiveDate: timestamp('effective_date', { withTimezone: true }),
  reviewDate: timestamp('review_date', { withTimezone: true }),
  status: complianceRecordStatusEnum('status').notNull().default('active'),
  approvedBy: text('approved_by').references(() => user.id, { onDelete: 'set null' }),
  attachments: jsonb('attachments').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('compliance_policies_school_idx').on(table.schoolId),
  categoryIdx: index('compliance_policies_category_idx').on(table.category),
  schoolTitleUnique: unique('compliance_policies_school_title_unique').on(table.schoolId, table.title),
}))

export const complianceInspections = pgTable('compliance_inspections', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  conductedAt: timestamp('conducted_at', { withTimezone: true }),
  checklist: jsonb('checklist').notNull().default([]),
  findings: jsonb('findings').notNull().default([]),
  status: inspectionStatusEnum('status').notNull().default('scheduled'),
  inspector: text('inspector'),
  evidence: jsonb('evidence').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('compliance_inspections_school_idx').on(table.schoolId),
  statusIdx: index('compliance_inspections_status_idx').on(table.status),
}))

export const complianceActionPlans = pgTable('compliance_action_plans', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  inspectionId: text('inspection_id').references(() => complianceInspections.id, { onDelete: 'cascade' }),
  finding: text('finding').notNull(),
  action: text('action').notNull(),
  owner: text('owner'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  evidence: jsonb('evidence').notNull().default([]),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  status: text('status').notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('compliance_action_plans_school_idx').on(table.schoolId),
  statusIdx: index('compliance_action_plans_status_idx').on(table.status),
  inspectionIdx: index('compliance_action_plans_inspection_idx').on(table.inspectionId),
}))

export const dataProcessingRecords = pgTable('data_processing_records', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  subjectType: text('subject_type').notNull(),
  subjectId: text('subject_id'),
  purpose: text('purpose').notNull(),
  lawfulBasis: text('lawful_basis'),
  retentionUntil: timestamp('retention_until', { withTimezone: true }),
  requestType: text('request_type'),
  requestedAt: timestamp('requested_at', { withTimezone: true }),
  status: text('status').notNull().default('open'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('data_processing_records_school_idx').on(table.schoolId),
  subjectIdx: index('data_processing_records_subject_idx').on(table.subjectType, table.subjectId),
}))

// ==========================================
// SECURITY & WELLBEING
// ==========================================

export const securityIncidents = pgTable('security_incidents', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  reference: text('reference').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  incidentAt: timestamp('incident_at', { withTimezone: true }).notNull().defaultNow(),
  location: text('location'),
  severity: incidentSeverityEnum('severity').notNull().default('medium'),
  status: incidentStatusEnum('status').notNull().default('reported'),
  involved: jsonb('involved').notNull().default([]),
  actionTaken: text('action_taken'),
  parentNotified: boolean('parent_notified').notNull().default(false),
  reportedBy: text('reported_by').references(() => user.id, { onDelete: 'set null' }),
  attachments: jsonb('attachments').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('security_incidents_school_idx').on(table.schoolId),
  statusIdx: index('security_incidents_status_idx').on(table.status),
  severityIdx: index('security_incidents_severity_idx').on(table.severity),
}))

export const wellbeingReferrals = pgTable('wellbeing_referrals', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  counselorId: text('counselor_id').references(() => staff.id, { onDelete: 'set null' }),
  referralDate: timestamp('referral_date', { withTimezone: true }).notNull().defaultNow(),
  status: wellbeingReferralStatusEnum('status').notNull().default('open'),
  appointments: jsonb('appointments').notNull().default([]),
  outcome: text('outcome'),
  guardianInformed: boolean('guardian_informed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('wellbeing_referrals_school_idx').on(table.schoolId),
  studentIdx: index('wellbeing_referrals_student_idx').on(table.studentId),
  statusIdx: index('wellbeing_referrals_status_idx').on(table.status),
}))

export const wellbeingCheckins = pgTable('wellbeing_checkins', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  referralId: text('referral_id').references(() => wellbeingReferrals.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  checkinDate: timestamp('checkin_date', { withTimezone: true }).notNull().defaultNow(),
  mood: integer('mood'),
  note: text('note'),
  protectionFlags: jsonb('protection_flags').notNull().default([]),
  recordedBy: text('recorded_by').references(() => staff.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('wellbeing_checkins_school_idx').on(table.schoolId),
  studentIdx: index('wellbeing_checkins_student_idx').on(table.studentId),
}))

// ==========================================
// CAFETERIA
// ==========================================

export const cafeteriaMenus = pgTable('cafeteria_menus', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).notNull(),
  mealType: cafeteriaMealTypeEnum('meal_type').notNull(),
  items: jsonb('items').notNull().default([]),
  calories: integer('calories'),
  allergenNote: text('allergen_note'),
  status: text('status').notNull().default('planned'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('cafeteria_menus_school_idx').on(table.schoolId),
  schoolDateMealUnique: unique('cafeteria_menus_school_date_meal_unique').on(table.schoolId, table.date, table.mealType),
}))

export const cafeteriaMealSubscriptions = pgTable('cafeteria_meal_subscriptions', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  plan: text('plan').notNull().default('weekly'),
  meals: jsonb('meals').notNull().default([]),
  allergies: jsonb('allergies').notNull().default([]),
  monthlyFee: numeric('monthly_fee').notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
  startDate: timestamp('start_date', { withTimezone: true }).notNull().defaultNow(),
  endDate: timestamp('end_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('cafeteria_meal_subscriptions_school_idx').on(table.schoolId),
  studentIdx: index('cafeteria_meal_subscriptions_student_idx').on(table.studentId),
}))

// ==========================================
// COMMUNITY (volunteers & donations)
// ==========================================

export const communityVolunteers = pgTable('community_volunteers', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  role: text('role'),
  screeningStatus: volunteerStatusEnum('screening_status').notNull().default('applied'),
  assignments: jsonb('assignments').notNull().default([]),
  hoursTotal: numeric('hours_total').notNull().default('0'),
  joinedDate: timestamp('joined_date', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('community_volunteers_school_idx').on(table.schoolId),
  statusIdx: index('community_volunteers_status_idx').on(table.screeningStatus),
}))

export const communityDonations = pgTable('community_donations', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  receiptNumber: text('receipt_number').notNull().unique(),
  donorName: text('donor_name').notNull(),
  donorType: text('donor_type').notNull().default('individual'),
  amount: numeric('amount').notNull().default('0'),
  currency: text('currency').notNull().default('AFN'),
  purpose: text('purpose'),
  restriction: text('restriction'),
  status: donationStatusEnum('status').notNull().default('pledged'),
  receivedDate: timestamp('received_date', { withTimezone: true }),
  recordedBy: text('recorded_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('community_donations_school_idx').on(table.schoolId),
  statusIdx: index('community_donations_status_idx').on(table.status),
  receivedDateIdx: index('community_donations_received_date_idx').on(table.receivedDate),
}))

// ==========================================
// IT PORTAL
// ==========================================

export const systemBackups = pgTable('system_backups', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').references(() => schools.id, { onDelete: 'cascade' }),
  scope: text('scope').notNull().default('full'),
  storageRef: text('storage_ref').notNull(),
  sizeBytes: integer('size_bytes'),
  takenAt: timestamp('taken_at', { withTimezone: true }).notNull().defaultNow(),
  restorePointOf: timestamp('restore_point_of', { withTimezone: true }),
  status: text('status').notNull().default('completed'),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('system_backups_school_idx').on(table.schoolId),
  takenAtIdx: index('system_backups_taken_at_idx').on(table.takenAt),
}))

// ==========================================
// SETTINGS & PORTAL ACCESS
// ==========================================

export const notificationPreferences = pgTable('notification_preferences', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  emailEnabled: boolean('email_enabled').notNull().default(true),
  smsEnabled: boolean('sms_enabled').notNull().default(false),
  inAppEnabled: boolean('in_app_enabled').notNull().default(true),
  quietHours: jsonb('quiet_hours').notNull().default({}),
  digestCadence: text('digest_cadence').notNull().default('daily'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolUserUnique: unique('notification_preferences_school_user_unique').on(table.schoolId, table.userId),
  userIdx: index('notification_preferences_user_idx').on(table.userId),
}))

export const portalInvitations = pgTable('portal_invitations', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  guardianId: text('guardian_id').references(() => studentGuardians.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('guardian'),
  tokenHash: text('token_hash').notNull().unique(),
  status: invitationStatusEnum('status').notNull().default('pending'),
  invitedBy: text('invited_by').references(() => user.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('portal_invitations_school_idx').on(table.schoolId),
  guardianIdx: index('portal_invitations_guardian_idx').on(table.guardianId),
}))

// ==========================================
// DOCUMENTS (templates & generated instances)
// ==========================================

export const documentTemplates = pgTable('document_templates', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category').notNull().default('notice'),
  mergeFields: jsonb('merge_fields').notNull().default([]),
  versions: jsonb('versions').notNull().default([]),
  currentVersion: text('current_version').notNull().default('1.0'),
  status: text('status').notNull().default('active'),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('document_templates_school_idx').on(table.schoolId),
  schoolNameUnique: unique('document_templates_school_name_unique').on(table.schoolId, table.name),
}))

export const documentInstances = pgTable('document_instances', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  templateId: text('template_id').references(() => documentTemplates.id, { onDelete: 'set null' }),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  serialNumber: text('serial_number'),
  title: text('title').notNull(),
  data: jsonb('data').notNull().default({}),
  status: documentInstanceStatusEnum('status').notNull().default('draft'),
  signedBy: text('signed_by'),
  verifiedBy: text('verified_by').references(() => user.id, { onDelete: 'set null' }),
  fileUrl: text('file_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('document_instances_school_idx').on(table.schoolId),
  templateIdx: index('document_instances_template_idx').on(table.templateId),
  entityIdx: index('document_instances_entity_idx').on(table.entityType, table.entityId),
  schoolSerialUnique: unique('document_instances_school_serial_unique').on(table.schoolId, table.serialNumber),
}))

// ==========================================
// INVENTORY (consumables + items)
// ==========================================

export const inventoryItems = pgTable('inventory_items', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  sku: text('sku').notNull(),
  name: text('name').notNull(),
  category: text('category'),
  supplier: text('supplier'),
  onHand: numeric('on_hand').notNull().default('0'),
  minLevel: numeric('min_level').notNull().default('0'),
  unit: text('unit').notNull().default('pcs'),
  unitCost: numeric('unit_cost').notNull().default('0'),
  location: text('location'),
  lastRestocked: timestamp('last_restocked', { withTimezone: true }),
  status: text('status').notNull().default('in_stock'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('inventory_items_school_idx').on(table.schoolId),
  schoolSkuUnique: unique('inventory_items_school_sku_unique').on(table.schoolId, table.sku),
  categoryIdx: index('inventory_items_category_idx').on(table.category),
  statusIdx: index('inventory_items_status_idx').on(table.status),
}))

export const inventoryStockMovements = pgTable('inventory_stock_movements', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull().references(() => inventoryItems.id, { onDelete: 'cascade' }),
  movementType: stockMovementTypeEnum('movement_type').notNull().default('purchase'),
  quantity: numeric('quantity').notNull().default('0'),
  unitCost: numeric('unit_cost').notNull().default('0'),
  reference: text('reference'),
  vendor: text('vendor'),
  remarks: text('remarks'),
  movementDate: timestamp('movement_date', { withTimezone: true }).notNull().defaultNow(),
  recordedBy: text('recorded_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('inventory_stock_movements_school_idx').on(table.schoolId),
  itemIdx: index('inventory_stock_movements_item_idx').on(table.itemId),
  dateIdx: index('inventory_stock_movements_date_idx').on(table.movementDate),
}))

// ==========================================
// ADMISSIONS PIPELINE (second pass)
// ==========================================

export const admissionDocuments = pgTable('admission_documents', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  applicationId: text('application_id').notNull().references(() => admissionApplications.id, { onDelete: 'cascade' }),
  documentType: text('document_type').notNull(),
  fileUrl: text('file_url'),
  status: text('status').notNull().default('pending'),
  verifiedBy: text('verified_by').references(() => user.id, { onDelete: 'set null' }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('admission_documents_school_idx').on(table.schoolId),
  applicationIdx: index('admission_documents_application_idx').on(table.applicationId),
  statusIdx: index('admission_documents_status_idx').on(table.status),
}))

export const entranceAssessments = pgTable('entrance_assessments', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  applicationId: text('application_id').notNull().references(() => admissionApplications.id, { onDelete: 'cascade' }),
  assessmentType: text('assessment_type').notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  panel: text('panel'),
  score: numeric('score').notNull().default('0'),
  maxScore: numeric('max_score').notNull().default('100'),
  passScore: numeric('pass_score').notNull().default('40'),
  notes: text('notes'),
  result: text('result').notNull().default('pending'),
  gradedBy: text('graded_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('entrance_assessments_school_idx').on(table.schoolId),
  applicationIdx: index('entrance_assessments_application_idx').on(table.applicationId),
  resultIdx: index('entrance_assessments_result_idx').on(table.result),
}))

export const admissionWaitlists = pgTable('admission_waitlists', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  applicationId: text('application_id').notNull().references(() => admissionApplications.id, { onDelete: 'cascade' }),
  gradeId: text('grade_id').references(() => grades.id, { onDelete: 'set null' }),
  priority: integer('priority').notNull().default(5),
  seatsAvailable: integer('seats_available').notNull().default(0),
  offeredAt: timestamp('offered_at', { withTimezone: true }),
  offerExpiresAt: timestamp('offer_expires_at', { withTimezone: true }),
  depositAmount: numeric('deposit_amount').notNull().default('0'),
  status: text('status').notNull().default('queued'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('admission_waitlists_school_idx').on(table.schoolId),
  statusIdx: index('admission_waitlists_status_idx').on(table.status),
  applicationIdx: index('admission_waitlists_application_idx').on(table.applicationId),
}))

export const admissionOffers = pgTable('admission_offers', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  applicationId: text('application_id').notNull().references(() => admissionApplications.id, { onDelete: 'cascade' }),
  offerNumber: text('offer_number').notNull().unique(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  depositAmount: numeric('deposit_amount').notNull().default('0'),
  admittedAt: timestamp('admitted_at', { withTimezone: true }),
  studentId: text('student_id').references(() => students.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('issued'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('admission_offers_school_idx').on(table.schoolId),
  applicationIdx: index('admission_offers_application_idx').on(table.applicationId),
  statusIdx: index('admission_offers_status_idx').on(table.status),
}))

// ==========================================
// FINANCE (second pass)
// ==========================================

export const paymentPlans = pgTable('payment_plans', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  invoiceId: text('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }),
  installments: jsonb('installments').notNull().default([]),
  totalAmount: numeric('total_amount').notNull().default('0'),
  paidAmount: numeric('paid_amount').notNull().default('0'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('payment_plans_school_idx').on(table.schoolId),
  studentIdx: index('payment_plans_student_idx').on(table.studentId),
}))

export const bankReconciliations = pgTable('bank_reconciliations', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  statementDate: timestamp('statement_date', { withTimezone: true }).notNull(),
  bankName: text('bank_name'),
  openingBalance: numeric('opening_balance').notNull().default('0'),
  closingBalance: numeric('closing_balance').notNull().default('0'),
  matchedAmount: numeric('matched_amount').notNull().default('0'),
  unmatchedAmount: numeric('unmatched_amount').notNull().default('0'),
  entries: jsonb('entries').notNull().default([]),
  status: text('status').notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('bank_reconciliations_school_idx').on(table.schoolId),
  statementDateIdx: index('bank_reconciliations_statement_date_idx').on(table.statementDate),
}))

// ==========================================
// ACADEMICS (second pass)
// ==========================================

export const assessmentRubrics = pgTable('assessment_rubrics', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  subjectId: text('subject_id').references(() => subjects.id, { onDelete: 'cascade' }),
  gradeId: text('grade_id').references(() => grades.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  criteria: jsonb('criteria').notNull().default([]),
  bands: jsonb('bands').notNull().default([]),
  maxScore: numeric('max_score').notNull().default('100'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('assessment_rubrics_school_idx').on(table.schoolId),
  subjectIdx: index('assessment_rubrics_subject_idx').on(table.subjectId),
}))

export const curriculumOutcomes = pgTable('curriculum_outcomes', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  subjectId: text('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  gradeId: text('grade_id').references(() => grades.id, { onDelete: 'cascade' }),
  outcome: text('outcome').notNull(),
  unit: text('unit'),
  coveragePercent: integer('coverage_percent').notNull().default(0),
  status: text('status').notNull().default('planned'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('curriculum_outcomes_school_idx').on(table.schoolId),
  subjectIdx: index('curriculum_outcomes_subject_idx').on(table.subjectId),
}))

// ==========================================
// EXAMS (second pass)
// ==========================================

export const examQuestions = pgTable('exam_questions', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  subjectId: text('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  topic: text('topic'),
  difficulty: text('difficulty').notNull().default('medium'),
  question: text('question').notNull(),
  answer: text('answer'),
  marks: numeric('marks').notNull().default('1'),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('exam_questions_school_idx').on(table.schoolId),
  subjectIdx: index('exam_questions_subject_idx').on(table.subjectId),
}))

// ==========================================
// ATTENDANCE (second pass)
// ==========================================

export const absenceRequests = pgTable('absence_requests', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).notNull(),
  reason: text('reason').notNull(),
  documentUrl: text('document_url'),
  status: text('status').notNull().default('pending'),
  reviewedBy: text('reviewed_by').references(() => user.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('absence_requests_school_idx').on(table.schoolId),
  studentIdx: index('absence_requests_student_idx').on(table.studentId),
  statusIdx: index('absence_requests_status_idx').on(table.status),
}))

// ==========================================
// COMMUNICATIONS (second pass)
// ==========================================

export const communicationTemplates = pgTable('communication_templates', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  channel: text('channel').notNull(),
  subject: text('subject'),
  body: text('body').notNull(),
  language: text('language').notNull().default('en'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolNameUnique: unique('communication_templates_school_name_unique').on(table.schoolId, table.name),
  schoolIdx: index('communication_templates_school_idx').on(table.schoolId),
}))

export const communicationCampaigns = pgTable('communication_campaigns', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  channel: text('channel').notNull(),
  audience: jsonb('audience').notNull().default([]),
  templateId: text('template_id').references(() => communicationTemplates.id, { onDelete: 'set null' }),
  content: text('content'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  recipientCount: integer('recipient_count').notNull().default(0),
  deliveredCount: integer('delivered_count').notNull().default(0),
  failedCount: integer('failed_count').notNull().default(0),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('communication_campaigns_school_idx').on(table.schoolId),
  statusIdx: index('communication_campaigns_status_idx').on(table.status),
}))

// ==========================================
// REPORTS (second pass)
// ==========================================

export const savedReports = pgTable('saved_reports', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  module: text('module').notNull(),
  fields: jsonb('fields').notNull().default([]),
  filters: jsonb('filters').notNull().default({}),
  groupBy: jsonb('group_by').notNull().default([]),
  charts: jsonb('charts').notNull().default([]),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('saved_reports_school_idx').on(table.schoolId),
  moduleIdx: index('saved_reports_module_idx').on(table.module),
}))

export const reportSchedules = pgTable('report_schedules', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  savedReportId: text('saved_report_id').references(() => savedReports.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  cadence: text('cadence').notNull(),
  recipients: jsonb('recipients').notNull().default([]),
  format: text('format').notNull().default('pdf'),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('report_schedules_school_idx').on(table.schoolId),
  statusIdx: index('report_schedules_status_idx').on(table.status),
}))

// ==========================================
// FILE UPLOADS
// ==========================================

export const fileUploads = pgTable('file_uploads', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  storageRef: text('storage_ref').notNull(),
  uploadedBy: text('uploaded_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('file_uploads_school_idx').on(table.schoolId),
  uploaderIdx: index('file_uploads_uploader_idx').on(table.uploadedBy),
}))

// ==========================================
// FLEET (second pass)
// ==========================================

export const vehicleFuelLogs = pgTable('vehicle_fuel_logs', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  vehicleId: text('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  filledAt: timestamp('filled_at', { withTimezone: true }).notNull().defaultNow(),
  liters: numeric('liters').notNull().default('0'),
  pricePerLiter: numeric('price_per_liter').notNull().default('0'),
  totalCost: numeric('total_cost').notNull().default('0'),
  odometer: numeric('odometer'),
  vendor: text('vendor'),
  notes: text('notes'),
  recordedBy: text('recorded_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('vehicle_fuel_logs_school_idx').on(table.schoolId),
  vehicleIdx: index('vehicle_fuel_logs_vehicle_idx').on(table.vehicleId),
}))

// ==========================================
// HR (second pass)
// ==========================================

export const staffContracts = pgTable('staff_contracts', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  staffId: text('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  contractNumber: text('contract_number').notNull().unique(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),
  contractType: text('contract_type').notNull().default('permanent'),
  salary: numeric('salary').notNull().default('0'),
  documentUrl: text('document_url'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('staff_contracts_school_idx').on(table.schoolId),
  staffIdx: index('staff_contracts_staff_idx').on(table.staffId),
  statusIdx: index('staff_contracts_status_idx').on(table.status),
}))

// ==========================================
// TRANSPORT (second pass)
// ==========================================

export const transportAssignments = pgTable('transport_assignments', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  routeId: text('route_id').notNull().references(() => transportRoutes.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  stopName: text('stop_name'),
  pickupTime: text('pickup_time'),
  dropTime: text('drop_time'),
  transportFee: numeric('transport_fee').notNull().default('0'),
  isActive: boolean('is_active').notNull().default(true),
  parentConsent: boolean('parent_consent').notNull().default(false),
  startDate: timestamp('start_date', { withTimezone: true }).notNull().defaultNow(),
  endDate: timestamp('end_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('transport_assignments_school_idx').on(table.schoolId),
  routeIdx: index('transport_assignments_route_idx').on(table.routeId),
  studentIdx: index('transport_assignments_student_idx').on(table.studentId),
}))

export const approvalRequests = pgTable('approval_requests', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  amount: numeric('amount').notNull(),
  reason: text('reason').notNull(),
  requestedBy: text('requested_by').notNull().references(() => user.id, { onDelete: 'restrict' }),
  reviewedBy: text('reviewed_by').references(() => user.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('approval_requests_school_idx').on(table.schoolId),
  statusIdx: index('approval_requests_status_idx').on(table.status),
}))

export const taxSettings = pgTable('tax_settings', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  taxType: text('tax_type').notNull(),
  taxRate: numeric('tax_rate').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull().defaultNow(),
  effectiveTo: timestamp('effective_to', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('tax_settings_school_idx').on(table.schoolId),
}))

export const leaveCalendars = pgTable('leave_calendars', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  year: integer('year').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  status: text('status').notNull().default('active'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('leave_calendars_school_idx').on(table.schoolId),
  yearIdx: index('leave_calendars_year_idx').on(table.year),
}))

export const staffPayrollProfiles = pgTable('staff_payroll_profiles', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  staffId: text('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  payrollPeriod: text('payroll_period').notNull(),
  basicSalary: numeric('basic_salary').notNull().default('0'),
  houseAllowance: numeric('house_allowance').notNull().default('0'),
  transportAllowance: numeric('transport_allowance').notNull().default('0'),
  foodAllowance: numeric('food_allowance').notNull().default('0'),
  taxExemption: numeric('tax_exemption').notNull().default('0'),
  bankAccount: text('bank_account'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('staff_payroll_profiles_school_idx').on(table.schoolId),
  staffPeriodUnique: unique('staff_payroll_profiles_staff_period_unique').on(table.staffId, table.payrollPeriod),
}))

export const goodsReceipts = pgTable('goods_receipts', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  purchaseOrderId: text('purchase_order_id').notNull().references(() => purchaseOrders.id, { onDelete: 'restrict' }),
  referenceNumber: text('reference_number').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  receivedBy: text('received_by').references(() => user.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('completed'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('goods_receipts_school_idx').on(table.schoolId),
  purchaseOrderIdx: index('goods_receipts_purchase_order_idx').on(table.purchaseOrderId),
}))

export const goodsReceiptItems = pgTable('goods_receipt_items', {
  id: text('id').primaryKey(),
  goodsReceiptId: text('goods_receipt_id').notNull().references(() => goodsReceipts.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(),
  receivedQuantity: numeric('received_quantity').notNull(),
  condition: text('condition').notNull().default('good'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  receiptIdx: index('goods_receipt_items_receipt_idx').on(table.goodsReceiptId),
}))

export const stocktakes = pgTable('stocktakes', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  locationId: text('location_id').notNull(),
  referenceNumber: text('reference_number').notNull(),
  items: jsonb('items').notNull().default([]),
  status: text('status').notNull().default('in_progress'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('stocktakes_school_idx').on(table.schoolId),
  statusIdx: index('stocktakes_status_idx').on(table.status),
}))

export const admissionCommunications = pgTable('admission_communications', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  applicationId: text('application_id').notNull().references(() => admissionApplications.id, { onDelete: 'cascade' }),
  channel: text('channel').notNull(),
  recipient: text('recipient'),
  subject: text('subject'),
  message: text('message').notNull(),
  status: text('status').notNull().default('sent'),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('admission_communications_school_idx').on(table.schoolId),
  applicationIdx: index('admission_communications_application_idx').on(table.applicationId),
  sentAtIdx: index('admission_communications_sent_at_idx').on(table.sentAt),
}))

export const communications = pgTable('communications', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('message'),
  channel: text('channel'),
  studentId: text('student_id').references(() => students.id, { onDelete: 'set null' }),
  senderId: text('sender_id').references(() => user.id, { onDelete: 'set null' }),
  recipientId: text('recipient_id').references(() => user.id, { onDelete: 'set null' }),
  subject: text('subject'),
  message: text('message'),
  body: text('body'),
  date: timestamp('date', { withTimezone: true }),
  time: text('time'),
  agenda: text('agenda'),
  notes: text('notes'),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  schoolIdx: index('communications_school_idx').on(table.schoolId),
  statusIdx: index('communications_status_idx').on(table.status),
  channelIdx: index('communications_channel_idx').on(table.channel),
  typeIdx: index('communications_type_idx').on(table.type),
}))
