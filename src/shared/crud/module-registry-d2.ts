import {
  studentAchievements, studentDiscipline, studentTimeline, studentIdCards, studentTransport,
  staffAppraisals, staffCertifications, staffTrainings, staffQualifications,
  staffLeaveBalances, staffPayrollProfiles, staffDisciplinaryRecords, exitManagement,
  leaveTypes, leaveCalendars, interviews,
} from '@/lib/db/schema';
import type { ModuleRegistration } from '@/src/shared/crud/GenericModule';

/** Registry PART 4b — Student extras + Staff extras + Leave + Recruitment. */
export const MODULE_REGISTRATIONS_D2: ModuleRegistration[] = [
  { kind: 'StudentAchievement', table: studentAchievements as never, tableName: 'student_achievements', nameColumn: 'title', permission: 'students', route: 'student-achievements' },
  { kind: 'StudentDiscipline', table: studentDiscipline as never, tableName: 'student_discipline', nameColumn: 'status', permission: 'students', route: 'student-discipline' },
  { kind: 'StudentTimeline', table: studentTimeline as never, tableName: 'student_timeline', nameColumn: 'title', permission: 'students', route: 'student-timeline' },
  { kind: 'StudentIdCard', table: studentIdCards as never, tableName: 'student_id_cards', nameColumn: 'status', permission: 'students', route: 'student-id-cards' },
  { kind: 'StudentTransport', table: studentTransport as never, tableName: 'student_transport', nameColumn: 'status', permission: 'transport', route: 'student-transport' },
  { kind: 'StaffAppraisal', table: staffAppraisals as never, tableName: 'staff_appraisals', nameColumn: 'status', permission: 'hr', route: 'appraisals' },
  { kind: 'StaffCertification', table: staffCertifications as never, tableName: 'staff_certifications', permission: 'hr', route: 'certifications' },
  { kind: 'StaffTraining', table: staffTrainings as never, tableName: 'staff_trainings', nameColumn: 'title', permission: 'hr', route: 'trainings' },
  { kind: 'StaffQualification', table: staffQualifications as never, tableName: 'staff_qualifications', permission: 'hr', route: 'qualifications' },
  { kind: 'StaffLeaveBalance', table: staffLeaveBalances as never, tableName: 'staff_leave_balances', permission: 'hr', route: 'leave-balances' },
  { kind: 'StaffPayrollProfile', table: staffPayrollProfiles as never, tableName: 'staff_payroll_profiles', nameColumn: 'status', permission: 'hr', route: 'payroll-profiles' },
  { kind: 'StaffDisciplinaryRecord', table: staffDisciplinaryRecords as never, tableName: 'staff_disciplinary_records', nameColumn: 'status', permission: 'hr', route: 'disciplinary-records' },
  { kind: 'ExitRecord', table: exitManagement as never, tableName: 'exit_management', nameColumn: 'status', permission: 'hr', route: 'exit-records' },
  { kind: 'LeaveType', table: leaveTypes as never, tableName: 'leave_types', permission: 'hr', route: 'leave-types' },
  { kind: 'LeaveCalendar', table: leaveCalendars as never, tableName: 'leave_calendars', permission: 'hr', route: 'leave-calendars' },
  { kind: 'Interview', table: interviews as never, tableName: 'interviews', nameColumn: 'status', permission: 'hr', route: 'interviews' },
];
