CREATE TABLE "absence_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"reason" text NOT NULL,
	"document_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admission_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"application_id" text NOT NULL,
	"document_type" text NOT NULL,
	"file_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"verified_by" text,
	"verified_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admission_offers" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"application_id" text NOT NULL,
	"offer_number" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"deposit_amount" numeric DEFAULT '0' NOT NULL,
	"admitted_at" timestamp with time zone,
	"student_id" text,
	"status" text DEFAULT 'issued' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admission_offers_offer_number_unique" UNIQUE("offer_number")
);
--> statement-breakpoint
CREATE TABLE "admission_waitlists" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"application_id" text NOT NULL,
	"grade_id" text,
	"priority" integer DEFAULT 5 NOT NULL,
	"seats_available" integer DEFAULT 0 NOT NULL,
	"offered_at" timestamp with time zone,
	"offer_expires_at" timestamp with time zone,
	"deposit_amount" numeric DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_rubrics" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"subject_id" text,
	"grade_id" text,
	"name" text NOT NULL,
	"criteria" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bands" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"max_score" numeric DEFAULT '100' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_reconciliations" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"statement_date" timestamp with time zone NOT NULL,
	"bank_name" text,
	"opening_balance" numeric DEFAULT '0' NOT NULL,
	"closing_balance" numeric DEFAULT '0' NOT NULL,
	"matched_amount" numeric DEFAULT '0' NOT NULL,
	"unmatched_amount" numeric DEFAULT '0' NOT NULL,
	"entries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communication_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"channel" text NOT NULL,
	"audience" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"template_id" text,
	"content" text,
	"scheduled_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"delivered_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communication_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"channel" text NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "communication_templates_school_name_unique" UNIQUE("school_id","name")
);
--> statement-breakpoint
CREATE TABLE "curriculum_outcomes" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"grade_id" text,
	"outcome" text NOT NULL,
	"unit" text,
	"coverage_percent" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entrance_assessments" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"application_id" text NOT NULL,
	"assessment_type" text NOT NULL,
	"scheduled_at" timestamp with time zone,
	"panel" text,
	"score" numeric DEFAULT '0' NOT NULL,
	"max_score" numeric DEFAULT '100' NOT NULL,
	"pass_score" numeric DEFAULT '40' NOT NULL,
	"notes" text,
	"result" text DEFAULT 'pending' NOT NULL,
	"graded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"subject_id" text,
	"topic" text,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"marks" numeric DEFAULT '1' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_uploads" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"file_name" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"storage_ref" text NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text NOT NULL,
	"invoice_id" text,
	"installments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_amount" numeric DEFAULT '0' NOT NULL,
	"paid_amount" numeric DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"saved_report_id" text,
	"name" text NOT NULL,
	"cadence" text NOT NULL,
	"recipients" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"format" text DEFAULT 'pdf' NOT NULL,
	"next_run_at" timestamp with time zone,
	"last_run_at" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"module" text NOT NULL,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"group_by" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"charts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_contracts" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"staff_id" text NOT NULL,
	"contract_number" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"contract_type" text DEFAULT 'permanent' NOT NULL,
	"salary" numeric DEFAULT '0' NOT NULL,
	"document_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_contracts_contract_number_unique" UNIQUE("contract_number")
);
--> statement-breakpoint
CREATE TABLE "transport_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"route_id" text NOT NULL,
	"student_id" text NOT NULL,
	"stop_name" text,
	"pickup_time" text,
	"drop_time" text,
	"transport_fee" numeric DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"parent_consent" boolean DEFAULT false NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_fuel_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"vehicle_id" text NOT NULL,
	"filled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"liters" numeric DEFAULT '0' NOT NULL,
	"price_per_liter" numeric DEFAULT '0' NOT NULL,
	"total_cost" numeric DEFAULT '0' NOT NULL,
	"odometer" numeric,
	"vendor" text,
	"notes" text,
	"recorded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "absence_requests" ADD CONSTRAINT "absence_requests_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absence_requests" ADD CONSTRAINT "absence_requests_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absence_requests" ADD CONSTRAINT "absence_requests_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_documents" ADD CONSTRAINT "admission_documents_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_documents" ADD CONSTRAINT "admission_documents_application_id_admission_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."admission_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_documents" ADD CONSTRAINT "admission_documents_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_offers" ADD CONSTRAINT "admission_offers_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_offers" ADD CONSTRAINT "admission_offers_application_id_admission_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."admission_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_offers" ADD CONSTRAINT "admission_offers_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_waitlists" ADD CONSTRAINT "admission_waitlists_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_waitlists" ADD CONSTRAINT "admission_waitlists_application_id_admission_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."admission_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_waitlists" ADD CONSTRAINT "admission_waitlists_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_rubrics" ADD CONSTRAINT "assessment_rubrics_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_rubrics" ADD CONSTRAINT "assessment_rubrics_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_rubrics" ADD CONSTRAINT "assessment_rubrics_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_campaigns" ADD CONSTRAINT "communication_campaigns_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_campaigns" ADD CONSTRAINT "communication_campaigns_template_id_communication_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."communication_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_templates" ADD CONSTRAINT "communication_templates_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_outcomes" ADD CONSTRAINT "curriculum_outcomes_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_outcomes" ADD CONSTRAINT "curriculum_outcomes_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_outcomes" ADD CONSTRAINT "curriculum_outcomes_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entrance_assessments" ADD CONSTRAINT "entrance_assessments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entrance_assessments" ADD CONSTRAINT "entrance_assessments_application_id_admission_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."admission_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entrance_assessments" ADD CONSTRAINT "entrance_assessments_graded_by_user_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_saved_report_id_saved_reports_id_fk" FOREIGN KEY ("saved_report_id") REFERENCES "public"."saved_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_contracts" ADD CONSTRAINT "staff_contracts_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_contracts" ADD CONSTRAINT "staff_contracts_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_assignments" ADD CONSTRAINT "transport_assignments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_assignments" ADD CONSTRAINT "transport_assignments_route_id_transport_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."transport_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_assignments" ADD CONSTRAINT "transport_assignments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_fuel_logs" ADD CONSTRAINT "vehicle_fuel_logs_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_fuel_logs" ADD CONSTRAINT "vehicle_fuel_logs_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_fuel_logs" ADD CONSTRAINT "vehicle_fuel_logs_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "absence_requests_school_idx" ON "absence_requests" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "absence_requests_student_idx" ON "absence_requests" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "absence_requests_status_idx" ON "absence_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admission_documents_school_idx" ON "admission_documents" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "admission_documents_application_idx" ON "admission_documents" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "admission_documents_status_idx" ON "admission_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admission_offers_school_idx" ON "admission_offers" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "admission_offers_application_idx" ON "admission_offers" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "admission_offers_status_idx" ON "admission_offers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admission_waitlists_school_idx" ON "admission_waitlists" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "admission_waitlists_status_idx" ON "admission_waitlists" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admission_waitlists_application_idx" ON "admission_waitlists" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "assessment_rubrics_school_idx" ON "assessment_rubrics" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "assessment_rubrics_subject_idx" ON "assessment_rubrics" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "bank_reconciliations_school_idx" ON "bank_reconciliations" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "bank_reconciliations_statement_date_idx" ON "bank_reconciliations" USING btree ("statement_date");--> statement-breakpoint
CREATE INDEX "communication_campaigns_school_idx" ON "communication_campaigns" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "communication_campaigns_status_idx" ON "communication_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "communication_templates_school_idx" ON "communication_templates" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "curriculum_outcomes_school_idx" ON "curriculum_outcomes" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "curriculum_outcomes_subject_idx" ON "curriculum_outcomes" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "entrance_assessments_school_idx" ON "entrance_assessments" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "entrance_assessments_application_idx" ON "entrance_assessments" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "entrance_assessments_result_idx" ON "entrance_assessments" USING btree ("result");--> statement-breakpoint
CREATE INDEX "exam_questions_school_idx" ON "exam_questions" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "exam_questions_subject_idx" ON "exam_questions" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "file_uploads_school_idx" ON "file_uploads" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "file_uploads_uploader_idx" ON "file_uploads" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "payment_plans_school_idx" ON "payment_plans" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "payment_plans_student_idx" ON "payment_plans" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "report_schedules_school_idx" ON "report_schedules" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "report_schedules_status_idx" ON "report_schedules" USING btree ("status");--> statement-breakpoint
CREATE INDEX "saved_reports_school_idx" ON "saved_reports" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "saved_reports_module_idx" ON "saved_reports" USING btree ("module");--> statement-breakpoint
CREATE INDEX "staff_contracts_school_idx" ON "staff_contracts" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "staff_contracts_staff_idx" ON "staff_contracts" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "staff_contracts_status_idx" ON "staff_contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transport_assignments_school_idx" ON "transport_assignments" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "transport_assignments_route_idx" ON "transport_assignments" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "transport_assignments_student_idx" ON "transport_assignments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "vehicle_fuel_logs_school_idx" ON "vehicle_fuel_logs" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "vehicle_fuel_logs_vehicle_idx" ON "vehicle_fuel_logs" USING btree ("vehicle_id");