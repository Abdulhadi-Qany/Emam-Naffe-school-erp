import {
  communityVolunteers, communityDonations,
  cafeteriaMenus, cafeteriaMealSubscriptions,
  compliancePolicies, complianceInspections, complianceActionPlans,
  securityIncidents, wellbeingReferrals, wellbeingCheckins,
  documentTemplates, documentInstances, fileUploads,
  integrations, systemBackups, savedReports, reportSchedules,
} from '@/lib/db/schema';
import type { ModuleRegistration } from '@/src/shared/crud/GenericModule';

/** Registry PART 3b — Community, Cafeteria, Governance, Documents, Reports. */
export const MODULE_REGISTRATIONS_C2: ModuleRegistration[] = [
  { kind: 'CommunityVolunteer', table: communityVolunteers as never, tableName: 'community_volunteers', permission: 'events', route: 'volunteers' },
  { kind: 'CommunityDonation', table: communityDonations as never, tableName: 'community_donations', permission: 'events', route: 'donations' },
  { kind: 'CafeteriaMenu', table: cafeteriaMenus as never, tableName: 'cafeteria_menus', permission: 'facilities', route: 'cafeteria-menus' },
  { kind: 'CafeteriaSubscription', table: cafeteriaMealSubscriptions as never, tableName: 'cafeteria_meal_subscriptions', nameColumn: 'status', permission: 'facilities', route: 'cafeteria-subscriptions' },
  { kind: 'CompliancePolicy', table: compliancePolicies as never, tableName: 'compliance_policies', nameColumn: 'title', permission: 'settings', route: 'compliance-policies' },
  { kind: 'ComplianceInspection', table: complianceInspections as never, tableName: 'compliance_inspections', nameColumn: 'status', permission: 'settings', route: 'compliance-inspections' },
  { kind: 'ComplianceActionPlan', table: complianceActionPlans as never, tableName: 'compliance_action_plans', nameColumn: 'title', permission: 'settings', route: 'compliance-action-plans' },
  { kind: 'SecurityIncident', table: securityIncidents as never, tableName: 'security_incidents', nameColumn: 'title', permission: 'settings', route: 'security-incidents' },
  { kind: 'WellbeingReferral', table: wellbeingReferrals as never, tableName: 'wellbeing_referrals', nameColumn: 'status', permission: 'settings', route: 'wellbeing-referrals' },
  { kind: 'WellbeingCheckin', table: wellbeingCheckins as never, tableName: 'wellbeing_checkins', permission: 'settings', route: 'wellbeing-checkins' },
  { kind: 'DocumentTemplate', table: documentTemplates as never, tableName: 'document_templates', permission: 'documents', route: 'document-templates' },
  { kind: 'DocumentInstance', table: documentInstances as never, tableName: 'document_instances', nameColumn: 'status', permission: 'documents', route: 'document-instances' },
  { kind: 'FileUpload', table: fileUploads as never, tableName: 'file_uploads', nameColumn: 'fileName', permission: 'documents', route: 'file-uploads' },
  { kind: 'Integration', table: integrations as never, tableName: 'integrations', permission: 'settings', route: 'integrations' },
  { kind: 'SystemBackup', table: systemBackups as never, tableName: 'system_backups', nameColumn: 'status', permission: 'settings', route: 'backups' },
  { kind: 'SavedReport', table: savedReports as never, tableName: 'saved_reports', permission: 'reports', route: 'saved-reports' },
  { kind: 'ReportSchedule', table: reportSchedules as never, tableName: 'report_schedules', permission: 'reports', route: 'report-schedules' },
];
