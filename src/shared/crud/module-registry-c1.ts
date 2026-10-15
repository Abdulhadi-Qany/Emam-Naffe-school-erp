import {
  communications, communicationTemplates, communicationCampaigns, announcements, events,
  surveys, surveyResponses, grievances,
  admissionApplications, admissionOffers, admissionWaitlists, entranceAssessments, admissionDocuments,
  facilityWorkOrders, facilityBookings, utilityBills,
} from '@/lib/db/schema';
import type { ModuleRegistration } from '@/src/shared/crud/GenericModule';

/** Registry PART 3a — Engagement, Admissions, Facilities. */
export const MODULE_REGISTRATIONS_C1: ModuleRegistration[] = [
  { kind: 'Communication', table: communications as never, tableName: 'communications', nameColumn: 'subject', permission: 'communications', route: 'communications' },
  { kind: 'CommunicationTemplate', table: communicationTemplates as never, tableName: 'communication_templates', permission: 'communications', route: 'communication-templates' },
  { kind: 'CommunicationCampaign', table: communicationCampaigns as never, tableName: 'communication_campaigns', permission: 'communications', route: 'communication-campaigns' },
  { kind: 'Announcement', table: announcements as never, tableName: 'announcements', nameColumn: 'title', permission: 'announcements', route: 'announcements' },
  { kind: 'Event', table: events as never, tableName: 'events', nameColumn: 'title', permission: 'events', route: 'events' },
  { kind: 'Survey', table: surveys as never, tableName: 'surveys', nameColumn: 'title', permission: 'communications', route: 'surveys' },
  { kind: 'SurveyResponse', table: surveyResponses as never, tableName: 'survey_responses', permission: 'communications', route: 'survey-responses' },
  { kind: 'Grievance', table: grievances as never, tableName: 'grievances', nameColumn: 'subject', permission: 'communications', route: 'grievances' },
  { kind: 'AdmissionApplication', table: admissionApplications as never, tableName: 'admission_applications', nameColumn: 'status', permission: 'admissions', route: 'applications' },
  { kind: 'AdmissionOffer', table: admissionOffers as never, tableName: 'admission_offers', nameColumn: 'status', permission: 'admissions', route: 'offers' },
  { kind: 'AdmissionWaitlist', table: admissionWaitlists as never, tableName: 'admission_waitlists', nameColumn: 'status', permission: 'admissions', route: 'waitlist' },
  { kind: 'EntranceAssessment', table: entranceAssessments as never, tableName: 'entrance_assessments', nameColumn: 'status', permission: 'admissions', route: 'assessments' },
  { kind: 'AdmissionDocument', table: admissionDocuments as never, tableName: 'admission_documents', nameColumn: 'status', permission: 'admissions', route: 'documents' },
  { kind: 'FacilityWorkOrder', table: facilityWorkOrders as never, tableName: 'facility_work_orders', nameColumn: 'title', permission: 'facilities', route: 'work-orders' },
  { kind: 'FacilityBooking', table: facilityBookings as never, tableName: 'facility_bookings', nameColumn: 'status', permission: 'facilities', route: 'bookings' },
  { kind: 'UtilityBill', table: utilityBills as never, tableName: 'utility_bills', nameColumn: 'status', permission: 'facilities', route: 'utility-bills' },
];
