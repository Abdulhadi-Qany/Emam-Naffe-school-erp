import {
  departments, grades, sections, classes, subjects, rooms, periods, terms, holidays, shifts, academicYears,
  studentAttendance, staffAttendance, staffLeave, staffContracts, recruitmentApplications,
  exams, examSchedules, examMarks, homework, homeworkSubmissions,
  books, bookIssues, bookReservations,
} from '@/lib/db/schema';
import type { ModuleRegistration } from '@/src/shared/crud/GenericModule';

/** Registry PART 1/3 — Academics, Attendance, HR, Exams, Library. */
export const MODULE_REGISTRATIONS_A: ModuleRegistration[] = [
  { kind: 'Department', table: departments as never, tableName: 'departments', permission: 'academics', route: 'departments' },
  { kind: 'AcademicYear', table: academicYears as never, tableName: 'academic_years', permission: 'academics', route: 'academic-years' },
  { kind: 'Term', table: terms as never, tableName: 'terms', permission: 'academics', route: 'terms' },
  { kind: 'Grade', table: grades as never, tableName: 'grades', permission: 'academics', route: 'grades' },
  { kind: 'Section', table: sections as never, tableName: 'sections', permission: 'academics', route: 'sections' },
  { kind: 'Class', table: classes as never, tableName: 'classes', permission: 'academics', route: 'classes' },
  { kind: 'Subject', table: subjects as never, tableName: 'subjects', permission: 'academics', route: 'subjects' },
  { kind: 'Room', table: rooms as never, tableName: 'rooms', permission: 'academics', route: 'rooms' },
  { kind: 'Period', table: periods as never, tableName: 'periods', permission: 'academics', route: 'periods' },
  { kind: 'Holiday', table: holidays as never, tableName: 'holidays', nameColumn: 'title', permission: 'academics', route: 'holidays' },
  { kind: 'Shift', table: shifts as never, tableName: 'shifts', permission: 'academics', route: 'shifts' },
  { kind: 'StudentAttendance', table: studentAttendance as never, tableName: 'student_attendance', nameColumn: 'status', permission: 'attendance', route: 'student-attendance' },
  { kind: 'StaffAttendance', table: staffAttendance as never, tableName: 'staff_attendance', nameColumn: 'status', permission: 'attendance', route: 'staff-attendance' },
  { kind: 'StaffLeave', table: staffLeave as never, tableName: 'staff_leave', nameColumn: 'status', permission: 'hr', route: 'leave' },
  { kind: 'StaffContract', table: staffContracts as never, tableName: 'staff_contracts', nameColumn: 'status', permission: 'hr', route: 'contracts' },
  { kind: 'RecruitmentApplication', table: recruitmentApplications as never, tableName: 'recruitment_applications', permission: 'hr', route: 'recruitment' },
  { kind: 'Exam', table: exams as never, tableName: 'exams', permission: 'exams', route: 'exams' },
  { kind: 'ExamSchedule', table: examSchedules as never, tableName: 'exam_schedules', nameColumn: 'status', permission: 'exams', route: 'exam-schedules' },
  { kind: 'ExamMark', table: examMarks as never, tableName: 'exam_marks', permission: 'exams', route: 'exam-marks' },
  { kind: 'Homework', table: homework as never, tableName: 'homework', nameColumn: 'title', permission: 'homework', route: 'homework' },
  { kind: 'HomeworkSubmission', table: homeworkSubmissions as never, tableName: 'homework_submissions', nameColumn: 'status', permission: 'homework', route: 'homework-submissions' },
  { kind: 'Book', table: books as never, tableName: 'books', nameColumn: 'title', permission: 'library', route: 'books' },
  { kind: 'BookIssue', table: bookIssues as never, tableName: 'book_issues', nameColumn: 'status', permission: 'library', route: 'book-issues' },
  { kind: 'BookReservation', table: bookReservations as never, tableName: 'book_reservations', nameColumn: 'status', permission: 'library', route: 'book-reservations' },
];
