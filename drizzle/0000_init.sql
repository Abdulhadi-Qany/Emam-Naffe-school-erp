CREATE TYPE "public"."asset_status" AS ENUM('active', 'maintenance', 'retired', 'disposed');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late', 'excused', 'holiday');--> statement-breakpoint
CREATE TYPE "public"."book_status" AS ENUM('available', 'issued', 'reserved', 'lost', 'damaged');--> statement-breakpoint
CREATE TYPE "public"."cafeteria_meal_type" AS ENUM('breakfast', 'lunch', 'snack');--> statement-breakpoint
CREATE TYPE "public"."compliance_record_status" AS ENUM('draft', 'active', 'under_review', 'superseded', 'archived');--> statement-breakpoint
CREATE TYPE "public"."day_of_week" AS ENUM('saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday');--> statement-breakpoint
CREATE TYPE "public"."discipline_severity" AS ENUM('minor', 'moderate', 'major');--> statement-breakpoint
CREATE TYPE "public"."discipline_status" AS ENUM('open', 'under_review', 'resolved', 'escalated');--> statement-breakpoint
CREATE TYPE "public"."document_instance_status" AS ENUM('draft', 'generated', 'printed', 'signed', 'void');--> statement-breakpoint
CREATE TYPE "public"."donation_status" AS ENUM('pledged', 'received', 'refunded', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('full_time', 'part_time', 'contract', 'temporary');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('academic', 'holiday', 'meeting', 'sports', 'cultural');--> statement-breakpoint
CREATE TYPE "public"."exam_status" AS ENUM('scheduled', 'ongoing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."facility_work_order_status" AS ENUM('open', 'assigned', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."fee_status" AS ENUM('pending', 'partial', 'paid', 'overdue', 'waived');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."holiday_type" AS ENUM('national', 'religious', 'school', 'exam');--> statement-breakpoint
CREATE TYPE "public"."incident_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."incident_status" AS ENUM('reported', 'investigating', 'resolved', 'escalated', 'closed');--> statement-breakpoint
CREATE TYPE "public"."inspection_status" AS ENUM('scheduled', 'in_progress', 'completed', 'findings_open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('active', 'inactive', 'error');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."leave_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notice_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('info', 'warning', 'error', 'success');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('draft', 'submitted', 'approved', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'bank_transfer', 'cheque', 'card', 'mobile_payment');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payroll_status" AS ENUM('draft', 'approved', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payslip_status" AS ENUM('pending', 'paid', 'void');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."procurement_request_status" AS ENUM('draft', 'submitted', 'budget_checked', 'approved', 'rejected', 'converted');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('active', 'fulfilled', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."shift_type" AS ENUM('morning', 'afternoon', 'evening');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'inactive', 'suspended', 'deleted', 'graduated', 'transferred', 'dropped_out');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_type" AS ENUM('purchase', 'sale', 'adjustment', 'transfer', 'return');--> statement-breakpoint
CREATE TYPE "public"."survey_type" AS ENUM('feedback', 'poll', 'assessment');--> statement-breakpoint
CREATE TYPE "public"."term_type" AS ENUM('semester', 'trimester', 'quarter');--> statement-breakpoint
CREATE TYPE "public"."timetable_day" AS ENUM('saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('staff', 'student', 'parent');--> statement-breakpoint
CREATE TYPE "public"."volunteer_status" AS ENUM('applied', 'screened', 'active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."wellbeing_referral_status" AS ENUM('open', 'in_support', 'monitoring', 'closed');--> statement-breakpoint
CREATE TABLE "academic_years" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"solar_hijri_year" integer NOT NULL,
	"solar_hijri_start_date" timestamp with time zone NOT NULL,
	"solar_hijri_end_date" timestamp with time zone NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admission_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"application_number" text NOT NULL,
	"first_name" text NOT NULL,
	"father_name" text NOT NULL,
	"grandfather_name" text,
	"family_name" text NOT NULL,
	"date_of_birth" timestamp with time zone NOT NULL,
	"gender" "gender" NOT NULL,
	"applying_for_grade_id" text,
	"previous_school" text,
	"documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admission_applications_application_number_unique" UNIQUE("application_number")
);
--> statement-breakpoint
CREATE TABLE "admission_number_sequences" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"prefix" text NOT NULL,
	"current_number" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"title" text NOT NULL,
	"title_dari" text,
	"title_pashto" text,
	"description" text NOT NULL,
	"description_dari" text,
	"description_pashto" text,
	"category" text DEFAULT 'general' NOT NULL,
	"priority" "notice_priority" DEFAULT 'medium' NOT NULL,
	"target_audience" jsonb DEFAULT '["all"]'::jsonb NOT NULL,
	"target_grades" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target_classes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"attachment" text,
	"publish_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expiry_date" timestamp with time zone,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"asset_code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"description" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric DEFAULT '0' NOT NULL,
	"total_value" numeric DEFAULT '0' NOT NULL,
	"location" text,
	"room_id" text,
	"assigned_to" text,
	"purchase_date" timestamp with time zone DEFAULT now() NOT NULL,
	"warranty_expiry" timestamp with time zone,
	"condition" text DEFAULT 'new' NOT NULL,
	"status" "asset_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_asset_code_unique" UNIQUE("asset_code")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text,
	"user_id" text,
	"action" text NOT NULL,
	"module" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"changes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "book_issues" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"issue_number" text NOT NULL,
	"book_id" text NOT NULL,
	"member_id" text NOT NULL,
	"issue_date" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"return_date" timestamp with time zone,
	"condition_at_issue" text DEFAULT 'good' NOT NULL,
	"condition_at_return" text,
	"fine_amount" numeric DEFAULT '0' NOT NULL,
	"fine_paid" boolean DEFAULT false NOT NULL,
	"issued_by" text,
	"returned_by" text,
	"status" text DEFAULT 'issued' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "book_issues_issue_number_unique" UNIQUE("issue_number")
);
--> statement-breakpoint
CREATE TABLE "book_reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"book_id" text NOT NULL,
	"member_id" text NOT NULL,
	"reserved_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"fulfilled_at" timestamp with time zone,
	"status" "reservation_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "book_reservations_book_id_member_id_unique" UNIQUE("book_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"book_id" text NOT NULL,
	"isbn" text,
	"title" text NOT NULL,
	"title_dari" text,
	"title_pashto" text,
	"author" text,
	"translator" text,
	"publisher" text,
	"publication_year" integer,
	"edition" text,
	"language" text DEFAULT 'Dari' NOT NULL,
	"category" text,
	"subcategory" text,
	"grade_level" text,
	"book_type" text DEFAULT 'textbook' NOT NULL,
	"dewey_decimal" text,
	"total_copies" integer DEFAULT 1 NOT NULL,
	"available_copies" integer DEFAULT 1 NOT NULL,
	"shelf_location" text,
	"rack_number" text,
	"condition" text DEFAULT 'new' NOT NULL,
	"price" numeric DEFAULT '0' NOT NULL,
	"acquisition_date" timestamp with time zone DEFAULT now() NOT NULL,
	"acquisition_source" text DEFAULT 'purchase' NOT NULL,
	"cover_image" text,
	"description" text,
	"keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "book_status" DEFAULT 'available' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "books_book_id_unique" UNIQUE("book_id")
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"academic_year_id" text,
	"allocated_amount" numeric DEFAULT '0' NOT NULL,
	"spent_amount" numeric DEFAULT '0' NOT NULL,
	"remaining_amount" numeric DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "budgets_school_id_category_academic_year_id_unique" UNIQUE("school_id","category","academic_year_id")
);
--> statement-breakpoint
CREATE TABLE "cafeteria_meal_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text NOT NULL,
	"plan" text DEFAULT 'weekly' NOT NULL,
	"meals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allergies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"monthly_fee" numeric DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cafeteria_menus" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"meal_type" "cafeteria_meal_type" NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"calories" integer,
	"allergen_note" text,
	"status" text DEFAULT 'planned' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cafeteria_menus_school_date_meal_unique" UNIQUE("school_id","date","meal_type")
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"grade_id" text NOT NULL,
	"section_id" text NOT NULL,
	"name" text NOT NULL,
	"capacity" integer,
	"room_id" text,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_donations" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"receipt_number" text NOT NULL,
	"donor_name" text NOT NULL,
	"donor_type" text DEFAULT 'individual' NOT NULL,
	"amount" numeric DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'AFN' NOT NULL,
	"purpose" text,
	"restriction" text,
	"status" "donation_status" DEFAULT 'pledged' NOT NULL,
	"received_date" timestamp with time zone,
	"recorded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_donations_receipt_number_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
CREATE TABLE "community_volunteers" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"role" text,
	"screening_status" "volunteer_status" DEFAULT 'applied' NOT NULL,
	"assignments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"hours_total" numeric DEFAULT '0' NOT NULL,
	"joined_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_action_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"inspection_id" text,
	"finding" text NOT NULL,
	"action" text NOT NULL,
	"owner" text,
	"due_date" timestamp with time zone,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"closed_at" timestamp with time zone,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_inspections" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"title" text NOT NULL,
	"scheduled_at" timestamp with time zone,
	"conducted_at" timestamp with time zone,
	"checklist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"findings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "inspection_status" DEFAULT 'scheduled' NOT NULL,
	"inspector" text,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_policies" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"owner" text,
	"content" text,
	"version" text DEFAULT '1.0' NOT NULL,
	"effective_date" timestamp with time zone,
	"review_date" timestamp with time zone,
	"status" "compliance_record_status" DEFAULT 'active' NOT NULL,
	"approved_by" text,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_policies_school_title_unique" UNIQUE("school_id","title")
);
--> statement-breakpoint
CREATE TABLE "config_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"key" text NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "config_settings_school_id_key_unique" UNIQUE("school_id","key")
);
--> statement-breakpoint
CREATE TABLE "data_processing_records" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text,
	"purpose" text NOT NULL,
	"lawful_basis" text,
	"retention_until" timestamp with time zone,
	"request_type" text,
	"requested_at" timestamp with time zone,
	"status" text DEFAULT 'open' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"name_dari" text,
	"name_pashto" text,
	"description" text,
	"head_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discounts" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text,
	"name" text NOT NULL,
	"discount_type" text DEFAULT 'percentage' NOT NULL,
	"discount_value" numeric DEFAULT '0' NOT NULL,
	"applicable_fee_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"end_date" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"approved_by" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_instances" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"template_id" text,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"serial_number" text,
	"title" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "document_instance_status" DEFAULT 'draft' NOT NULL,
	"signed_by" text,
	"verified_by" text,
	"file_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_instances_school_serial_unique" UNIQUE("school_id","serial_number")
);
--> statement-breakpoint
CREATE TABLE "document_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'notice' NOT NULL,
	"merge_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"versions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"current_version" text DEFAULT '1.0' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_templates_school_name_unique" UNIQUE("school_id","name")
);
--> statement-breakpoint
CREATE TABLE "email_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"recipient_type" text NOT NULL,
	"recipient_id" text,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"template_id" text,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"bounce_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emis_data" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"academic_year_id" text,
	"data_type" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"record_count" integer DEFAULT 0 NOT NULL,
	"export_format" text DEFAULT 'csv' NOT NULL,
	"exported_by" text,
	"exported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp_records" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"module" text NOT NULL,
	"title" text NOT NULL,
	"reference" text NOT NULL,
	"status" text DEFAULT 'Active' NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"title" text NOT NULL,
	"title_dari" text,
	"title_pashto" text,
	"description" text,
	"event_type" "event_type" DEFAULT 'academic' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"venue" text,
	"organizer" text,
	"target_audience" jsonb DEFAULT '["all"]'::jsonb NOT NULL,
	"budget" numeric DEFAULT '0' NOT NULL,
	"actual_cost" numeric DEFAULT '0' NOT NULL,
	"chief_guest" text,
	"invitation_url" text,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"status" text DEFAULT 'planned' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_marks" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_schedule_id" text NOT NULL,
	"student_id" text NOT NULL,
	"theory_marks" numeric,
	"practical_marks" numeric,
	"internal_assessment" numeric,
	"total_marks" numeric,
	"grade" text,
	"remarks" text,
	"status" text DEFAULT 'present' NOT NULL,
	"entered_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exam_marks_exam_schedule_id_student_id_unique" UNIQUE("exam_schedule_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "exam_results" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"student_id" text NOT NULL,
	"class_id" text,
	"total_marks" numeric DEFAULT '0' NOT NULL,
	"max_marks" numeric DEFAULT '0' NOT NULL,
	"percentage" numeric DEFAULT '0' NOT NULL,
	"grade" text,
	"result" text DEFAULT 'pending' NOT NULL,
	"rank" integer,
	"class_rank" integer,
	"section_rank" integer,
	"remarks" text,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exam_results_exam_id_student_id_unique" UNIQUE("exam_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "exam_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"class_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"duration" integer NOT NULL,
	"room_id" text,
	"max_marks" numeric DEFAULT '100' NOT NULL,
	"pass_marks" numeric DEFAULT '40' NOT NULL,
	"invigilators" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"exam_type" text NOT NULL,
	"academic_year_id" text,
	"term_id" text,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"total_marks" numeric DEFAULT '100' NOT NULL,
	"pass_marks" numeric DEFAULT '40' NOT NULL,
	"status" "exam_status" DEFAULT 'scheduled' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exit_management" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"exit_type" text NOT NULL,
	"last_working_date" timestamp with time zone NOT NULL,
	"reason" text NOT NULL,
	"clearance_status" text DEFAULT 'pending' NOT NULL,
	"exit_interview" text,
	"processed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"expense_number" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"description" text,
	"amount" numeric DEFAULT '0' NOT NULL,
	"payment_method" "payment_method" DEFAULT 'cash' NOT NULL,
	"vendor" text,
	"invoice_number" text,
	"expense_date" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_by" text,
	"entered_by" text,
	"status" text DEFAULT 'approved' NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_expense_number_unique" UNIQUE("expense_number")
);
--> statement-breakpoint
CREATE TABLE "facility_bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"room_id" text NOT NULL,
	"title" text NOT NULL,
	"booked_by" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurrence_rule" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facility_work_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"reference" text NOT NULL,
	"room_id" text,
	"asset_id" text,
	"title" text NOT NULL,
	"description" text,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"status" "facility_work_order_status" DEFAULT 'open' NOT NULL,
	"requested_by" text,
	"assigned_to" text,
	"cost" numeric DEFAULT '0' NOT NULL,
	"scheduled_for" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"evidence" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "facility_work_orders_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "fee_structures" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"fee_type" text NOT NULL,
	"amount" numeric DEFAULT '0' NOT NULL,
	"frequency" text DEFAULT 'monthly' NOT NULL,
	"grade_id" text,
	"section_id" text,
	"due_date" integer DEFAULT 10 NOT NULL,
	"late_fee_amount" numeric DEFAULT '0' NOT NULL,
	"late_fee_type" text DEFAULT 'fixed' NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"level" integer NOT NULL,
	"description" text,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grievances" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"grievance_number" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"complainant_name" text,
	"complainant_type" text DEFAULT 'parent' NOT NULL,
	"complainant_id" text,
	"contact_info" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"assigned_to" text,
	"resolution" text,
	"feedback" text,
	"resolved_at" timestamp with time zone,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grievances_grievance_number_unique" UNIQUE("grievance_number")
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"name_dari" text,
	"name_pashto" text,
	"holiday_type" "holiday_type" NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "homework" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"class_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp with time zone NOT NULL,
	"assigned_date" timestamp with time zone DEFAULT now() NOT NULL,
	"max_marks" numeric DEFAULT '0' NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"type" text DEFAULT 'homework' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "homework_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"homework_id" text NOT NULL,
	"student_id" text NOT NULL,
	"submission_date" timestamp with time zone DEFAULT now() NOT NULL,
	"content" text,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"marks" numeric,
	"feedback" text,
	"graded_by" text,
	"graded_at" timestamp with time zone,
	"status" text DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "homework_submissions_homework_id_student_id_unique" UNIQUE("homework_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "hostel_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text NOT NULL,
	"room_id" text NOT NULL,
	"bed_number" text,
	"allocation_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expected_vacate_date" timestamp with time zone,
	"actual_vacate_date" timestamp with time zone,
	"hostel_fee" numeric DEFAULT '0' NOT NULL,
	"mess_fee" numeric DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hostel_allocations_student_id_room_id_unique" UNIQUE("student_id","room_id")
);
--> statement-breakpoint
CREATE TABLE "hostel_attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"morning_attendance" text DEFAULT 'present' NOT NULL,
	"evening_attendance" text DEFAULT 'present' NOT NULL,
	"night_attendance" text DEFAULT 'present' NOT NULL,
	"leave_type" text,
	"outpass_number" text,
	"out_time" text,
	"in_time" text,
	"remarks" text,
	"recorded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hostel_attendance_student_id_date_unique" UNIQUE("student_id","date")
);
--> statement-breakpoint
CREATE TABLE "hostel_discipline" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text NOT NULL,
	"incident_date" timestamp with time zone DEFAULT now() NOT NULL,
	"incident_type" text NOT NULL,
	"description" text NOT NULL,
	"severity" "discipline_severity" DEFAULT 'minor' NOT NULL,
	"action_taken" text,
	"reported_by" text,
	"parent_notified" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"follow_up" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hostel_rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"hostel_id" text NOT NULL,
	"room_number" text NOT NULL,
	"room_type" text DEFAULT 'dormitory' NOT NULL,
	"capacity" integer DEFAULT 4 NOT NULL,
	"occupied_beds" integer DEFAULT 0 NOT NULL,
	"facilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"floor" text,
	"wing" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hostel_rooms_hostel_id_room_number_unique" UNIQUE("hostel_id","room_number")
);
--> statement-breakpoint
CREATE TABLE "hostels" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"hostel_type" text NOT NULL,
	"total_rooms" integer DEFAULT 0 NOT NULL,
	"total_beds" integer DEFAULT 0 NOT NULL,
	"warden_id" text,
	"timings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"visitor_policy" text,
	"mess_info" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"api_key" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp with time zone,
	"status" "integration_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"interviewer_id" text NOT NULL,
	"interview_date" timestamp with time zone NOT NULL,
	"location" text,
	"type" text NOT NULL,
	"feedback" text,
	"rating" numeric,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"fee_structure_id" text,
	"description" text NOT NULL,
	"quantity" numeric DEFAULT '1' NOT NULL,
	"unit_price" numeric DEFAULT '0' NOT NULL,
	"discount" numeric DEFAULT '0' NOT NULL,
	"tax" numeric DEFAULT '0' NOT NULL,
	"amount" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"invoice_number" text NOT NULL,
	"student_id" text NOT NULL,
	"fee_structure_id" text,
	"issue_date" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"subtotal" numeric DEFAULT '0' NOT NULL,
	"discount" numeric DEFAULT '0' NOT NULL,
	"tax" numeric DEFAULT '0' NOT NULL,
	"total_amount" numeric DEFAULT '0' NOT NULL,
	"paid_amount" numeric DEFAULT '0' NOT NULL,
	"balance_amount" numeric DEFAULT '0' NOT NULL,
	"status" "fee_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"generated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"name_dari" text,
	"name_pashto" text,
	"description" text,
	"annual_quota" integer DEFAULT 0 NOT NULL,
	"is_paid" boolean DEFAULT true NOT NULL,
	"requires_document" boolean DEFAULT false NOT NULL,
	"min_days" integer DEFAULT 1 NOT NULL,
	"max_days" integer DEFAULT 30 NOT NULL,
	"is_carry_forward" boolean DEFAULT false NOT NULL,
	"max_carry_forward" integer DEFAULT 0 NOT NULL,
	"is_encashable" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"class_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"period_id" text,
	"topic" text NOT NULL,
	"learning_objectives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prior_knowledge" text,
	"teaching_materials" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"methodology" text,
	"activities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"assessment" text,
	"homework" text,
	"reflection" text,
	"principal_remarks" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"approved_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_members" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"member_id" text NOT NULL,
	"user_id" text,
	"student_id" text,
	"staff_id" text,
	"member_type" text DEFAULT 'student' NOT NULL,
	"max_books" integer DEFAULT 3 NOT NULL,
	"loan_period" integer DEFAULT 14 NOT NULL,
	"renewal_limit" integer DEFAULT 2 NOT NULL,
	"fine_per_day" numeric DEFAULT '5' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"joined_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_members_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
CREATE TABLE "login_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ip_address" text NOT NULL,
	"user_agent" text NOT NULL,
	"location" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"success" boolean DEFAULT true NOT NULL,
	"failure_reason" text,
	"logged_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mess_menus" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"hostel_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"meal_type" text NOT NULL,
	"menu" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"special_meal" text,
	"prepared_by" text,
	"feedback" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mess_menus_hostel_id_date_meal_type_unique" UNIQUE("hostel_id","date","meal_type")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"recipient_id" text NOT NULL,
	"group_id" text,
	"message" text NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"parent_message_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moe_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"report_type" text NOT NULL,
	"report_name" text NOT NULL,
	"period" text NOT NULL,
	"submission_date" timestamp with time zone DEFAULT now() NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"format" text DEFAULT 'json' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"submitted_by" text,
	"submitted_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"user_id" text NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"sms_enabled" boolean DEFAULT false NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"quiet_hours" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"digest_cadence" text DEFAULT 'daily' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_school_user_unique" UNIQUE("school_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"notification_type" "notification_type" DEFAULT 'info' NOT NULL,
	"module" text,
	"entity_type" text,
	"entity_id" text,
	"action_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "number_sequences" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"key" text NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "number_sequences_school_key_unique" UNIQUE("school_id","key")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"receipt_number" text NOT NULL,
	"student_id" text NOT NULL,
	"invoice_id" text,
	"amount" numeric DEFAULT '0' NOT NULL,
	"payment_method" "payment_method" DEFAULT 'cash' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'completed' NOT NULL,
	"transaction_id" text,
	"reference_number" text,
	"bank_name" text,
	"cheque_number" text,
	"mobile_provider" text,
	"payment_date" timestamp with time zone DEFAULT now() NOT NULL,
	"received_by" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_receipt_number_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"period_label" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"status" "payroll_status" DEFAULT 'draft' NOT NULL,
	"employee_count" integer DEFAULT 0 NOT NULL,
	"total_gross" numeric DEFAULT '0' NOT NULL,
	"total_deductions" numeric DEFAULT '0' NOT NULL,
	"total_net" numeric DEFAULT '0' NOT NULL,
	"notes" text,
	"generated_by" text,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"paid_by" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payroll_runs_school_id_period_label_unique" UNIQUE("school_id","period_label")
);
--> statement-breakpoint
CREATE TABLE "payslips" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"payroll_run_id" text NOT NULL,
	"staff_id" text NOT NULL,
	"slip_number" text NOT NULL,
	"basic_salary" numeric DEFAULT '0' NOT NULL,
	"house_allowance" numeric DEFAULT '0' NOT NULL,
	"transport_allowance" numeric DEFAULT '0' NOT NULL,
	"food_allowance" numeric DEFAULT '0' NOT NULL,
	"position_allowance" numeric DEFAULT '0' NOT NULL,
	"performance_bonus" numeric DEFAULT '0' NOT NULL,
	"overtime_pay" numeric DEFAULT '0' NOT NULL,
	"gross_salary" numeric DEFAULT '0' NOT NULL,
	"tax_deduction" numeric DEFAULT '0' NOT NULL,
	"loan_repayment" numeric DEFAULT '0' NOT NULL,
	"absence_deduction" numeric DEFAULT '0' NOT NULL,
	"other_deductions" numeric DEFAULT '0' NOT NULL,
	"total_deductions" numeric DEFAULT '0' NOT NULL,
	"net_salary" numeric DEFAULT '0' NOT NULL,
	"payment_method" "payment_method" DEFAULT 'bank_transfer' NOT NULL,
	"status" "payslip_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"remarks" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payslips_slip_number_unique" UNIQUE("slip_number"),
	CONSTRAINT "payslips_payroll_run_id_staff_id_unique" UNIQUE("payroll_run_id","staff_id")
);
--> statement-breakpoint
CREATE TABLE "periods" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"period_number" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"duration" integer NOT NULL,
	"is_break" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"module" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"email" text NOT NULL,
	"guardian_id" text,
	"role" text DEFAULT 'guardian' NOT NULL,
	"token_hash" text NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"invited_by" text,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portal_invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "procurement_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"reference" text NOT NULL,
	"department_id" text,
	"title" text NOT NULL,
	"description" text,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"estimated_cost" numeric DEFAULT '0' NOT NULL,
	"budget_year_id" text,
	"status" "procurement_request_status" DEFAULT 'draft' NOT NULL,
	"requested_by" text,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"purchase_order_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "procurement_requests_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "procurement_vendors" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"contact_name" text,
	"phone" text,
	"email" text,
	"address" text,
	"tax_id" text,
	"payment_terms" text,
	"rating" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "procurement_vendors_school_name_unique" UNIQUE("school_id","name")
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"purchase_order_id" text NOT NULL,
	"asset_id" text,
	"description" text NOT NULL,
	"quantity" numeric DEFAULT '1' NOT NULL,
	"unit_price" numeric DEFAULT '0' NOT NULL,
	"received_quantity" numeric DEFAULT '0' NOT NULL,
	"amount" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"order_number" text NOT NULL,
	"vendor_id" text,
	"request_id" text,
	"order_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expected_date" timestamp with time zone,
	"received_date" timestamp with time zone,
	"total_amount" numeric DEFAULT '0' NOT NULL,
	"status" "order_status" DEFAULT 'draft' NOT NULL,
	"approved_by" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "recruitment_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"position" text NOT NULL,
	"department_id" text,
	"applicant_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"resume_url" text,
	"status" text DEFAULT 'received' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text NOT NULL,
	"class_id" text,
	"exam_id" text,
	"term_id" text,
	"academic_year_id" text,
	"total_marks" numeric DEFAULT '0' NOT NULL,
	"max_marks" numeric DEFAULT '0' NOT NULL,
	"percentage" numeric DEFAULT '0' NOT NULL,
	"grade" text,
	"result" text DEFAULT 'pending' NOT NULL,
	"rank" integer,
	"attendance_present" integer DEFAULT 0 NOT NULL,
	"attendance_total" integer DEFAULT 0 NOT NULL,
	"attendance_percentage" numeric DEFAULT '0' NOT NULL,
	"teacher_remarks" text,
	"principal_remarks" text,
	"promoted_to" text,
	"generated_by" text,
	"generated_at" timestamp with time zone,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_cards_student_id_exam_id_unique" UNIQUE("student_id","exam_id")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_unique" UNIQUE("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"room_type" text NOT NULL,
	"capacity" integer,
	"building" text,
	"floor" text,
	"facilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_structures" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"staff_id" text NOT NULL,
	"basic_salary" numeric DEFAULT '0' NOT NULL,
	"house_allowance" numeric DEFAULT '0' NOT NULL,
	"transport_allowance" numeric DEFAULT '0' NOT NULL,
	"food_allowance" numeric DEFAULT '0' NOT NULL,
	"position_allowance" numeric DEFAULT '0' NOT NULL,
	"performance_bonus" numeric DEFAULT '0' NOT NULL,
	"overtime_rate" numeric DEFAULT '0' NOT NULL,
	"tax_deduction" numeric DEFAULT '0' NOT NULL,
	"loan_deduction" numeric DEFAULT '0' NOT NULL,
	"other_deductions" numeric DEFAULT '0' NOT NULL,
	"bank_name" text,
	"bank_branch" text,
	"account_number" text,
	"account_holder" text,
	"payment_method" "payment_method" DEFAULT 'bank_transfer' NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "salary_structures_staff_id_unique" UNIQUE("staff_id")
);
--> statement-breakpoint
CREATE TABLE "school_branches" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"address" text,
	"city" text,
	"province" text,
	"phone" text,
	"email" text,
	"principal_id" text,
	"is_main_branch" boolean DEFAULT false NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_dari" text,
	"name_pashto" text,
	"email" text,
	"phone" text,
	"address" text,
	"city" text,
	"province" text,
	"country" text DEFAULT 'Afghanistan' NOT NULL,
	"logo" text,
	"favicon" text,
	"timezone" text DEFAULT 'Asia/Kabul' NOT NULL,
	"currency" text DEFAULT 'AFN' NOT NULL,
	"academic_year_start_month" integer DEFAULT 3 NOT NULL,
	"website" text,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"grade_id" text NOT NULL,
	"name" text NOT NULL,
	"capacity" integer,
	"class_teacher_id" text,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_incidents" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"reference" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"incident_at" timestamp with time zone DEFAULT now() NOT NULL,
	"location" text,
	"severity" "incident_severity" DEFAULT 'medium' NOT NULL,
	"status" "incident_status" DEFAULT 'reported' NOT NULL,
	"involved" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"action_taken" text,
	"parent_notified" boolean DEFAULT false NOT NULL,
	"reported_by" text,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "security_incidents_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"userId" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"shift_type" "shift_type" NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"applicable_grades" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sms_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"recipient_type" text NOT NULL,
	"recipient_id" text,
	"phone_number" text NOT NULL,
	"message" text NOT NULL,
	"template_id" text,
	"sender_id" text,
	"provider" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"delivery_report" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cost" numeric DEFAULT '0' NOT NULL,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"user_id" text,
	"staff_id" text NOT NULL,
	"employee_code" text NOT NULL,
	"first_name" text NOT NULL,
	"father_name" text NOT NULL,
	"grandfather_name" text,
	"family_name" text NOT NULL,
	"full_name" text NOT NULL,
	"date_of_birth" timestamp with time zone,
	"gender" "gender" NOT NULL,
	"blood_group" text,
	"nationality" text DEFAULT 'Afghan' NOT NULL,
	"national_id" text,
	"photo" text,
	"phone" text,
	"email" text,
	"address" text,
	"city" text,
	"province" text,
	"department_id" text,
	"designation" text,
	"employment_type" "employment_type" DEFAULT 'full_time' NOT NULL,
	"join_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "staff_staff_id_unique" UNIQUE("staff_id"),
	CONSTRAINT "staff_employee_code_unique" UNIQUE("employee_code")
);
--> statement-breakpoint
CREATE TABLE "staff_appraisals" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"appraiser_id" text NOT NULL,
	"appraisal_period" text NOT NULL,
	"rating" numeric NOT NULL,
	"strengths" text,
	"areas_for_improvement" text,
	"goals" text,
	"comments" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"check_in" timestamp with time zone,
	"check_out" timestamp with time zone,
	"status" "attendance_status" NOT NULL,
	"remarks" text,
	"recorded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_certifications" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"certification_name" text NOT NULL,
	"issuing_authority" text NOT NULL,
	"issue_date" timestamp with time zone NOT NULL,
	"expiry_date" timestamp with time zone,
	"certificate_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_disciplinary_records" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"incident_date" timestamp with time zone NOT NULL,
	"incident_description" text NOT NULL,
	"severity" "discipline_severity" NOT NULL,
	"action_taken" text NOT NULL,
	"reported_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_leave" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"leave_type_id" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"reason" text,
	"status" "leave_status" DEFAULT 'pending' NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_leave_balances" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"leave_type_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"total_days" numeric DEFAULT '0' NOT NULL,
	"used_days" numeric DEFAULT '0' NOT NULL,
	"remaining_days" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_leave_balances_staff_id_leave_type_id_academic_year_id_unique" UNIQUE("staff_id","leave_type_id","academic_year_id")
);
--> statement-breakpoint
CREATE TABLE "staff_qualifications" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"degree" text NOT NULL,
	"field" text NOT NULL,
	"institution" text NOT NULL,
	"year" integer,
	"grade" text,
	"certificate_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"user_id" text,
	"staff_id" text,
	"role" text NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_trainings" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_id" text NOT NULL,
	"training_name" text NOT NULL,
	"organizer" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"location" text,
	"certificate_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"movement_type" "stock_movement_type" NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric DEFAULT '0' NOT NULL,
	"total_value" numeric DEFAULT '0' NOT NULL,
	"reference" text,
	"vendor" text,
	"remarks" text,
	"movement_date" timestamp with time zone DEFAULT now() NOT NULL,
	"recorded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text NOT NULL,
	"achievement_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"event" text,
	"organizer" text,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"position" text,
	"award" text,
	"certificate_url" text,
	"points" integer DEFAULT 0 NOT NULL,
	"recorded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text NOT NULL,
	"class_id" text,
	"date" timestamp with time zone NOT NULL,
	"status" "attendance_status" DEFAULT 'present' NOT NULL,
	"remarks" text,
	"recorded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_attendance_student_id_date_unique" UNIQUE("student_id","date")
);
--> statement-breakpoint
CREATE TABLE "student_discipline" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text NOT NULL,
	"incident_date" timestamp with time zone DEFAULT now() NOT NULL,
	"incident_type" text NOT NULL,
	"description" text NOT NULL,
	"severity" "discipline_severity" DEFAULT 'minor' NOT NULL,
	"action_taken" text,
	"reported_by" text,
	"parent_notified" boolean DEFAULT false NOT NULL,
	"parent_acknowledged" boolean DEFAULT false NOT NULL,
	"follow_up" text,
	"status" "discipline_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"document_type" text NOT NULL,
	"title" text NOT NULL,
	"file_url" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"uploaded_by" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expiry_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_guardians" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"user_id" text,
	"name" text,
	"relationship" text NOT NULL,
	"mobile" text,
	"phone" text,
	"email" text,
	"occupation" text,
	"tazkira_number" text,
	"national_id" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"can_pickup" boolean DEFAULT true NOT NULL,
	"receives_sms" boolean DEFAULT true NOT NULL,
	"receives_email" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_health_records" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"condition" text,
	"allergy" text,
	"medication" text,
	"dosage" text,
	"physician_name" text,
	"physician_phone" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_id_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"card_number" text NOT NULL,
	"issue_date" timestamp with time zone NOT NULL,
	"expiry_date" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"printed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_id_cards_card_number_unique" UNIQUE("card_number")
);
--> statement-breakpoint
CREATE TABLE "student_special_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_timeline" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"event_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"recorded_by" text,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_transport" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text NOT NULL,
	"route_id" text NOT NULL,
	"stop_name" text,
	"pickup_time" text,
	"drop_time" text,
	"transport_fee" numeric DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"parent_consent" boolean DEFAULT true NOT NULL,
	"emergency_contact" text,
	"special_needs" text,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_transport_student_id_route_id_unique" UNIQUE("student_id","route_id")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"user_id" text,
	"student_id" text NOT NULL,
	"registration_number" text NOT NULL,
	"admission_number" text NOT NULL,
	"first_name" text NOT NULL,
	"father_name" text NOT NULL,
	"grandfather_name" text,
	"family_name" text NOT NULL,
	"full_name" text NOT NULL,
	"date_of_birth" timestamp with time zone NOT NULL,
	"place_of_birth" text,
	"gender" "gender" NOT NULL,
	"blood_group" text,
	"nationality" text DEFAULT 'Afghan' NOT NULL,
	"national_id" text,
	"photo" text,
	"address" text,
	"city" text,
	"province" text,
	"country" text,
	"phone" text,
	"email" text,
	"religion" text,
	"father_mobile" text,
	"current_grade_id" text,
	"current_section_id" text,
	"enrollment_date" timestamp with time zone NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_student_id_unique" UNIQUE("student_id"),
	CONSTRAINT "students_registration_number_unique" UNIQUE("registration_number"),
	CONSTRAINT "students_admission_number_unique" UNIQUE("admission_number")
);
--> statement-breakpoint
CREATE TABLE "subject_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"credit_hours" numeric DEFAULT '0' NOT NULL,
	"is_elective" boolean DEFAULT false NOT NULL,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "substitutions" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"original_teacher_id" text,
	"substitute_teacher_id" text,
	"class_id" text,
	"subject_id" text,
	"period_id" text,
	"date" timestamp with time zone NOT NULL,
	"reason" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"survey_id" text NOT NULL,
	"user_id" text,
	"responses" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"rating" integer,
	"sentiment" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"survey_type" "survey_type" DEFAULT 'feedback' NOT NULL,
	"target_audience" jsonb DEFAULT '["all"]'::jsonb NOT NULL,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_backups" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text,
	"scope" text DEFAULT 'full' NOT NULL,
	"storage_ref" text NOT NULL,
	"size_bytes" integer,
	"taken_at" timestamp with time zone DEFAULT now() NOT NULL,
	"restore_point_of" timestamp with time zone,
	"status" text DEFAULT 'completed' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "terms" (
	"id" text PRIMARY KEY NOT NULL,
	"academic_year_id" text NOT NULL,
	"name" text NOT NULL,
	"term_number" integer NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"term_type" "term_type" DEFAULT 'semester' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"class_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"teacher_id" text,
	"room_id" text,
	"period_id" text NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"academic_year_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_transport_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"boarding_time" text,
	"drop_time" text,
	"boarding_status" text DEFAULT 'present' NOT NULL,
	"drop_status" text DEFAULT 'present' NOT NULL,
	"sms_sent" boolean DEFAULT false NOT NULL,
	"recorded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transport_attendance_student_transport_id_date_unique" UNIQUE("student_transport_id","date")
);
--> statement-breakpoint
CREATE TABLE "transport_routes" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"route_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"start_point" text NOT NULL,
	"end_point" text NOT NULL,
	"distance" numeric DEFAULT '0' NOT NULL,
	"estimated_time" text,
	"number_of_stops" integer DEFAULT 0 NOT NULL,
	"stops" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"vehicle_id" text,
	"driver_id" text,
	"attendant_id" text,
	"shift_type" "shift_type" DEFAULT 'morning' NOT NULL,
	"fee_amount" numeric DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transport_routes_route_id_unique" UNIQUE("route_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_type" "user_type" NOT NULL,
	"first_name" text NOT NULL,
	"father_name" text NOT NULL,
	"grandfather_name" text,
	"family_name" text NOT NULL,
	"full_name" text NOT NULL,
	"date_of_birth" timestamp with time zone,
	"place_of_birth" text,
	"gender" "gender",
	"blood_group" text,
	"nationality" text DEFAULT 'Afghan' NOT NULL,
	"national_id" text,
	"photo" text,
	"address" text,
	"city" text,
	"province" text,
	"country" text,
	"phone" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"religion" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	"school_id" text NOT NULL,
	"assigned_by" text,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_unique" UNIQUE("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"password" text NOT NULL,
	"two_factor_secret" text,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp with time zone,
	"last_login_ip" text,
	"status" "status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "utility_bills" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"reference" text NOT NULL,
	"utility_type" text NOT NULL,
	"provider" text,
	"bill_date" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone,
	"meter_reading" numeric,
	"previous_reading" numeric,
	"consumption" numeric,
	"amount" numeric DEFAULT '0' NOT NULL,
	"payment_id" text,
	"status" text DEFAULT 'unpaid' NOT NULL,
	"anomaly_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "utility_bills_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "vehicle_maintenance" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicle_id" text NOT NULL,
	"maintenance_type" text NOT NULL,
	"description" text,
	"cost" numeric DEFAULT '0' NOT NULL,
	"service_date" timestamp with time zone DEFAULT now() NOT NULL,
	"next_service_date" timestamp with time zone,
	"odometer_reading" integer,
	"service_provider" text,
	"status" "maintenance_status" DEFAULT 'completed' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"vehicle_id" text NOT NULL,
	"registration_number" text NOT NULL,
	"vehicle_type" text NOT NULL,
	"make" text,
	"model" text,
	"year" integer,
	"capacity" integer,
	"color" text,
	"engine_number" text,
	"chassis_number" text,
	"insurance_details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"insurance_expiry" timestamp with time zone,
	"registration_expiry" timestamp with time zone,
	"fitness_certificate" text,
	"fitness_expiry" timestamp with time zone,
	"purchase_date" timestamp with time zone,
	"purchase_price" numeric DEFAULT '0' NOT NULL,
	"owner_info" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_vehicle_id_unique" UNIQUE("vehicle_id"),
	CONSTRAINT "vehicles_registration_number_unique" UNIQUE("registration_number")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wellbeing_checkins" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"referral_id" text,
	"student_id" text NOT NULL,
	"checkin_date" timestamp with time zone DEFAULT now() NOT NULL,
	"mood" integer,
	"note" text,
	"protection_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recorded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wellbeing_referrals" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text NOT NULL,
	"reason" text NOT NULL,
	"counselor_id" text,
	"referral_date" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "wellbeing_referral_status" DEFAULT 'open' NOT NULL,
	"appointments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"outcome" text,
	"guardian_informed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_applying_for_grade_id_grades_id_fk" FOREIGN KEY ("applying_for_grade_id") REFERENCES "public"."grades"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_number_sequences" ADD CONSTRAINT "admission_number_sequences_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_number_sequences" ADD CONSTRAINT "admission_number_sequences_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_assigned_to_staff_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_member_id_library_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."library_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_returned_by_users_id_fk" FOREIGN KEY ("returned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_reservations" ADD CONSTRAINT "book_reservations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_reservations" ADD CONSTRAINT "book_reservations_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_reservations" ADD CONSTRAINT "book_reservations_member_id_library_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."library_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cafeteria_meal_subscriptions" ADD CONSTRAINT "cafeteria_meal_subscriptions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cafeteria_meal_subscriptions" ADD CONSTRAINT "cafeteria_meal_subscriptions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cafeteria_menus" ADD CONSTRAINT "cafeteria_menus_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_donations" ADD CONSTRAINT "community_donations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_donations" ADD CONSTRAINT "community_donations_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_volunteers" ADD CONSTRAINT "community_volunteers_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_action_plans" ADD CONSTRAINT "compliance_action_plans_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_action_plans" ADD CONSTRAINT "compliance_action_plans_inspection_id_compliance_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."compliance_inspections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_inspections" ADD CONSTRAINT "compliance_inspections_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_policies" ADD CONSTRAINT "compliance_policies_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_policies" ADD CONSTRAINT "compliance_policies_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "config_settings" ADD CONSTRAINT "config_settings_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_processing_records" ADD CONSTRAINT "data_processing_records_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_id_staff_id_fk" FOREIGN KEY ("head_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_instances" ADD CONSTRAINT "document_instances_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_instances" ADD CONSTRAINT "document_instances_template_id_document_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."document_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_instances" ADD CONSTRAINT "document_instances_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emis_data" ADD CONSTRAINT "emis_data_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emis_data" ADD CONSTRAINT "emis_data_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emis_data" ADD CONSTRAINT "emis_data_exported_by_users_id_fk" FOREIGN KEY ("exported_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_records" ADD CONSTRAINT "erp_records_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_records" ADD CONSTRAINT "erp_records_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_exam_schedule_id_exam_schedules_id_fk" FOREIGN KEY ("exam_schedule_id") REFERENCES "public"."exam_schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_entered_by_users_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedules" ADD CONSTRAINT "exam_schedules_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exit_management" ADD CONSTRAINT "exit_management_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exit_management" ADD CONSTRAINT "exit_management_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_entered_by_users_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_bookings" ADD CONSTRAINT "facility_bookings_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_bookings" ADD CONSTRAINT "facility_bookings_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_bookings" ADD CONSTRAINT "facility_bookings_booked_by_users_id_fk" FOREIGN KEY ("booked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_work_orders" ADD CONSTRAINT "facility_work_orders_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_work_orders" ADD CONSTRAINT "facility_work_orders_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_work_orders" ADD CONSTRAINT "facility_work_orders_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_work_orders" ADD CONSTRAINT "facility_work_orders_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facility_work_orders" ADD CONSTRAINT "facility_work_orders_assigned_to_staff_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_complainant_id_users_id_fk" FOREIGN KEY ("complainant_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_teacher_id_staff_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_homework_id_homework_id_fk" FOREIGN KEY ("homework_id") REFERENCES "public"."homework"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_graded_by_staff_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_room_id_hostel_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."hostel_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_attendance" ADD CONSTRAINT "hostel_attendance_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_attendance" ADD CONSTRAINT "hostel_attendance_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_attendance" ADD CONSTRAINT "hostel_attendance_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_discipline" ADD CONSTRAINT "hostel_discipline_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_discipline" ADD CONSTRAINT "hostel_discipline_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_discipline" ADD CONSTRAINT "hostel_discipline_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostel_rooms" ADD CONSTRAINT "hostel_rooms_hostel_id_hostels_id_fk" FOREIGN KEY ("hostel_id") REFERENCES "public"."hostels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostels" ADD CONSTRAINT "hostels_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hostels" ADD CONSTRAINT "hostels_warden_id_staff_id_fk" FOREIGN KEY ("warden_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_recruitment_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."recruitment_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_interviewer_id_users_id_fk" FOREIGN KEY ("interviewer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_fee_structure_id_fee_structures_id_fk" FOREIGN KEY ("fee_structure_id") REFERENCES "public"."fee_structures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_fee_structure_id_fee_structures_id_fk" FOREIGN KEY ("fee_structure_id") REFERENCES "public"."fee_structures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_types" ADD CONSTRAINT "leave_types_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_teacher_id_staff_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_period_id_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."periods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_members" ADD CONSTRAINT "library_members_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_members" ADD CONSTRAINT "library_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_members" ADD CONSTRAINT "library_members_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_members" ADD CONSTRAINT "library_members_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mess_menus" ADD CONSTRAINT "mess_menus_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mess_menus" ADD CONSTRAINT "mess_menus_hostel_id_hostels_id_fk" FOREIGN KEY ("hostel_id") REFERENCES "public"."hostels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_parent_message_id_messages_id_fk" FOREIGN KEY ("parent_message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moe_reports" ADD CONSTRAINT "moe_reports_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moe_reports" ADD CONSTRAINT "moe_reports_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "number_sequences" ADD CONSTRAINT "number_sequences_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_paid_by_users_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "periods" ADD CONSTRAINT "periods_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_invitations" ADD CONSTRAINT "portal_invitations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_invitations" ADD CONSTRAINT "portal_invitations_guardian_id_student_guardians_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "public"."student_guardians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_invitations" ADD CONSTRAINT "portal_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_budget_year_id_academic_years_id_fk" FOREIGN KEY ("budget_year_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procurement_vendors" ADD CONSTRAINT "procurement_vendors_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_procurement_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."procurement_vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_request_id_procurement_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."procurement_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_applications" ADD CONSTRAINT "recruitment_applications_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_applications" ADD CONSTRAINT "recruitment_applications_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_branches" ADD CONSTRAINT "school_branches_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_branches" ADD CONSTRAINT "school_branches_principal_id_staff_id_fk" FOREIGN KEY ("principal_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_class_teacher_id_staff_id_fk" FOREIGN KEY ("class_teacher_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_incidents" ADD CONSTRAINT "security_incidents_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_incidents" ADD CONSTRAINT "security_incidents_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sms_messages" ADD CONSTRAINT "sms_messages_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_appraisals" ADD CONSTRAINT "staff_appraisals_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_appraisals" ADD CONSTRAINT "staff_appraisals_appraiser_id_staff_id_fk" FOREIGN KEY ("appraiser_id") REFERENCES "public"."staff"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_certifications" ADD CONSTRAINT "staff_certifications_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_disciplinary_records" ADD CONSTRAINT "staff_disciplinary_records_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_disciplinary_records" ADD CONSTRAINT "staff_disciplinary_records_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_leave" ADD CONSTRAINT "staff_leave_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_leave" ADD CONSTRAINT "staff_leave_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_leave" ADD CONSTRAINT "staff_leave_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_leave_balances" ADD CONSTRAINT "staff_leave_balances_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_leave_balances" ADD CONSTRAINT "staff_leave_balances_leave_type_id_leave_types_id_fk" FOREIGN KEY ("leave_type_id") REFERENCES "public"."leave_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_leave_balances" ADD CONSTRAINT "staff_leave_balances_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_qualifications" ADD CONSTRAINT "staff_qualifications_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_roles" ADD CONSTRAINT "staff_roles_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_roles" ADD CONSTRAINT "staff_roles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_roles" ADD CONSTRAINT "staff_roles_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_trainings" ADD CONSTRAINT "staff_trainings_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_achievements" ADD CONSTRAINT "student_achievements_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_achievements" ADD CONSTRAINT "student_achievements_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_achievements" ADD CONSTRAINT "student_achievements_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_attendance" ADD CONSTRAINT "student_attendance_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_discipline" ADD CONSTRAINT "student_discipline_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_discipline" ADD CONSTRAINT "student_discipline_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_discipline" ADD CONSTRAINT "student_discipline_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_health_records" ADD CONSTRAINT "student_health_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_id_cards" ADD CONSTRAINT "student_id_cards_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_id_cards" ADD CONSTRAINT "student_id_cards_printed_by_users_id_fk" FOREIGN KEY ("printed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_special_categories" ADD CONSTRAINT "student_special_categories_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_timeline" ADD CONSTRAINT "student_timeline_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_timeline" ADD CONSTRAINT "student_timeline_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_transport" ADD CONSTRAINT "student_transport_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_transport" ADD CONSTRAINT "student_transport_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_transport" ADD CONSTRAINT "student_transport_route_id_transport_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."transport_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_current_grade_id_grades_id_fk" FOREIGN KEY ("current_grade_id") REFERENCES "public"."grades"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_current_section_id_sections_id_fk" FOREIGN KEY ("current_section_id") REFERENCES "public"."sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_groups" ADD CONSTRAINT "subject_groups_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "substitutions" ADD CONSTRAINT "substitutions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "substitutions" ADD CONSTRAINT "substitutions_original_teacher_id_staff_id_fk" FOREIGN KEY ("original_teacher_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "substitutions" ADD CONSTRAINT "substitutions_substitute_teacher_id_staff_id_fk" FOREIGN KEY ("substitute_teacher_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "substitutions" ADD CONSTRAINT "substitutions_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "substitutions" ADD CONSTRAINT "substitutions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "substitutions" ADD CONSTRAINT "substitutions_period_id_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_backups" ADD CONSTRAINT "system_backups_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_backups" ADD CONSTRAINT "system_backups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms" ADD CONSTRAINT "terms_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_teacher_id_staff_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_period_id_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_attendance" ADD CONSTRAINT "transport_attendance_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_attendance" ADD CONSTRAINT "transport_attendance_student_transport_id_student_transport_id_fk" FOREIGN KEY ("student_transport_id") REFERENCES "public"."student_transport"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_attendance" ADD CONSTRAINT "transport_attendance_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_driver_id_staff_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_attendant_id_staff_id_fk" FOREIGN KEY ("attendant_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_bills" ADD CONSTRAINT "utility_bills_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_maintenance" ADD CONSTRAINT "vehicle_maintenance_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellbeing_checkins" ADD CONSTRAINT "wellbeing_checkins_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellbeing_checkins" ADD CONSTRAINT "wellbeing_checkins_referral_id_wellbeing_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."wellbeing_referrals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellbeing_checkins" ADD CONSTRAINT "wellbeing_checkins_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellbeing_checkins" ADD CONSTRAINT "wellbeing_checkins_recorded_by_staff_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellbeing_referrals" ADD CONSTRAINT "wellbeing_referrals_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellbeing_referrals" ADD CONSTRAINT "wellbeing_referrals_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellbeing_referrals" ADD CONSTRAINT "wellbeing_referrals_counselor_id_staff_id_fk" FOREIGN KEY ("counselor_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "academic_years_school_id_idx" ON "academic_years" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "academic_years_is_current_idx" ON "academic_years" USING btree ("is_current");--> statement-breakpoint
CREATE INDEX "admission_applications_school_id_idx" ON "admission_applications" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "admission_applications_status_idx" ON "admission_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admission_number_sequences_school_year_idx" ON "admission_number_sequences" USING btree ("school_id","academic_year_id");--> statement-breakpoint
CREATE INDEX "admission_number_sequences_school_prefix_idx" ON "admission_number_sequences" USING btree ("school_id","prefix");--> statement-breakpoint
CREATE INDEX "announcements_school_id_idx" ON "announcements" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "announcements_priority_idx" ON "announcements" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "announcements_category_idx" ON "announcements" USING btree ("category");--> statement-breakpoint
CREATE INDEX "announcements_publish_date_idx" ON "announcements" USING btree ("publish_date");--> statement-breakpoint
CREATE INDEX "assets_school_id_idx" ON "assets" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "assets_asset_code_idx" ON "assets" USING btree ("asset_code");--> statement-breakpoint
CREATE INDEX "assets_category_idx" ON "assets" USING btree ("category");--> statement-breakpoint
CREATE INDEX "audit_logs_school_id_idx" ON "audit_logs" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "book_issues_school_id_idx" ON "book_issues" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "book_issues_issue_number_idx" ON "book_issues" USING btree ("issue_number");--> statement-breakpoint
CREATE INDEX "book_issues_book_id_idx" ON "book_issues" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "book_issues_member_id_idx" ON "book_issues" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "book_issues_status_idx" ON "book_issues" USING btree ("status");--> statement-breakpoint
CREATE INDEX "book_issues_due_date_idx" ON "book_issues" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "book_reservations_school_id_idx" ON "book_reservations" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "book_reservations_book_id_idx" ON "book_reservations" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "book_reservations_member_id_idx" ON "book_reservations" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "books_school_id_idx" ON "books" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "books_book_id_idx" ON "books" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "books_isbn_idx" ON "books" USING btree ("isbn");--> statement-breakpoint
CREATE INDEX "books_title_idx" ON "books" USING btree ("title");--> statement-breakpoint
CREATE INDEX "books_category_idx" ON "books" USING btree ("category");--> statement-breakpoint
CREATE INDEX "budgets_school_id_idx" ON "budgets" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "cafeteria_meal_subscriptions_school_idx" ON "cafeteria_meal_subscriptions" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "cafeteria_meal_subscriptions_student_idx" ON "cafeteria_meal_subscriptions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "cafeteria_menus_school_idx" ON "cafeteria_menus" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "classes_school_id_idx" ON "classes" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "classes_grade_id_idx" ON "classes" USING btree ("grade_id");--> statement-breakpoint
CREATE INDEX "classes_section_id_idx" ON "classes" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "community_donations_school_idx" ON "community_donations" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "community_donations_status_idx" ON "community_donations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "community_donations_received_date_idx" ON "community_donations" USING btree ("received_date");--> statement-breakpoint
CREATE INDEX "community_volunteers_school_idx" ON "community_volunteers" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "community_volunteers_status_idx" ON "community_volunteers" USING btree ("screening_status");--> statement-breakpoint
CREATE INDEX "compliance_action_plans_school_idx" ON "compliance_action_plans" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "compliance_action_plans_status_idx" ON "compliance_action_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "compliance_action_plans_inspection_idx" ON "compliance_action_plans" USING btree ("inspection_id");--> statement-breakpoint
CREATE INDEX "compliance_inspections_school_idx" ON "compliance_inspections" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "compliance_inspections_status_idx" ON "compliance_inspections" USING btree ("status");--> statement-breakpoint
CREATE INDEX "compliance_policies_school_idx" ON "compliance_policies" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "compliance_policies_category_idx" ON "compliance_policies" USING btree ("category");--> statement-breakpoint
CREATE INDEX "config_settings_school_id_idx" ON "config_settings" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "data_processing_records_school_idx" ON "data_processing_records" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "data_processing_records_subject_idx" ON "data_processing_records" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "departments_school_id_idx" ON "departments" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "discounts_school_id_idx" ON "discounts" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "discounts_student_id_idx" ON "discounts" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "document_instances_school_idx" ON "document_instances" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "document_instances_template_idx" ON "document_instances" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "document_instances_entity_idx" ON "document_instances" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "document_templates_school_idx" ON "document_templates" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "email_messages_school_id_idx" ON "email_messages" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "email_messages_email_idx" ON "email_messages" USING btree ("email");--> statement-breakpoint
CREATE INDEX "email_messages_status_idx" ON "email_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "emis_data_school_id_idx" ON "emis_data" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "emis_data_data_type_idx" ON "emis_data" USING btree ("data_type");--> statement-breakpoint
CREATE INDEX "erp_records_school_id_idx" ON "erp_records" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "erp_records_module_idx" ON "erp_records" USING btree ("module");--> statement-breakpoint
CREATE INDEX "events_school_id_idx" ON "events" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "events_event_type_idx" ON "events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "events_start_date_idx" ON "events" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "exam_marks_student_id_idx" ON "exam_marks" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "exam_results_exam_id_idx" ON "exam_results" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "exam_results_student_id_idx" ON "exam_results" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "exam_schedules_exam_id_idx" ON "exam_schedules" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "exam_schedules_class_date_idx" ON "exam_schedules" USING btree ("class_id","date");--> statement-breakpoint
CREATE INDEX "exams_school_id_idx" ON "exams" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "exams_academic_year_id_idx" ON "exams" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "exams_status_idx" ON "exams" USING btree ("status");--> statement-breakpoint
CREATE INDEX "exit_management_staff_id_idx" ON "exit_management" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "expenses_school_id_idx" ON "expenses" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "expenses_expense_number_idx" ON "expenses" USING btree ("expense_number");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "expenses_expense_date_idx" ON "expenses" USING btree ("expense_date");--> statement-breakpoint
CREATE INDEX "facility_bookings_school_idx" ON "facility_bookings" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "facility_bookings_room_idx" ON "facility_bookings" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "facility_bookings_slot_idx" ON "facility_bookings" USING btree ("start_at","end_at");--> statement-breakpoint
CREATE INDEX "facility_work_orders_school_idx" ON "facility_work_orders" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "facility_work_orders_status_idx" ON "facility_work_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "facility_work_orders_room_idx" ON "facility_work_orders" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "fee_structures_school_id_idx" ON "fee_structures" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "grades_school_id_idx" ON "grades" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "grades_level_idx" ON "grades" USING btree ("level");--> statement-breakpoint
CREATE INDEX "grievances_school_id_idx" ON "grievances" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "grievances_grievance_number_idx" ON "grievances" USING btree ("grievance_number");--> statement-breakpoint
CREATE INDEX "grievances_category_idx" ON "grievances" USING btree ("category");--> statement-breakpoint
CREATE INDEX "grievances_status_idx" ON "grievances" USING btree ("status");--> statement-breakpoint
CREATE INDEX "holidays_school_id_idx" ON "holidays" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "homework_school_id_idx" ON "homework" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "homework_class_due_idx" ON "homework" USING btree ("class_id","due_date");--> statement-breakpoint
CREATE INDEX "homework_submissions_homework_id_idx" ON "homework_submissions" USING btree ("homework_id");--> statement-breakpoint
CREATE INDEX "homework_submissions_student_id_idx" ON "homework_submissions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "hostel_allocations_school_id_idx" ON "hostel_allocations" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "hostel_allocations_student_id_idx" ON "hostel_allocations" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "hostel_allocations_room_id_idx" ON "hostel_allocations" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "hostel_attendance_school_id_idx" ON "hostel_attendance" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "hostel_attendance_date_idx" ON "hostel_attendance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "hostel_discipline_school_id_idx" ON "hostel_discipline" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "hostel_discipline_student_id_idx" ON "hostel_discipline" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "hostel_rooms_hostel_id_idx" ON "hostel_rooms" USING btree ("hostel_id");--> statement-breakpoint
CREATE INDEX "hostels_school_id_idx" ON "hostels" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "integrations_school_id_idx" ON "integrations" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "integrations_type_idx" ON "integrations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "interviews_application_id_idx" ON "interviews" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "interviews_interviewer_id_idx" ON "interviews" USING btree ("interviewer_id");--> statement-breakpoint
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoices_school_id_idx" ON "invoices" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "invoices_invoice_number_idx" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "invoices_student_id_idx" ON "invoices" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoices_due_date_idx" ON "invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "leave_types_school_id_idx" ON "leave_types" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "lesson_plans_school_id_idx" ON "lesson_plans" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "lesson_plans_teacher_id_idx" ON "lesson_plans" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "lesson_plans_class_date_idx" ON "lesson_plans" USING btree ("class_id","date");--> statement-breakpoint
CREATE INDEX "library_members_school_id_idx" ON "library_members" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "library_members_member_id_idx" ON "library_members" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "login_history_user_id_idx" ON "login_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "login_history_logged_in_at_idx" ON "login_history" USING btree ("logged_in_at");--> statement-breakpoint
CREATE INDEX "mess_menus_school_id_idx" ON "mess_menus" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "messages_school_id_idx" ON "messages" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "messages_sender_id_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "messages_recipient_id_idx" ON "messages" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "messages_group_id_idx" ON "messages" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "moe_reports_school_id_idx" ON "moe_reports" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "moe_reports_report_type_idx" ON "moe_reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "moe_reports_period_idx" ON "moe_reports" USING btree ("period");--> statement-breakpoint
CREATE INDEX "notification_preferences_user_idx" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_school_id_idx" ON "notifications" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "number_sequences_school_idx" ON "number_sequences" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "payments_school_id_idx" ON "payments" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "payments_receipt_number_idx" ON "payments" USING btree ("receipt_number");--> statement-breakpoint
CREATE INDEX "payments_student_id_idx" ON "payments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "payments_payment_date_idx" ON "payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "payments_payment_method_idx" ON "payments" USING btree ("payment_method");--> statement-breakpoint
CREATE INDEX "payroll_runs_school_id_idx" ON "payroll_runs" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "payroll_runs_status_idx" ON "payroll_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payslips_school_id_idx" ON "payslips" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "payslips_payroll_run_id_idx" ON "payslips" USING btree ("payroll_run_id");--> statement-breakpoint
CREATE INDEX "payslips_staff_id_idx" ON "payslips" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "payslips_status_idx" ON "payslips" USING btree ("status");--> statement-breakpoint
CREATE INDEX "periods_school_id_idx" ON "periods" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "permissions_school_id_idx" ON "permissions" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "permissions_module_action_idx" ON "permissions" USING btree ("module","action");--> statement-breakpoint
CREATE INDEX "portal_invitations_school_idx" ON "portal_invitations" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "portal_invitations_guardian_idx" ON "portal_invitations" USING btree ("guardian_id");--> statement-breakpoint
CREATE INDEX "procurement_requests_school_idx" ON "procurement_requests" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "procurement_requests_status_idx" ON "procurement_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "procurement_vendors_school_idx" ON "procurement_vendors" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "purchase_order_items_order_idx" ON "purchase_order_items" USING btree ("purchase_order_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_school_idx" ON "purchase_orders" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_vendor_idx" ON "purchase_orders" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "recruitment_applications_school_id_idx" ON "recruitment_applications" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "recruitment_applications_status_idx" ON "recruitment_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "report_cards_school_id_idx" ON "report_cards" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "report_cards_student_id_idx" ON "report_cards" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "roles_school_id_idx" ON "roles" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "rooms_school_id_idx" ON "rooms" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "salary_structures_school_id_idx" ON "salary_structures" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "salary_structures_staff_id_idx" ON "salary_structures" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "salary_structures_active_idx" ON "salary_structures" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "school_branches_school_id_idx" ON "school_branches" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "school_branches_code_idx" ON "school_branches" USING btree ("code");--> statement-breakpoint
CREATE INDEX "schools_email_idx" ON "schools" USING btree ("email");--> statement-breakpoint
CREATE INDEX "schools_status_idx" ON "schools" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sections_school_id_idx" ON "sections" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "sections_grade_id_idx" ON "sections" USING btree ("grade_id");--> statement-breakpoint
CREATE INDEX "security_incidents_school_idx" ON "security_incidents" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "security_incidents_status_idx" ON "security_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "security_incidents_severity_idx" ON "security_incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "shifts_school_id_idx" ON "shifts" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "sms_messages_school_id_idx" ON "sms_messages" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "sms_messages_phone_number_idx" ON "sms_messages" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "sms_messages_status_idx" ON "sms_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "staff_school_id_idx" ON "staff" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "staff_staff_id_idx" ON "staff" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "staff_user_id_idx" ON "staff" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "staff_department_id_idx" ON "staff" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "staff_status_idx" ON "staff" USING btree ("status");--> statement-breakpoint
CREATE INDEX "staff_appraisals_staff_id_idx" ON "staff_appraisals" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "staff_appraisals_appraiser_id_idx" ON "staff_appraisals" USING btree ("appraiser_id");--> statement-breakpoint
CREATE INDEX "staff_attendance_staff_id_date_idx" ON "staff_attendance" USING btree ("staff_id","date");--> statement-breakpoint
CREATE INDEX "staff_attendance_date_idx" ON "staff_attendance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "staff_certifications_staff_id_idx" ON "staff_certifications" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "staff_disciplinary_records_staff_id_idx" ON "staff_disciplinary_records" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "staff_leave_staff_id_idx" ON "staff_leave" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "staff_leave_status_idx" ON "staff_leave" USING btree ("status");--> statement-breakpoint
CREATE INDEX "staff_leave_balances_staff_id_idx" ON "staff_leave_balances" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "staff_qualifications_staff_id_idx" ON "staff_qualifications" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "staff_roles_school_id_idx" ON "staff_roles" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "staff_roles_user_id_idx" ON "staff_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "staff_trainings_staff_id_idx" ON "staff_trainings" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "stock_movements_school_id_idx" ON "stock_movements" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "stock_movements_asset_id_idx" ON "stock_movements" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "stock_movements_movement_type_idx" ON "stock_movements" USING btree ("movement_type");--> statement-breakpoint
CREATE INDEX "student_achievements_school_id_idx" ON "student_achievements" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "student_achievements_student_id_idx" ON "student_achievements" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_attendance_school_id_idx" ON "student_attendance" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "student_attendance_class_date_idx" ON "student_attendance" USING btree ("class_id","date");--> statement-breakpoint
CREATE INDEX "student_attendance_date_idx" ON "student_attendance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "student_discipline_school_id_idx" ON "student_discipline" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "student_discipline_student_id_idx" ON "student_discipline" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_discipline_status_idx" ON "student_discipline" USING btree ("status");--> statement-breakpoint
CREATE INDEX "student_documents_student_id_idx" ON "student_documents" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_guardians_student_id_idx" ON "student_guardians" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_guardians_user_id_idx" ON "student_guardians" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "student_health_records_student_id_idx" ON "student_health_records" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_id_cards_student_id_idx" ON "student_id_cards" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_id_cards_card_number_idx" ON "student_id_cards" USING btree ("card_number");--> statement-breakpoint
CREATE INDEX "student_special_categories_student_id_idx" ON "student_special_categories" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_timeline_student_id_idx" ON "student_timeline" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_timeline_recorded_at_idx" ON "student_timeline" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "student_transport_school_id_idx" ON "student_transport" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "student_transport_student_id_idx" ON "student_transport" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_transport_route_id_idx" ON "student_transport" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "students_school_id_idx" ON "students" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "students_student_id_idx" ON "students" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "students_user_id_idx" ON "students" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "students_grade_idx" ON "students" USING btree ("current_grade_id");--> statement-breakpoint
CREATE INDEX "students_status_idx" ON "students" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subject_groups_school_id_idx" ON "subject_groups" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "subjects_school_id_idx" ON "subjects" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "subjects_code_idx" ON "subjects" USING btree ("code");--> statement-breakpoint
CREATE INDEX "substitutions_school_id_idx" ON "substitutions" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "survey_responses_survey_id_idx" ON "survey_responses" USING btree ("survey_id");--> statement-breakpoint
CREATE INDEX "survey_responses_user_id_idx" ON "survey_responses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "surveys_school_id_idx" ON "surveys" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "surveys_survey_type_idx" ON "surveys" USING btree ("survey_type");--> statement-breakpoint
CREATE INDEX "system_backups_school_idx" ON "system_backups" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "system_backups_taken_at_idx" ON "system_backups" USING btree ("taken_at");--> statement-breakpoint
CREATE INDEX "terms_academic_year_id_idx" ON "terms" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "timetable_entries_school_id_idx" ON "timetable_entries" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "timetable_entries_class_day_period_idx" ON "timetable_entries" USING btree ("class_id","day_of_week","period_id");--> statement-breakpoint
CREATE INDEX "timetable_entries_teacher_day_period_idx" ON "timetable_entries" USING btree ("teacher_id","day_of_week","period_id");--> statement-breakpoint
CREATE INDEX "transport_attendance_school_id_idx" ON "transport_attendance" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "transport_attendance_date_idx" ON "transport_attendance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "transport_routes_school_id_idx" ON "transport_routes" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "transport_routes_route_id_idx" ON "transport_routes" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "user_profiles_user_id_idx" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_roles_user_id_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_roles_role_id_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "user_roles_school_id_idx" ON "user_roles" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_sessions_token_idx" ON "user_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_school_id_idx" ON "users" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "utility_bills_school_idx" ON "utility_bills" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "utility_bills_type_idx" ON "utility_bills" USING btree ("utility_type");--> statement-breakpoint
CREATE INDEX "utility_bills_bill_date_idx" ON "utility_bills" USING btree ("bill_date");--> statement-breakpoint
CREATE INDEX "vehicle_maintenance_vehicle_id_idx" ON "vehicle_maintenance" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "vehicles_school_id_idx" ON "vehicles" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "vehicles_vehicle_id_idx" ON "vehicles" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "vehicles_registration_number_idx" ON "vehicles" USING btree ("registration_number");--> statement-breakpoint
CREATE INDEX "wellbeing_checkins_school_idx" ON "wellbeing_checkins" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "wellbeing_checkins_student_idx" ON "wellbeing_checkins" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "wellbeing_referrals_school_idx" ON "wellbeing_referrals" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "wellbeing_referrals_student_idx" ON "wellbeing_referrals" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "wellbeing_referrals_status_idx" ON "wellbeing_referrals" USING btree ("status");