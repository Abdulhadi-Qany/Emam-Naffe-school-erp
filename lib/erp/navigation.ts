export type ErpRoute = {
  path: string
  label: string
  group: string
  description: string
  kind: 'directory' | 'detail' | 'workflow' | 'report' | 'calendar' | 'settings'
}

const route = (path: string, label: string, group: string, description: string, kind: ErpRoute['kind'] = 'directory'): ErpRoute => ({ path, label, group, description, kind })

export const erpRoutes: ErpRoute[] = [
  route('/calendar', 'Calendar & events', 'Dashboard', 'School events, exams, holidays, meetings, room bookings, reminders and recurring activities.', 'calendar'),
  route('/activity', 'Activity log', 'Dashboard', 'Auditable timeline of frontend activity across people, academics, finance and operations.', 'report'),
  route('/notifications', 'Notifications', 'Dashboard', 'Unread alerts, approval reminders, parent messages and notification preferences.', 'workflow'),
  route('/settings', 'Settings', 'Administration', 'School profile, campuses, academic configuration, language, currency, roles, imports and appearance.', 'settings'),
  route('/students', 'Student directory', 'People', 'Search and manage enrolled students by grade, section, guardian, transport, hostel, scholarship and status.'),
  route('/students/new', 'New student enrollment', 'People', 'Multi-step enrollment form covering identity, guardian, address, health, documents and placement.', 'workflow'),
  route('/students/EBPS-1403-G8-0045', 'Student profile', 'People', 'Complete student record with guardians, academics, attendance, fees, health, documents and timeline.', 'detail'),
  route('/students/EBPS-1403-G8-0045/attendance', 'Student attendance', 'People', 'Monthly attendance calendar, absence reasons, late records and leave requests.', 'report'),
  route('/students/EBPS-1403-G8-0045/academics', 'Student academics', 'People', 'Subjects, marks, gradebooks, assignments, report cards and transcript preview.', 'detail'),
  route('/students/EBPS-1403-G8-0045/documents', 'Student documents', 'People', 'Tazkira, certificates, uploads, verification status and document expiry tracking.', 'directory'),
  route('/students/EBPS-1403-G8-0045/health', 'Student health', 'People', 'Confidential medical profile, vaccinations, screenings, clinic visits and referrals.', 'detail'),
  route('/students/EBPS-1403-G8-0045/promotion', 'Promotion & transfer', 'People', 'Promotion, transfer, withdrawal and graduation workflow with approvals.', 'workflow'),
  route('/parents', 'Guardian directory', 'People', 'Family directory with linked children, relationships, contacts, portal access and communication history.'),
  route('/parents/guardian-001', 'Family profile', 'People', 'Guardian profile, children, meetings, messages, balances and shared documents.', 'detail'),
  route('/staff', 'Staff directory', 'People', 'Employee records, departments, roles, campuses, employment status and export.'),
  route('/staff/EMP-0092', 'Employee profile', 'People', 'Qualifications, contracts, timetable, attendance, leave, payroll and appraisal history.', 'detail'),
  route('/staff/assignments', 'Teacher assignments', 'People', 'Teacher, class and subject assignments with workload matrix and conflict warnings.', 'workflow'),
  route('/staff/leave', 'Leave management', 'People', 'Leave requests, balances, approval queue and calendar.', 'workflow'),
  route('/staff/performance', 'Performance reviews', 'People', 'Appraisal cycles, goals, reviews, training history and review reminders.', 'report'),
  route('/alumni', 'Alumni directory', 'People', 'Graduation cohorts, contact history, engagement, outcomes and alumni communications.'),
  route('/admissions', 'Admissions pipeline', 'Admissions', 'Application pipeline with stage, source, grade, intake, owner, score and status.', 'workflow'),
  route('/admissions/applications/APP-1403-0024', 'Application detail', 'Admissions', 'Checklist, interview, assessment, decision, fees and enrollment conversion.', 'detail'),
  route('/admissions/documents', 'Admission documents', 'Admissions', 'Verification queue for missing, invalid and expired applicant documents.', 'workflow'),
  route('/admissions/assessments', 'Entrance assessments', 'Admissions', 'Entrance tests, schedules, scoring and results.', 'calendar'),
  route('/admissions/interviews', 'Interview schedule', 'Admissions', 'Interview calendar, panel assignments, notes and outcomes.', 'calendar'),
  route('/admissions/import', 'Admission import', 'Admissions', 'CSV import wizard with field mapping, validation errors and duplicate detection.', 'workflow'),
  route('/academics', 'Academic management', 'Academics', 'Academic year dashboard, terms, grade levels, programs and academic KPIs.'),
  route('/academics/years', 'Academic years & terms', 'Academics', 'Dates, holidays, closures and publishing state for academic year 1403.', 'settings'),
  route('/academics/grades', 'Grade levels & sections', 'Academics', 'Grade levels, capacity, homeroom teachers, rooms and enrollment.'),
  route('/academics/subjects', 'Subject catalog', 'Academics', 'Dari, Pashto, English, Islamic studies, sciences and teacher mapping.'),
  route('/academics/curriculum', 'Curriculum framework', 'Academics', 'Learning outcomes, coverage progress, curriculum mapping and resources.', 'report'),
  route('/academics/lesson-plans', 'Lesson plans', 'Academics', 'Lesson-plan calendar, review workflow, attachments and completion status.', 'calendar'),
  route('/classes', 'Class directory', 'Academics', 'Section rosters, capacity, class teachers, rooms and bulk promotion.'),
  route('/classes/grade-8-a', 'Class overview', 'Academics', 'Roster, timetable, attendance, results, assignments and class notices.', 'detail'),
  route('/timetable', 'Timetable', 'Academics', 'Master scheduler with conflict detection, teacher view, room view and substitutions.', 'calendar'),
  route('/exams', 'Exams & results', 'Academics', 'Exam calendar, assessments, marks entry, moderation, report cards and transcripts.', 'workflow'),
  route('/exams/term-1-1403', 'Exam detail', 'Academics', 'Papers, rooms, invigilators, completion tracking and publish workflow.', 'detail'),
  route('/homework', 'Homework & assignments', 'Academics', 'Assignment board, attachments, due dates, submissions, grading and feedback.', 'workflow'),
  route('/attendance', 'Daily attendance', 'Attendance', 'Registers by class and date with bulk marking, late status, lock and submit.'),
  route('/attendance/biometric', 'Biometric imports', 'Attendance', 'Import preview, matching, exceptions, device status and reconciliation.', 'workflow'),
  route('/attendance/absences', 'Absence requests', 'Attendance', 'Absence reasons, supporting documents and approval queue.', 'workflow'),
  route('/attendance/late', 'Late arrivals', 'Attendance', 'Late arrival register, patterns and parent notices.', 'report'),
  route('/attendance/reports', 'Attendance reports', 'Attendance', 'Daily/monthly trends, class comparison, risk list and export.', 'report'),
  route('/health', 'Health & wellness', 'Welfare', 'Health profiles, vaccinations, screenings, clinic visits and incident referrals.'),
  route('/health/HEALTH-001', 'Health record', 'Welfare', 'Confidential student health detail, access notice and timeline.', 'detail'),
  route('/discipline', 'Discipline', 'Welfare', 'Incidents, categories, severity, actions, parent notification and follow-up.'),
  route('/wellbeing', 'Wellbeing & counseling', 'Welfare', 'Counseling plans, referrals, check-ins and safeguarding-style flags.'),
  route('/finance', 'Finance overview', 'Finance', 'AFN collection, outstanding balances, aging, scholarships, expenses, budgets and cashflow.'),
  route('/finance/fee-structures', 'Fee structures', 'Finance', 'Grade and term fees, discounts, transport/hostel add-ons and effective dates.'),
  route('/finance/invoices', 'Invoices & receipts', 'Finance', 'Invoice list, installment plans, print/share receipts and adjustments.'),
  route('/finance/payments', 'Payments desk', 'Finance', 'AFN receipt entry, payment methods, refunds and reconciliation.', 'workflow'),
  route('/finance/scholarships', 'Scholarships & waivers', 'Finance', 'Applications, approvals, budgets and expiry tracking.'),
  route('/finance/expenses', 'Expenses', 'Finance', 'Expense register, categories, approvals, receipts and vendors.'),
  route('/finance/budgets', 'Budgets', 'Finance', 'Department budgets with committed, spent, remaining and variance.'),
  route('/finance/payroll', 'Finance payroll', 'Finance', 'Salary structures, deductions, payslips and payroll run preview.'),
  route('/finance/reports', 'Financial reports', 'Finance', 'Collection, aging, income/expense, scholarship and payroll reports.', 'report'),
  route('/hr', 'HR dashboard', 'HR & payroll', 'Headcount, vacancies, leave, birthdays, contract renewals and staff alerts.'),
  route('/hr/recruitment', 'Recruitment', 'HR & payroll', 'Vacancies, applicants, interview stages, offers and onboarding checklist.'),
  route('/hr/contracts', 'Contracts', 'HR & payroll', 'Contract register, renewals, expiry alerts and document preview.'),
  route('/hr/payroll', 'Payroll runs', 'HR & payroll', 'Attendance inputs, allowances, deductions, approvals and payslips.', 'workflow'),
  route('/hr/reports', 'HR reports', 'HR & payroll', 'Headcount, turnover, attendance, leave, payroll and compliance reports.', 'report'),
  route('/library', 'Library', 'Operations', 'Book catalog, copies, members, issue/return, reservations, fines and acquisitions.'),
  route('/library/books/BK-003840', 'Book detail', 'Operations', 'Book copies, availability, circulation timeline and reservations.', 'detail'),
  route('/transport', 'Transport', 'Operations', 'Fleet dashboard, routes, stops, drivers, assignments, maintenance and fuel.'),
  route('/transport/routes/ROUTE-08', 'Route detail', 'Operations', 'Stops, passengers, driver, vehicle, schedule and transport attendance.', 'detail'),
  route('/hostel', 'Hostel & boarding', 'Operations', 'Buildings, rooms, beds, residents, wardens, meals, fees and discipline.'),
  route('/hostel/rooms/ROOM-12', 'Room detail', 'Operations', 'Occupancy, bed assignments, maintenance and resident timeline.', 'detail'),
  route('/inventory', 'Inventory & assets', 'Operations', 'Item catalog, stock movements, purchase orders, suppliers and assets.'),
  route('/inventory/purchase-orders/PO-1403-018', 'Purchase order', 'Operations', 'Order detail, approvals, receiving and vendor invoice.', 'detail'),
  route('/inventory/assets/AST-00612', 'Asset detail', 'Operations', 'Location, custodian, service history and depreciation placeholder.', 'detail'),
  route('/communications', 'Communications', 'Engagement', 'Inbox, compose, SMS, email, push notifications, templates and delivery logs.'),
  route('/communications/campaigns/CMP-018', 'Campaign detail', 'Engagement', 'Audience, content, schedule, delivery and acknowledgement metrics.', 'detail'),
  route('/announcements', 'Announcements', 'Engagement', 'Notice board, scheduled notices, emergency alerts and acknowledgements.', 'workflow'),
  route('/documents', 'Documents', 'Engagement', 'Template library, generated documents, verification, signatures and export.'),
  route('/documents/templates', 'Document templates', 'Engagement', 'Template editor workspace with merge-field reference and preview.', 'settings'),
  route('/documents/certificates', 'Certificates', 'Engagement', 'Batch certificate generation, student selection, numbering and approval.', 'workflow'),
  route('/reports', 'Report center', 'Analytics', 'Saved reports, scheduled exports, custom report builder and MoE-style reporting.', 'report'),
  route('/reports/attendance-summary', 'Attendance report', 'Analytics', 'Filtered report with charts, comparison table, print and export.', 'report'),
]

export const routeByPath = new Map(erpRoutes.map((item) => [item.path, item]))
export const findErpRoute = (path: string) => routeByPath.get(path) ?? route('/404', 'Workspace not found', 'System', 'This frontend route is not in the current ERP page inventory.', 'settings')

export const sampleRows = ['Ahmad Rahimi · EBPS-1403-G8-0045', 'Fatima Noori · EBPS-1403-G7-0018', 'Omid Safi · EBPS-1403-G10-0081', 'Maryam Waziri · EBPS-1403-G5-0022']

export const allErpPaths = erpRoutes.map((item) => item.path)

export const getRouteForLabel = (label: string) => erpRoutes.find((item) => item.label === label)
