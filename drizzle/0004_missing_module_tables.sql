CREATE TABLE "approval_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"amount" numeric NOT NULL,
	"reason" text NOT NULL,
	"requested_by" text NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
	"reviewed_by" text REFERENCES "user"("id") ON DELETE SET NULL,
	"reviewed_at" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "approval_requests_school_idx" ON "approval_requests" ("school_id");
--> statement-breakpoint
CREATE INDEX "approval_requests_status_idx" ON "approval_requests" ("status");
--> statement-breakpoint
CREATE TABLE "tax_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
	"name" text NOT NULL,
	"tax_type" text NOT NULL,
	"tax_rate" numeric NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "tax_settings_school_idx" ON "tax_settings" ("school_id");
--> statement-breakpoint
CREATE TABLE "leave_calendars" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
	"name" text NOT NULL,
	"year" integer NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "leave_calendars_school_idx" ON "leave_calendars" ("school_id");
--> statement-breakpoint
CREATE INDEX "leave_calendars_year_idx" ON "leave_calendars" ("year");
--> statement-breakpoint
CREATE TABLE "staff_payroll_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
	"staff_id" text NOT NULL REFERENCES "staff"("id") ON DELETE CASCADE,
	"payroll_period" text NOT NULL,
	"basic_salary" numeric DEFAULT '0' NOT NULL,
	"house_allowance" numeric DEFAULT '0' NOT NULL,
	"transport_allowance" numeric DEFAULT '0' NOT NULL,
	"food_allowance" numeric DEFAULT '0' NOT NULL,
	"tax_exemption" numeric DEFAULT '0' NOT NULL,
	"bank_account" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_payroll_profiles_staff_period_unique" UNIQUE ("staff_id", "payroll_period")
);
--> statement-breakpoint
CREATE INDEX "staff_payroll_profiles_school_idx" ON "staff_payroll_profiles" ("school_id");
--> statement-breakpoint
CREATE TABLE "goods_receipts" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
	"purchase_order_id" text NOT NULL REFERENCES "purchase_orders"("id") ON DELETE RESTRICT,
	"reference_number" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"received_by" text REFERENCES "user"("id") ON DELETE SET NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "goods_receipts_school_idx" ON "goods_receipts" ("school_id");
--> statement-breakpoint
CREATE INDEX "goods_receipts_purchase_order_idx" ON "goods_receipts" ("purchase_order_id");
--> statement-breakpoint
CREATE TABLE "goods_receipt_items" (
	"id" text PRIMARY KEY NOT NULL,
	"goods_receipt_id" text NOT NULL REFERENCES "goods_receipts"("id") ON DELETE CASCADE,
	"product_id" text NOT NULL,
	"received_quantity" numeric NOT NULL,
	"condition" text DEFAULT 'good' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "goods_receipt_items_receipt_idx" ON "goods_receipt_items" ("goods_receipt_id");
--> statement-breakpoint
CREATE TABLE "stocktakes" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
	"location_id" text NOT NULL,
	"reference_number" text NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_by" text REFERENCES "user"("id") ON DELETE SET NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "stocktakes_school_idx" ON "stocktakes" ("school_id");
--> statement-breakpoint
CREATE INDEX "stocktakes_status_idx" ON "stocktakes" ("status");
--> statement-breakpoint
CREATE TABLE "admission_communications" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL REFERENCES "schools"("id") ON DELETE CASCADE,
	"application_id" text NOT NULL REFERENCES "admission_applications"("id") ON DELETE CASCADE,
	"channel" text NOT NULL,
	"recipient" text,
	"subject" text,
	"message" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text REFERENCES "user"("id") ON DELETE SET NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "admission_communications_school_idx" ON "admission_communications" ("school_id");
--> statement-breakpoint
CREATE INDEX "admission_communications_application_idx" ON "admission_communications" ("application_id");
--> statement-breakpoint
CREATE INDEX "admission_communications_sent_at_idx" ON "admission_communications" ("sent_at");
