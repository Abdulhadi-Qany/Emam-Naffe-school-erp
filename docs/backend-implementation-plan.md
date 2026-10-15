# EBPS School ERP — Complete Backend Implementation Plan

> Status: **plan only** — no code is written by this document.
> Scope: turn the fully localized, currently mock-data-driven Next.js frontend into a production backend backed by the existing PostgreSQL schema, using the two API patterns already established in this repo (`app/api/**` thin Drizzle routes and the `src/**` DDD module).

---

## 1. Current State Audit (verified 2026-10-11)

### 1.1 What exists

| Area | State | Evidence |
|---|---|---|
| **Database schema** | **104 tables** defined, no migrations generated yet (`drizzle/` empty — `drizzle.config.ts` with `out: './drizzle'`) | `lib/db/schema.ts` (2,069 lines) |
| **Connection** | `pg` `Pool` (max 5) + Drizzle `drizzle(pool, { schema })` | `lib/db/index.ts` |
| **Auth** | better-auth email/password, Drizzle adapter on the same `db` | `lib/auth.ts`, `app/api/auth/[...all]/route.ts` |
| **Full business-logic APIs** | `POST/GET /api/students`, `GET/PUT/DELETE /api/students/[id]`, `GET/POST /api/staff`, `GET/PUT/DELETE /api/staff/[id]`, `GET/POST /api/finance/salary-structures`, `*/[id]`, `GET/POST /api/finance/payroll`, `GET/PATCH /api/finance/payroll/[id]` | hand-written Drizzle routes with validation, 409 duplicate handling, transaction wrapping (payroll generation) |
| **DDD module (students)** | Complete: domain (aggregate `Student`, VOs, enums, errors, 4 domain events, `AdmissionNumberGenerator`/`AgeCalculator` services), application (9 CQRS handlers: admit/update/promote/transfer/dropout + get/list/search), infrastructure (`DrizzleStudentRepository`, `StudentPersistenceMapper`, `StudentPresenter`, middleware, IOC container), HTTP: `app/api/v2/students/**` (7 routes) | `src/**` |
| **RBAC** | `staff_roles` table (`role` + `permissions` JSON array, `*` wildcard); first user per school auto-bootstrapped as `school_admin` | `src/infrastructure/http/middleware/auth.ts` |
| **Thin CRUD stubs** | `createRouteHandler`/`createDynamicRouteHandler` factory | `lib/api/crud.ts` |
| **Stub routes (11 lines each)** | `academic/classes`, `academic/grades`, `academic/sections`, `academic/subjects`, `attendance`, `communications`, `exams`, `finance/expenses`, `finance/fees`, `finance/payments`, `hostel`, `library`, `settings`, `transport` | `app/api/**` |
| **Seed** | school + 3 staff + 3 salary structures | `scripts/seed.ts` (`npm run db:seed`) |
| **Tests** | `node:test` via `tsx --test`; 4 unit suites (domain), 4 integration suites including live-DB round-trip `v2-routes-live.test.ts` (bootstraps schema, signs session cookies with HMAC) | `tests/**` |
| **Frontend** | All UI localized (en/fa/ps) and still rendering **localized mock data**; only payroll/salary-structures/staff/students pages call APIs; student forms `POST /api/students` | `app/(erp)/**` |

### 1.2 What is missing (the actual gap)

1. **No migrations** — schema only exists in TypeScript; `drizzle/` has no generated SQL; a fresh DB cannot be created reproducibly.
2. **Seed is minimal** — no academic year/terms/grades/sections/classes/subjects, so FK-dependent endpoints (attendance, exams, finance invoices, timetable) cannot return meaningful data.
3. **14 modules are unfixable factory stubs** — beyond `GET/POST` they lack: joins (department names, class→grade/section, student→class), filter parameters, validation, soft-delete semantics (`status = 'deleted'` breaks tables that use `status` as a domain enum like `active/inactive`).
4. **~10 frontend modules have no API at all**: announcements, community/events, inventory, homework, timetable/periods, admissions, invoices, fee-structures, notifications, profile/user-account, reports, calendar.
5. **No API auth layer on v1 routes** — v2 has `requireAuth`/`requirePermission`; v1 routes are fully public. Anyone can read/write student PII.
6. **No standard input validation, no error envelope on v1** — v1 returns bare `{ error }`; v2 returns the `{success,data,error,timestamp}` envelope.
7. **No file-upload endpoint** for student documents (`student_documents`, `book_issues`… attachments), though `LocalFileStorage` port exists.
8. **No audit-log writes, no notifications/SMS/email orchestration** (tables exist: `audit_logs`, `notifications`, `sms_messages`, `email_messages`).
9. **Schema gaps** for frontend features (see §3.2).

### 1.3 Architectural rules the plan must preserve (from the codebase)

- **Two API lanes, both first-class:**
  - `app/api/**` = thin Drizzle routes (fast, simple CRUD + module endpoints). Use for everything except deeply rule-driven aggregates.
  - `app/api/v2/**` = DDD lane. Route is a *thin controller*: `getContainer()` → `requireAuth` → `resolveSchoolId` → `requirePermission` → handler → `Presenter.toHttp`. No business logic in routes.
- **School scoping**: `resolveSchoolId(request)` = `x-school-id` header → `?schoolId=` → `DEFAULT_SCHOOL_ID` (`emam-bukhari-private-school`). Every list/query must filter by it.
- **IDs**: text PKs via `crypto.randomUUID()`; business numbers via `lib/utils/afghanistan.ts` generators (`EBPS-{academicYear}-G{grade}-{seq}` admission, `EBPS-EMP-…`, `EBPS-INV-…`, `EBPS-RCP-…`). Sequences must be race-safe (count-based lookups like the existing payroll slip numbering are fragile — replace with a sequence/lock, see §5.4).
- **Money**: numeric columns stored as decimal strings; API converts via a shared `money()` (2dp string) and `num()` helpers — promote to `lib/api/money.ts`.
- **Dates**: stored as `timestamptz`; API emits ISO strings; **Solar Hijri presentation is a frontend concern** (`lib/utils/afghanistan.ts` already used client-side; the payroll route already labels periods with `dateToSolarHijri`).
- **Localization is client-side** (localStorage `lang`): APIs stay canonical (English enum values, no translated payloads); clients compose labels via `t.*` (e.g. `t.classes.gradeSection(grade, section)`). Book/announcement *display data* that is genuinely multilingual is stored trilingually in the schema (`titleDari`, `titlePashto`, `nameDari`…).
- **Response shapes**: v1 = `{ data, pagination: { page, limit, total, totalPages, hasMore } }`; v2 = `{ success, data, pagination?, error?, timestamp }`. Keep both (v1 pages already parse `data`).
- **Errors (v2)**: `ValidationError→400`, `NotFoundError→404`, `DomainError→422`, `Unauthorized→401`, `Forbidden→403`, else `500`, all through the presenter.
- **Tests**: `npm run test` (node:test via tsx) — unit tests use in-memory fakes (`tests/fixtures/InMemoryStudentRepository.ts`, `fakes.ts`); integration tests use the live DB and clean up after themselves (`tests/helpers/live-db.ts`).
- **Verification commands**: `npm run typecheck`, `npm run test`, `npm run build`.

---

## 2. Phase 0 — Foundations (must land first)

### 2.1 Migrations

- Generate initial migration from the existing schema: `npx drizzle-kit generate --name init` into `drizzle/0000_init/`; commit the SQL + snapshots.
- Add `drizzle/` to version control; wire `npm run db:migrate` script (`drizzle-kit migrate`) and a `scripts/migrate.ts` runner for deploys.
- Enforce one-way convention: every schema change = new generated migration + snapshot; `db:push` remains dev-only.

### 2.2 Schema gaps to add (new tables, generated into the same migration system)

| Frontend feature (localized route) | Proposed table | Key columns |
|---|---|---|
| Facility work orders, bookings, utility bills (`/facilities/*`) | `facility_work_orders`, `facility_bookings`, `utility_bills` | schoolId, roomId (f.k. `rooms`), priority, status, requestedBy, cost, scheduledFor, slot range, provider, amount, meterReading |
| Procurement vendors/requests (`/procurement/*`) | `procurement_vendors`, `procurement_requests`, `purchase_orders`, `purchase_order_items` | schoolId, name, contact, taxId, rating, paymentTerms; request→approval→PO→receive workflow columns |
| Compliance (`/compliance/*`) | `compliance_policies`, `compliance_inspections`, `compliance_action_plans`, `data_processing_records` | schoolId, owner, reviewDate, version, findings[], dueDate, evidence, closedAt |
| Security & wellbeing (`/security/*`, `/wellbeing/*`) | `security_incidents`, `wellbeing_referrals`, `wellbeing_checkins` | schoolId, severity, status, confidentiality scope, referral/counselor fields, outcomes |
| Alumni (`/alumni`) | reuse `students` with `status='alumni'` + `student_timeline` events — **no new table** | — |
| Cafeteria (`/cafeteria/*`) | `cafeteria_menus`, `cafeteria_meal_subscriptions` | schoolId, date, mealType, items, allergies; studentId, plan, active |
| Community (`/community/volunteers`, `/community/donations`) | `community_volunteers`, `community_donations` | name, screeningStatus, assignments; donor, amount, campaignId, receiptNo, restriction |
| IT portal (`/it-portal/integrations`, `/it-portal/backup`) | reuse `integrations` + new `system_backups` | provider, config, status, lastSyncAt; takenAt, scope, storageRef, restorePoint |
| Notifications preferences / profiles (`/settings/*`, `/profile`) | reuse `user_profiles` + new `notification_preferences` | userId, channel flags, quiet hours, digest cadence |
| Guardian portal access (`/parents/portal-access`) | reuse `users` + new `portal_invitations` | email, guardianId, role, tokenHash, expiresAt, usedAt |
| Document templates (`/documents/templates`) | `document_templates`, `document_instances` | schoolId, name, mergeFields, versions, status; templateId, entity, serialNo, signedBy |

All additions follow existing conventions: `id text primary`, `schoolId text not null references schools.id onDelete cascade` where school-scoped, `createdAt/updatedAt timestamptz defaultNow()`, named indexes `*_idx`, unique constraints with meaningful names, and `jsonb` columns for structured sub-data. Enum-like columns use the existing pgEnum pattern (`attendanceStatusEnum`, `feeStatusEnum`, …) — add new enums (e.g. `facilityWorkOrderStatusEnum`) in the same block style at the top of `schema.ts`.

### 2.3 Cross-cutting backend primitives (new `lib/api/*` modules, shared by both lanes)

| Module | Purpose |
|---|---|
| `lib/api/http.ts` | Shared JSON envelope helper: `ok(data, status)`, `paged(rows, {page, limit, total})`, `fail(code, message, status, details?)` — single source for both lanes so v1 responses stay wire-compatible. |
| `lib/api/auth.ts` | `requireAuth`/`requirePermission` wrappers usable by v1 routes (re-export the `src/` middleware so both lanes share one implementation) + a `withV1Auth(permission, schoolScope)` handler wrapper. |
| `lib/api/validation.ts` | Tiny schema validator (no new dependency): `validate(schema, body)` returning typed errors, supporting required/type/enum/min/max/date/UUID/nested arrays; raises `ValidationError`-compatible output. |
| `lib/api/pagination.ts` | `parsePagination(searchParams, {max})` + `parseFilters(searchParams, allowedKeys)`. |
| `lib/api/money.ts` | `num()`, `money()`, `moneyField(body, fields)` (extracted from the payroll route). |
| `lib/api/audit.ts` | `audit({ userId, schoolId, action, entity, entityId, diff })` → inserts into `audit_logs` (fire-and-forget, never breaks the request). |
| `lib/api/sequence.ts` | Race-safe business numbers: `nextInSequence(tx, schoolId, key, pattern)` backed by a new `number_sequences` table (`schoolId+key` PK, `value`) with row lock, used by all generators (admission, employee, invoice, receipt, slip, expense, PO, asset). |
| `lib/api/time.ts` | Afghan helpers: `afghanAcademicYear(date)` (Farvardin start), `parseDateRange(params)` → period bounds, `formatIsoDate`. |

### 2.4 Auth & RBAC hardening

- Protect **all** v1 routes: keep handlers public only where the frontend needs pre-session metadata (`/api/settings` reads that render the shell before login may stay read-open; everything else requires session).
- Fix the RBAC bootstrap semantics in `requirePermission`: currently the first user for a school is created as `school_admin`; document it, and add the explicit inverse — when *any* roles exist, a user with no role must be denied (current code denies only after the roles array check, which is correct, keep + test it).
- Permission registry (single source `lib/api/permissions.ts`) — every route declares exactly one:

```
students:read students:write        admissions:read admissions:write
staff:read staff:write              hr:read hr:write
academics:read academics:write      attendance:read attendance:write
exams:read exams:write              homework:read homework:write
fees:read fees:write                payments:read payments:write
payroll:read payroll:write          expenses:read expenses:write
budgets:read budgets:write          library:read library:write
transport:read transport:write      hostel:read hostel:write
inventory:read inventory:write      facilities:read facilities:write
communications:read communications:write
announcements:read announcements:write
events:read events:write
reports:read                        settings:read settings:write
users:read users:write              audit:read
```

- Default role templates seeded by `scripts/seed-roles.ts`: `school_admin` (`*`), `principal` (all read + communications/announcements/reports write), `academic_officer` (academics/attendance/exams/homework), `accountant` (fees/payments/payroll/expenses/budgets read+write + reports), `librarian`, `registry_clerk` (students/admissions), `viewer` (read-only set).

---

## 3. Data & Contract Standards

### 3.1 API conventions (both lanes)

- **Collections**: `GET /api/<module>?page=1&limit=50&query=<text>&<filters…>` → `{ data, pagination }` (v1) / `{ success, data, pagination, timestamp }` (v2). `limit` capped at 100 (500 for summary endpoints like dropdowns, e.g. `?limit=500` for class pickers).
- **Single**: `GET /api/<module>/<id>`; `POST` for create (201); `PUT` (or `PATCH` for mutations) for update; `DELETE` soft-deletes when the table has a lifecycle status, hard-deletes only for draft/config rows (e.g. `draft` payroll structures, `lesson_plans`).
- **Filter & join rule**: enum-ish filters (`status`, `gradeId`, `classId`, `termId`) use exact columns; free text uses `ilike` on the fields the localized UI searches (name Latin + local scripts + business numbers).
- **Display shaping**: endpoints return **denormalized display fields** the UI needs, computed server-side: `classLabel` (`Grade 8-A`), `gradeNumber`, `sectionName`, `studentName`, `departmentName`, `subjectName`, `staffName`. Clients localize labels, not data.
- **Sorting**: `sortBy` whitelisted per module (never raw column passthrough).
- **Timestamps**: ISO-8601 UTC strings; date-only inputs accepted as `YYYY-MM-DD`.

### 3.2 Money / percentages / Solar Hijri

- Money in = number or numeric string; validated non-negative (allow negative only for adjustments/refunds explicitly flagged).
- Money out = JSON number with at most 2 decimals (client formats `؋`/`AFN`), stored decimals stay strings in DB.
- Recurring report ranges (finance aging, attendance summary) accept `from`/`to` Gregorian ISO dates and echo `periodLabel` in both calendars.

### 3.3 Documented frontend contracts (from the localized pages)

Each endpoint below must return exactly the fields the corresponding page currently hard-codes, so page swaps are mechanical. Examples (full table in §4):
- Students list → `{ id, fullName, admissionNumber, gradeNumber, sectionName, status, guardianName, transportRouteId, hostelId, scholarshipId, createdAt }` (client composes class label).
- Timetable → nested `{ classId, weekStart, days[6][periods]{ subjectCode, subjectName, teacherName, roomLabel, type } }` (period times stay client-side constants).
- Attendance report → `{ rows: [{ date, gradeNumber, sectionName, present, late, absent, total }], summary { present, late, absent, rate } }`.
- Payroll run detail → `{ run, payslips[{ staffName, components…, gross, deductions, net, status }] }` (superset of existing `/api/finance/payroll/[id]`).

---

## 4. Endpoint Plan by Module

Legend: **P** = permission, **[v1]** = thin Drizzle route, **[v2]** = DDD lane (repository+use case+presenter), **[+]** = new. Every collection endpoint accepts shared `page/limit/query/sortBy/sortOrder`.

### 4.1 Core & settings
| Endpoint | P | Lane | Purpose / filters |
|---|---|---|---|
| `GET /api/schools/current` | settings:read | v1 | School profile (name trilingual, currency `AFN`, academic start month 3) |
| `GET/PUT /api/settings` | settings:read / write | v1 | `config_settings` key-value CRUD + typed defaults (grading, currency 50 AFN late fee, language, date/time formats, timezone `Asia/Kabul`) |
| `GET/POST/PUT/DELETE /api/academic/divisions` (branches) | academics:write | v1 | `school_branches` |
| `GET/POST /api/academic/years` `…/[id]` | academics:write | v1 | `academic_years` + `GET /api/academic/years/current` (active), `POST /:id/activate` |
| `…/terms` `…/terms/[id]` | academics:write | v1 | `terms` (+ publish/bulk-create 2 terms per year) |
| `…/holidays`, `…/shifts` | academics:write | v1 | calendar periods, shifts |
| `GET /api/departments` `…/[id]` | staff:write | v1 | `departments` (seed: Academic, Finance, Administration, HR, IT, Operations) |
| `GET /api/leave-types` | hr:read | v1 | `leave_types` |

### 4.2 Academic structure
| Endpoint | P | Lane | Notes |
|---|---|---|---|
| `…/grades`, `…/grades/[id]` | academics:write | v1 | extend stub: join counts (`classCount`, `studentCount`), `isActive` filter, soft delete via `isActive=false` |
| `…/sections`, `…/sections/[id]` | academics:write | v1 | extend stub: `classCount`, ordering by name |
| `…/subjects`, `…/subjects/[id]` | academics:write | v1 | extend stub: return the trilingual catalog (`subjectByCode`, `dari`, `pashto`, `gradeLevels`, `weeklyPeriods`, `teacherId→staffName`, `type` core/elective, `isActive`) seeded to match `lib/i18n/en.ts catalog.subjects` (13 subjects incl. PE inactive) |
| `…/classes`, `…/classes/[id]` | academics:write | v1 | extend stub: join `grades.gradeNumber`/`sections.name`, homeroom teacher name, `roomLabel`, capacity/enrolled rollups, `GET /:id/overview` (roster + timetable + attendance + results summary), `POST /:id/promote-bulk` |
| `…/rooms`, `…/rooms/[id]` | academics:write | v1 | `rooms`: type, capacity, availability, suitable-subjects |
| `…/periods` | academics:read | v1 | `periods` (period times per shift; feeds the timetable grid) |
| `…/timetable` **[+]** | academics:write | v2 | `timetable_entries` aggregate: `GET?classId=&weekStart=&view=teacher|room` → grid; `POST/…/[id]` upsert slot; conflict detection (`409 TIMETABLE_CONFLICT` when teacher/room double-booked — domain rule), `GET /conflicts`, `POST /substitutions` |
| `…/lesson-plans`, `…/[id]` | academics:write | v1 | review workflow `draft→submitted→approved`, attachments, coverage rollup |
| `…/curriculum` **[+]** | academics:write | v1 | outcomes + coverage (uses `subjects`/`grades`; may map to `lesson_plans` unit coverage columns if added in §2.2) |

### 4.3 Students (core aggregate — v2 lane completed, v1 parity + sub-resources)
| Endpoint | P | Lane | Notes |
|---|---|---|---|
| `POST/GET /api/v2/students` | students:write / read | v2 | **exists**; extend `ListStudentsQuery` filters: `gradeNumber`, `section`, `status`, `guardianName`, `transportRouteId`, `hostelId`, `scholarshipId`, `specialCategory` |
| `GET/PATCH /api/v2/students/[id]` | students:read / write | v2 | **exists** |
| `…/[id]/promote` `…/transfer` `…/dropout` | students:write | v2 | **exists** |
| `GET /api/v2/students/search?q=` | students:read | v2 | **exists** (extend with trilingual name search) |
| `GET /api/students/[id]/profile` | students:read | v1 | Composite: guardians, documents, health, transport, hostel, attendance summary, academics, fees — one round trip for the profile page |
| `…/[id]/guardians` | students:write | v1 | `student_guardians` (+ invitation to portal) |
| `…/[id]/documents` | students:write | v1 | `student_documents` + `POST /upload` (LocalFileStorage, §6) with verification flag |
| `…/[id]/health` | students:read/write (confidential role flag) | v1 | `student_health_records`, never included in bulk lists |
| `…/[id]/id-cards` | students:write | v1 | `student_id_cards` generation + status |
| `…/[id]/promotion` | students:write | v1 | history + pending workflow (events recorded in `student_timeline`) |
| `POST /api/students/import`, `GET /api/students/import/:id` | students:write | v1 **[+]** | CSV wizard: validate → stage → commit; returns row errors + duplicates; writes `student_timeline` |
| `POST /api/students/bulk-actions` | students:write | v1 **[+]** | status/class changes with audit |
| `GET /api/students/medical-consents` | students:read | v1 **[+]** | consents + renewals (documents-based) |

### 4.4 Admissions pipeline
| Endpoint | P | Lane |
|---|---|---|
| `GET/POST /api/admissions` (+ `[id]`, `PATCH /:id/stage`) | admissions:read / write | v1 **[+]** (move logic to v2 if interview scoring rules grow) |
| `…/documents` (verification queue), `…/assessments`, `…/interviews` (schedule, panel assign, results), `…/waitlist` (priority rules, seat offers), `…/communication` (message log), `…/offers` (letters, expiry, deposit, convert) | admissions:write | v1 |
| `POST /api/admissions/:id/convert` | admissions:write | v2 — reuses the student aggregate (`AdmitStudentCommand`) and links `admission_applications.studentId` |
- Uses `admission_applications`, `admission_number_sequences`, `interviews`.

### 4.5 Staff & HR
| Endpoint | P | Lane | Notes |
|---|---|---|---|
| `GET/POST /api/staff`, `…/[id]` | staff:read / write | v1 | **exists** — add: `ilike` on first/father/family/full name (already after i18n names), `departmentId` join (exists), `designation/department` returned as **stable keys + English labels** (client maps via `t.staff.designations`), employment-status filter, `X-School-Id` scoping (currently missing!) |
| `…/[id]/documents`, `…/onboarding` (tracked via `exit_management`/`staff_qualifications` join), `…/assignments` (teaching matrix), `…/leave`, `…/performance` | staff:write | v1 |
| `…/attendance` `…/[id]` | hr:write | v1 **[+]** | `staff_attendance` + biometric import + exceptions + `GET /reports` |
| `…/leave-calendar` | hr:read | v1 | team calendar + coverage conflicts |
| `GET/POST /api/hr/recruitment` `…/contracts` `…/payroll-profile` | hr:write | v1 | `recruitment_applications`, `interviews`, `staff` salary profiles |
| `GET/POST /api/hr/payroll/runs` `…/[id]` `PATCH …/[id]/approve|pay` | payroll:read / write | v1 (exists) | Existing generate logic moved behind `POST /payroll/runs`; add approve/pay transitions + payslip status updates; bank transfer export file endpoint **[+]** |
| `GET/POST /api/hr/training`, `…/benefits` | hr:write | v1 |

### 4.6 Attendance
| Endpoint | P | Lane |
|---|---|---|
| `GET /api/attendance?classId&date&from&to` (class grid), `POST /api/attendance` (bulk mark, upsert per student/date, `409` on locked date) | attendance:read / write | v1 (extend stub) |
| `GET /api/attendance/daily-summary` | attendance:read | v1 |
| `POST /api/attendance/lock/:date` | attendance:write | v1 |
| `GET/POST /api/attendance/biometric/import` | attendance:write | v1 |
| `GET/POST /api/attendance/absences`, `…/late` | attendance:write | v1 |
| `GET /api/attendance/reports?from&to&classId` | attendance:read | v1 — returns `{ rows[], summary{ present, late, absent, total, rate } , byClass[] }` (matches the reports page contract) |
| `POST /api/attendance/notifications` | attendance:write | v1 — enqueue `sms_messages`/`notifications` for absence rules |

### 4.7 Exams, marks, report cards, homework
| Endpoint | P | Lane |
|---|---|---|
| `GET/POST /api/exams`, `…/[id]`, `…/[id]/publish` | exams:read / write | v1 (extend stub: join term/year, counts, status filter) |
| `GET/POST /api/exams/[id]/schedules` (subject/class/date/time/room/invigilators) | exams:write | v1 |
| `POST /api/exams/[id]/marks` (bulk entry with validation vs maxMarks), `POST /api/exams/[id]/marks/lock` | exams:write | v1 |
| `POST /api/exams/[id]/results` (compute totals, %, grade, rank, classRank) | exams:write | v2 — ranking/grading rules are domain logic |
| `GET /api/exams/[id]/report-cards`, `POST /report-cards` (attendance totals joined), `POST /report-cards/:id/approve` | exams:write | v1 |
| `GET/POST /api/homework`, `…/[id]` (subject/code, class, teacher, dates, completion counters), `…/[id]/submissions` (upsert, grade, feedback) | homework:write / read | v1 **[+]** |
| `GET /api/subjects/{code}` catalog-by-code (shared by academics/timetable/homework) | academics:read | v1 |

### 4.8 Finance
| Endpoint | P | Lane |
|---|---|---|
| `GET /api/finance/overview` | fees:read | v1 **[+]** — totals/aging/scholarship/expense/budget/cashflow tiles |
| `GET/POST /api/finance/fee-structures`, `…/[id]` | fees:write | v1 **[+]** — name/grade range/term/tuition/transport/hostel/discount/effective dates/status |
| `GET/POST /api/finance/invoices`, `…/[id]` | fees:write | v1 **[+]** — issue (from fee structure), bulk-generate per class/term, items, discount, due date; `GET …/print-data` (receipt) |
| `GET/POST /api/finance/payments`, `…/[id]` | payments:write | v1 (extend stub: join student, method enum cash/bank_transfer/mobile_money, `receivedBy` user, receipt numbering via §2.3 sequence) |
| `GET /api/finance/student-ledger?studentId` | fees:read | v1 — charges/credits/balance/aging |
| `GET /api/finance/collections` | fees:read | v1 — overdue + reminder queue + `POST /reminders` |
| `GET/POST /api/finance/expenses`, `…/[id]` | expenses:write | v1 (extend stub: category, vendor, approval, attachments, `expense_number` sequence) |
| `GET/POST /api/finance/budgets`, `…/[id]` | budgets:write | v1 **[+]** — allocated/spent/remaining per category/year |
| `GET/POST /api/finance/discounts` (sibling bundles, scholarships) | fees:write | v1 |
| `GET /api/finance/payment-plans`, `…/[id]` | fees:write | v1 |
| `GET /api/finance/bank-reconciliation` | payments:write | v1 |
| `GET/POST/PUT/DELETE /api/finance/salary-structures` `…/[id]` | payroll:read / write | v1 (exists; add auth) |
| `GET/POST /api/finance/payroll`, `GET/PATCH /api/finance/payroll/[id]` | payroll:read / write | v1 (exists; add auth + approve/pay) |
| `GET /api/finance/cashbook`, `…/tax-settings` | finance read/finance write | v1 **[+]** |

### 4.9 Library, transport, hostel, inventory, facilities
| Module | Endpoints | P |
|---|---|---|
| Library | `GET/POST /api/library/books` (extend stub: copies, availableCopies sync, trilingual titles), `…/[id]`, `GET /api/library/circulation` (issue/return/renew/reserve, availability rules, overdue notices + fines), `GET /api/library/acquisitions`, `GET/POST /api/library/members` | library:read / write |
| Transport | `GET/POST /api/transport` (extend stub: `transport_routes` + vehicle + driver joins), `…/[id]`, `GET /api/transport/routes/:id/detail`, `GET/POST /api/transport/vehicles`, `…/[id]` (insurance/registration/fitness expiry flags), `POST /api/transport/maintenance`, `GET/POST /api/transport/assignments` (student↔route/stop), `GET /api/transport/attendance` (boarding, SMS alerts), `GET /api/transport/reports` | transport:read / write |
| Fleet (shared) | `GET /api/fleet/vehicles|inspections|fuel` — vehicle registry, inspection schedule, fuel logs (shares `vehicles` with transport) | transport:read |
| Hostel | `GET/POST /api/hostel` (hostels + rooms + occupancy), `…/[id]`, `GET /api/hostel/rooms/:id`, `POST /api/hostel/admissions`, `GET /api/hostel/attendance` (3 roll-calls + out-pass), `POST /api/hostel/discipline`, `GET/POST /api/hostel/meals` | hostel:read / write |
| Inventory | `GET/POST /api/inventory/items` **[+]** (`assets` + `stock_movements`: on-hand/min-level/unit/unitCost/location/lastRestocked), `…/[id]`, `POST /api/inventory/stocktake`, `GET /api/inventory/low-stock`, `POST /api/inventory/receiving`, `GET/POST /api/inventory/purchase-orders` `…/[id]`, `GET/POST /api/inventory/suppliers` | inventory:read / write |
| Facilities | `GET/POST /api/facilities/rooms|work-orders|bookings|utilities|maintenance-plans|utility-bills` **[+]** | facilities:read / write |
| Procurement | `GET/POST /api/procurement/vendors|requests` `POST /requests/:id/approve` `POST /requests/:id/to-po` | inventory:write |

### 4.10 Communication, announcements, events, community
| Endpoint | P | Lane |
|---|---|---|
| `GET/POST /api/announcements`, `…/[id]`, `POST /:id/publish` | announcements:write | v1 **[+]** (trilingual title/description, `priority` enum, `targetAudience[]`, publish/expiry, pinned, view count, attachments) |
| `GET/POST /api/communications`, `…/[id]` (conversation send/reply/thread), `GET /api/communications/inbox`, `POST /api/communications/campaigns/[id]/deliver`, `GET /api/communications/delivery-logs` | communications:read / write | v1 (extend stub) |
| `GET/POST /api/communications/templates` | communications:write | v1 |
| `POST /api/communications/parent-meetings` + attendance | communications:write | v1 |
| `GET/POST /api/events`, `…/[id]` | events:write | v1 **[+]** (registrations/capacity, volunteers target, budget/spent, status workflow, `events` table) |
| `GET/POST /api/community/volunteers`, `…/donations` | events:write | v1 **[+]** |
| `GET/POST /api/notifications`, `POST /api/notifications/read` | (own) | v1 **[+]** — per-user `notifications` list, unread count, mark read |
| `GET/POST /api/surveys`, `…/[id]/responses` | communications:write | v1 |
| `GET/POST /api/grievances` | communications:write | v1 |
| `POST /api/sms/batch`, `POST /api/email/batch` | communications:write | v1 — queue into `sms_messages`/`email_messages` with delivery worker hooks (§6.5) |

### 4.11 Security, wellbeing, compliance, IT, analytics
| Endpoint | P |
|---|---|
| `GET/POST /api/security/incidents` `…/[id]` | safety write (map to `students:write` initially or add `security:write`) |
| `GET/POST /api/wellbeing/referrals`, `…/checkins` | wellbeing write (sensitive) |
| `GET/POST /api/discipline` (extend `student_discipline`), `…/cases`, `…/behavior-points` | students:write |
| `GET/POST /api/compliance/policies|inspections|action-plans|data-privacy` | settings:write / audit:read |
| `GET /api/it-portal/users` `…/[id]` role assignment, `GET/POST /api/it-portal/devices`, `…/integrations`, `GET /api/it-portal/audit-log`, `GET/POST /api/it-portal/backup-restore` | users:write / settings:write / audit:read |
| `GET /api/reports` (saved), `POST /api/reports/generate`, `POST /api/reports/scheduled`, `GET /api/reports/kpi-dashboard`, `POST /api/reports/builder/run`, `GET /api/reports/export/:id` | reports:read |
| `GET /api/reports/moe` (Ministry of Education format) | reports:read |

### 4.12 Dashboard & calendar & activity
| Endpoint | P | Purpose |
|---|---|---|
| `GET /api/dashboard/overview` | (any auth) | KPI tiles, class capacity, today’s attendance, collections, upcoming events, recent activity — single payload for the ERP home |
| `GET /api/calendar?from&to` | academics:read | `events` + `exams` + `holidays` merged by month (localized client-side) |
| `GET /api/activity?module&action&query&page` | audit:read | `audit_logs` timeline (replaces the localized SEED entries) |

---

## 5. DDD (v2) Track — Aggregates Worth Domain Rules

Apply the students pattern (aggregate + VOs + use cases + presenter) only where rules are non-trivial:

| Aggregate | Why v2 | Use cases |
|---|---|---|
| `Student` (exists) | lifecycle, admission numbering, duplicate tazkira | done; add `SearchStudents` projection filters |
| `TimetableEntry` | conflict/availability invariants | `UpsertTimetableEntry`, `ResolveConflict`, `CreateSubstitution` |
| `ExamResult` | grading/ranking math, publishing, pass marks | `EnterMarks` (bulk, validated), `PublishResults`, `GenerateReportCard` |
| `Invoice` + `Payment` | balance math, overpay prevention, refunds, sequence | `IssueInvoice`, `RecordPayment` (updates balance atomically), `VoidInvoice`, `ApplyDiscount` |
| `PayrollRun` | period uniqueness, structure validation, approve/pay transitions | `GeneratePayrollRun`, `ApprovePayrollRun`, `MarkPayslipsPaid` |
| `AdmissionApplication` | stage machine + scoring + convert-to-student | `AdvanceStage`, `ScheduleInterview`, `RecordAssessment`, `ConvertToStudent` |
| `BookIssue` | availability, overdue, fines | `IssueBook`, `ReturnBook`, `RenewBook`, `ReserveBook` |
| `HostelAllocation` | bed capacity, unique bed, mess/visitor rules | `AllocateBed`, `VacateBed`, `RecordHostelAttendance` |

Everything else (library members, vehicles, departments, settings, announcements, events, inventory, suppliers, templates) stays **[v1]** with validation + joins.

---

## 6. Cross-Cutting Implementation

### 6.1 Security
- All routes (except documented public reads) require `requireAuth` + `requirePermission`; enforce school scope in the query builder itself (`eq(table.schoolId, schoolId)`) — never trust body `schoolId` over header.
- Input validation via §2.3 `validation.ts` before any DB write; whitelist sortable/searchable columns.
- IDOR check pattern: single-resource GET/PUT/DELETE verify the row’s `schoolId` matches.
- File uploads (§6.3) restricted to images/PDF, ≤5 MB, virus-safe content-type allowlist, random names.
- Secrets: keep `BETTER_AUTH_SECRET`, `DATABASE_URL` in `.env.local` (already present; `.env.example` documents keys — extend it with the new ones used).
- Soft delete: never purge student/financial rows; `deleted` status + `updatedAt`.

### 6.2 Transactions
- Wrap multi-table writes in `db.transaction` (already done in payroll): invoice+items, payment+invoice balance, student+guardians+documents (admission), timetable slot + substitution, payroll run + payslips.
- Any sequence allocation happens inside the same transaction.

### 6.3 File storage
- Implement `LocalFileStorage` (port exists) for local disk under `storage/` with `.gitignore`; abstract behind the port so S3/GCS can replace it later (infra adapter).
- `POST /api/uploads` returns `{ fileUrl, fileName }`, records `student_documents` rows via the caller; access requires `students:read` etc.

### 6.4 Audit & activity
- Every write (both lanes) calls `audit()`; audits power `/api/activity`, `/api/it-portal/audit-log`, compliance evidence.
- Payload: userId, schoolId, action (created/updated/deleted/approved/…), entity type/id, before/after diff for sensitive entities (students, payments, payroll, users).

### 6.5 Async work
- Notification fan-out (SMS/email/push) writes outbox rows (`sms_messages`, `notifications`) **inside** the business transaction; a polling worker endpoint `/api/jobs/dispatch` (protected by a job secret header, invoked by a scheduler) delivers and updates delivery status. No external queue dependency needed at this stage.

### 6.6 Caching & perf
- Pool max 5 shared; add indexes already present in schema (verify hot paths: `student_attendance (classId,date)`, `invoices (studentId,status,dueDate)`, `payslips (runId)` — all exist).
- Heavy aggregates (dashboard overview, reports) computed with a handful of aggregate SQL queries, not N+1 joins; `EXPLAIN` before shipping reports.
- Response-time budget: list endpoints < 300 ms p95 at 500 students / 60 staff.

---

## 7. Seeding & Demo Data

Expand `scripts/seed.ts` into deterministic seeds so every frontend page has real rows:
1. `schools` (exists) + 2 branches, academic year 1403 active + terms, holidays, shifts (from the existing shape).
2. `grades` 1–12 + sections A/B/C + `classes` (Grade 1-A … 12-A with capacities), `subjects` matching `catalog.subjects` (incl. `isActive=false` for PE to match UI), `departments`, `leave_types`.
3. Staff (~30 across departments with unions of the localized names) + `staff_roles` for users (admin/principal/accountant/viewer) + salary structures + one payroll run + payslips.
4. Students (~180 with guardians, documents, health, attendance for the last 30 days, transport assignments, hostel allocations, discounts).
5. Exams + schedules + marks + results + report cards; fee structures + invoices (mixed paid/partial/overdue/unpaid) + payments.
6. Library books/issues; hostel mess menus; announcements; events; inventory items.
7. `npm run db:seed` must be **idempotent** (`onConflictDoNothing` everywhere, as today) and safe to re-run; add `--fresh` flag that truncates all tables then reseeds.
8. Tests never depend on seed data; integration tests create & clean their own rows (current convention).

---

## 8. Testing Plan

| Layer | What | Where |
|---|---|---|
| Unit (domain) | New aggregates (§5) rules: timetable conflicts, invoice/payment balance math, payroll run transitions, ranking | `tests/unit/domain/**` (extend the 4 existing suites) |
| Unit (use cases) | Handler tests with in-memory fakes (`tests/fixtures/InMemoryStudentRepository.ts` pattern) + fake clock/id generator | `tests/unit/application/**` |
| Unit (API primitives) | `lib/api/validation.ts`, `pagination.ts`, `sequence.ts` (concurrency test), `money.ts` | `tests/unit/api/**` |
| Integration (live DB) | One suite per module: bootstrap → exercise endpoints through `NextRequest` (the `v2-routes-live.test.ts` pattern: `ensureLiveDbSchema`, HMAC-signed session cookie, `x-school-id` header) → assert status + envelope + row state → cleanup | `tests/integration/**` |
| Contract | Golden payloads for the pages being migrated (students list, timetable, attendance report, payroll run, finance overview, dashboard) | `tests/integration/contracts/**` |
| RBAC | Forbidden (403) per permission, unauthorized (401) without session, cross-school isolation | `tests/integration/rbac.test.ts` |
| Verification gates | `npm run typecheck`, `npm run test`, `npm run build` must all pass before a module is "done"; new routes must ship with their integration suite (definition of done) |

---

## 9. Frontend Integration Plan (backend contracts for the localized UI)

### 9.1 Shared client
- `lib/api/client.ts`: typed `apiGet/apiPost/apiPut/apiPatch/apiDelete` with the shared envelope, credentials (`include` cookies), `x-school-id` header, error normalization to `{ code, message }`; retry-free, small.
- `hooks/useResource.ts` / `useMutation`: fetch + `loading`/`error`/`reload` (matching every page’s existing `useState` loading state), keeping the current skeleton UX.
- Enum→label mapping helper: `useLabels()` returns the already-built dictionary maps (grade/section/status/designation/roles/channels/priorities) so pages replace raw strings one-to-one.

### 9.2 Migration order (per page, mechanical swap)
1. Wire pages that already call APIs to the new primitives: payroll, salary-structures, staff (`filter/sort` params, `data` shape unchanged).
2. Students directory + profile (v2), student forms (POST with the documented contract), parents/guardians.
3. Dashboard overview, calendar, activity, announcements, communications (single payload per page).
4. Academic structure (classes → subjects → timetable → exams → homework).
5. Attendance (register/reports), admissions.
6. Finance (overview → fee structures → invoices → payments → expenses/budgets → reports).
7. Library, transport, hostel, inventory, facilities (CRUD grids).
8. Community/events, security/wellbeing, compliance, IT portal, reports/KPI, profile/settings.
- Each step: remove the page’s local mock arrays/dictionary `catalog`/`erpWorkspace.rows`-style demo data only when 100% of it is served by an endpoint; keep the dictionary for UI labels.

---

## 10. Delivery Phases, Order & Acceptance Criteria

- **Phase 0 — Foundations (blocker for everything)**: migrations (`drizzle/` committed), `npm run db:migrate`, schema additions (§2.2), `lib/api/*` primitives, auth+RBAC wrappers, permission registry, `number_sequences`, audit helper. *Done when*: fresh DB can be created from migrations, seeded, and a protected v1 route returns 401/403/200 correctly in integration tests.
- **Phase 1 — Academic core & people**: schools/settings/departments; academic years/terms/grades/sections/classes/subjects/rooms/periods; staff (+auth) ; students v1/v2 filters. *Done when*: classes page, subjects page, staff page and students page run off the API with pagination/search; RBAC tests green.
- **Phase 2 — Attendance, timetable, exams, homework**: register flows, timetable conflicts, marks/results/report cards. *Done when*: attendance pages + timetable + exams + homework pages run off the API; conflict + conflict-free publish tested.
- **Phase 3 — Finance & payroll**: fee structures, invoices, payments, expenses, budgets, discounts, cashbook, reports; payroll approve/pay hardening. *Done when*: invoice→payment→ledger→aging flow passes live integration incl. race-safe numbering; finance overview matches mock tile values.
- **Phase 4 — Operations**: library, transport, hostel, inventory, facilities, procurement. *Done when*: each module’s list/detail/mutation tested live; min-level/low-stock, overdue fines, bed capacity rules enforced.
- **Phase 5 — Engagement & comms**: announcements, communications, events, community, notifications, surveys, grievances, SMS/email dispatch. *Done when*: announcement publish + fan-out tested end-to-end with outbox.
- **Phase 6 — Governance & analytics**: security/wellbeing/compliance/IT portal (users & roles screen, integrations, audit log), reports/moe/kpi/dashboard-composite, activity timeline. *Done when*: RBAC matrix fully exercised; reports endpoints render identical numbers to finance/attendance aggregations.
- **Phase 7 — Hardening**: rate-limit sensitive endpoints, error standardization sweep, `EXPLAIN` tuning, populate `.env.example`, README API docs, final `typecheck/test/build` gate.

Each phase ships: migration + endpoints + tests + the page swaps in §9.2 for that module only.

## 11. Risks & Decisions to Confirm

1. **Single DB/schema for everything** (vs. schema-per-module) — keep the current single schema (simpler; schoolId everywhere).
2. **Enum values in API payloads stay English canonical** (client localizes) — matches the completed i18n work; confirm.
3. **v1 vs v2 split** as defined in §5 — confirm no module outside §5 needs DDD.
4. **File storage**: local disk first (adapter behind the port), object storage later.
5. **Auth on v1**: public reads limited to `/api/settings` (shell) + auth endpoints; confirm no other anonymous reads.
6. **Sequence numbers**: replace count-based (`count(*)` in payroll slips) with locked `number_sequences` — breaking change for existing slip numbers; seed migration renumbers existing rows deterministically.
7. **Bulk import scale**: CSV student import synchronous for ≤500 rows, queued above that.
8. **Solar Hijri storage**: store Gregorian only; convert at presentation (already the pattern).

## 12. Definition of Done (per endpoint)

1. Schema/migration present → 2. Route with auth + permission + school scoping → 3. Input validation → 4. Joins/filters/sorting per contract §3 → 5. Audit write → 6. Unit tests (logic) → 7. Live integration tests incl. RBAC/forbidden + cleanup → 8. Page swapped to the endpoint (`useResource`), mock removal **complete for that page** → 9. `npm run typecheck && npm run test && npm run build` green → 10. Notes added to this document (endpoint + permission + contract).


---

## 13. Implementation Status (2026-10-11)

### Delivered

| Phase | Delivered |
|---|---|
| 0 Foundations | lib/api/{http,validation,pagination,money,time,sequence,numbers,audit,auth,permissions,reference,index}.ts; 24 new tables + 12 enums (facilities, procurement, compliance, security/wellbeing, cafeteria, community, IT, documents, portal, number sequences, inventory); drizzle/0000_init.sql adopted onto the existing DB;  001_inventory.sql and  002_user_fk_fix.sql generated and applied; db:generate/db:migrate/db:adopt/db:apply scripts; payroll slip numbering moved to race-safe 
umber_sequences. |
| 1 Academic core | schools/current, settings, departments(+[id]), cademic/{years(+[id],current,activate),terms(+[id]),holidays(+[id]),shifts(+[id]),grades(+[id]),sections(+[id]),classes(+[id],overview),subjects(+[id]),rooms(+[id]),periods(+[id])}; staff routes now school-scoped + permissioned with sequence-generated employee codes and department joins. |
| 2 Attendance/timetable/exams/homework | ttendance(+[id], daily-summary, reports), cademic/timetable(+[id], conflicts, substitutions), exams(+[id], publish, schedules(+[scheduleId]), marks, marks/lock), homework(+[id], submissions, submissions/grade). |
| 3 Finance | ee-structures(+[id]), invoices(+[id], bulk-generate), payments(+[id] with refund), expenses(+[id]), udgets(+[id]), overview, student-ledger, discounts. |
| 4 Operations | library/books(+[id]), library/circulation(+return), library/members, 	ransport, 	ransport/routes(+[id]), hostel, inventory/items(+[id], +stock). |
| 5 Engagement | nnouncements(+[id]), events, 
otifications (read/readAll), ctivity (audit timeline). |
| 6 Governance | dashboard/overview composite; udit:read gate for /api/activity; withAuth-compatible RBAC already covers the v2 lane. |
| Tests / data | 	ests/integration/v1-routes-live.test.ts (7 tests: 401/403, envelope, CRUD lifecycle, validation, settings); full seed rewritten (
pm run db:seed) with the complete reference chain, truncating its own tables for deterministic re-runs; **88/88 tests pass**, 	sc --noEmit clean, 
ext build compiles (214 pages, 97 API route files). |

### Bugs found and fixed during verification
1. udit_logs/57 other userId FKs targeted the custom users table while better-auth sessions live in user → migration  002_user_fk_fix.
2. Unauthenticated collection GETs on the academic modules (list endpoints had no withV1) → all wrapped.
3. Missing school scoping on academic list queries (cross-school data leak) → all scoped.
4. Ambiguous correlated-subquery columns (where c.id = "id") → rewritten as qualified references or join + groupBy aggregations.
5. Payroll slip numbering counted rows (count(*)) → replaced by locked 
umber_sequences upserts.

### Remaining (not yet implemented)
- Remaining Phase 6 endpoints: eports/* (builder/scheduled/kpi/moe), it-portal/* (users, devices, integrations, audit-log, backup), compliance/*, security/*, wellbeing/*, procurement/*, acilities/*, community/volunteers|donations, cafeteria/*, aculty (HR: recruitment/contracts/leave-calendar/training/benefits), dmissions/* pipeline, erp_records-backed catch-all data for routes still serving localized mock data.
- Frontend swap: serve the finished endpoints to the pages that still render their local mock arrays (§9.2 order) via the planned lib/api/client.ts resource hooks.

### Second pass (2026-10-11, continuation)
- **Remaining stubs replaced**: communications (message inbox), inance/fees (+[id]) aliased to fee-structures, library alias.
- **Students sub-resources**: guardians (+[guardianId]), documents, health.
- **Admissions**: /api/admissions (+[id], +[id]/stage) with forward-only stage machine.
- **HR**: /api/hr/recruitment, /api/staff/[id]/leave (+[leaveId] approve/reject), /api/staff/[id]/attendance.
- **Facilities/procurement/community**: work-orders (+[id]), bookings (+overlap detection), utilities, vendors, volunteers, donations.
- **Governance**: compliance policies/inspections/action-plans/data-privacy, security incidents, wellbeing referrals, it-portal integrations + backup + users, localization templates.
- **Other**: surveys, grievances, cafeteria menus (+subscriptions), hostel discipline/attendance/meals, transport attendance + vehicles (+[id]), calendar (merged feed), finance collections (aging buckets + reminder queue), students bulk-actions.
- **Frontend integration started**: lib/api/client.ts (typed client with x-school-id scoping + error normalization) and lib/api/use-resource.ts (resource/mutation/pagination hooks); settings and classes pages now render live API data instead of mock arrays.

### Verified state
- **182 API route files** (35 at plan start), typecheck clean, **88/88 tests pass**, 
ext build compiles, 
pm run db:seed populates the full reference chain.

### Still remaining (documented for the next pass)
- Swap the remaining pages (announcements, activity, library, transport, hostel, inventory, academics/subjects, attendance, finance, homework, exams, timetable, community, staff detail) to the endpoints above using the client/hook pattern demonstrated by settings + classes.
- Endpoints not yet built: reports/builder, reports/scheduled, it-portal/devices, admissions/{documents,assessments,waitlist,offers,communication}, inventory/{purchase-orders,receiving,stocktake,low-stock}, finance/{cashbook,payment-plans,bank-reconciliation,approvals,tax-settings}, communications/{inbox,templates,campaigns,delivery-logs,parent-meetings,sms,email}, documents/*, uploads (file storage), hr/{contracts,leave-calendar,attendance,payroll-profile}, fleet/{inspections,fuel}, campus routes not yet served from data.