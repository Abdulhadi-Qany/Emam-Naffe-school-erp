import {
  schools, schoolBranches, configSettings,
  libraryMembers, messMenus, moeReports, emisData,
  admissionCommunications, approvalRequests, portalInvitations,
  dataProcessingRecords, absenceRequests,
} from '@/lib/db/schema';
import type { ModuleRegistration } from '@/src/shared/crud/GenericModule';

/** Registry PART 4d — Schools, Library extras, Reports, Misc governance. */
export const MODULE_REGISTRATIONS_D4: ModuleRegistration[] = [
  { kind: 'School', table: schools as never, tableName: 'schools', permission: 'settings', route: 'schools' },
  { kind: 'SchoolBranch', table: schoolBranches as never, tableName: 'school_branches', permission: 'settings', route: 'school-branches' },
  { kind: 'ConfigSetting', table: configSettings as never, tableName: 'config_settings', nameColumn: 'key', permission: 'settings', route: 'config-settings' },
  { kind: 'LibraryMember', table: libraryMembers as never, tableName: 'library_members', nameColumn: 'status', permission: 'library', route: 'library-members' },
  { kind: 'MessMenu', table: messMenus as never, tableName: 'mess_menus', permission: 'facilities', route: 'mess-menus' },
  { kind: 'MoeReport', table: moeReports as never, tableName: 'moe_reports', nameColumn: 'title', permission: 'reports', route: 'moe-reports' },
  { kind: 'EmisData', table: emisData as never, tableName: 'emis_data', permission: 'reports', route: 'emis-data' },
  { kind: 'AdmissionCommunication', table: admissionCommunications as never, tableName: 'admission_communications', nameColumn: 'subject', permission: 'admissions', route: 'admission-communications' },
  { kind: 'ApprovalRequest', table: approvalRequests as never, tableName: 'approval_requests', nameColumn: 'entityType', permission: 'settings', route: 'approval-requests' },
  { kind: 'PortalInvitation', table: portalInvitations as never, tableName: 'portal_invitations', nameColumn: 'status', permission: 'users', route: 'portal-invitations' },
  { kind: 'DataProcessingRecord', table: dataProcessingRecords as never, tableName: 'data_processing_records', nameColumn: 'title', permission: 'settings', route: 'data-processing' },
  { kind: 'AbsenceRequest', table: absenceRequests as never, tableName: 'absence_requests', nameColumn: 'reason', permission: 'attendance', route: 'absence-requests' },
];
