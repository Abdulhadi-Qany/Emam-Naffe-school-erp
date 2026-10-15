import {
  timetableEntries, substitutions, subjectGroups, lessonPlans,
  curriculumOutcomes, assessmentRubrics, examQuestions, examResults, reportCards,
} from '@/lib/db/schema';
import type { ModuleRegistration } from '@/src/shared/crud/GenericModule';

/** Registry PART 4a — Timetable, Curriculum, Assessment, Results. */
export const MODULE_REGISTRATIONS_D1: ModuleRegistration[] = [
  { kind: 'TimetableEntry', table: timetableEntries as never, tableName: 'timetable_entries', nameColumn: 'dayOfWeek', permission: 'academics', route: 'timetable-entries' },
  { kind: 'Substitution', table: substitutions as never, tableName: 'substitutions', nameColumn: 'status', permission: 'academics', route: 'substitutions' },
  { kind: 'SubjectGroup', table: subjectGroups as never, tableName: 'subject_groups', permission: 'academics', route: 'subject-groups' },
  { kind: 'LessonPlan', table: lessonPlans as never, tableName: 'lesson_plans', nameColumn: 'title', permission: 'academics', route: 'lesson-plans' },
  { kind: 'CurriculumOutcome', table: curriculumOutcomes as never, tableName: 'curriculum_outcomes', nameColumn: 'title', permission: 'academics', route: 'curriculum-outcomes' },
  { kind: 'AssessmentRubric', table: assessmentRubrics as never, tableName: 'assessment_rubrics', nameColumn: 'title', permission: 'exams', route: 'assessment-rubrics' },
  { kind: 'ExamQuestion', table: examQuestions as never, tableName: 'exam_questions', permission: 'exams', route: 'exam-questions' },
  { kind: 'ExamResult', table: examResults as never, tableName: 'exam_results', nameColumn: 'result', permission: 'exams', route: 'exam-results' },
  { kind: 'ReportCard', table: reportCards as never, tableName: 'report_cards', nameColumn: 'status', permission: 'exams', route: 'report-cards' },
];
