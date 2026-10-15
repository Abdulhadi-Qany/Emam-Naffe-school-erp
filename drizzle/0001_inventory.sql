CREATE TABLE "inventory_items" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"supplier" text,
	"on_hand" numeric DEFAULT '0' NOT NULL,
	"min_level" numeric DEFAULT '0' NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"unit_cost" numeric DEFAULT '0' NOT NULL,
	"location" text,
	"last_restocked" timestamp with time zone,
	"status" text DEFAULT 'in_stock' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_items_school_sku_unique" UNIQUE("school_id","sku")
);
--> statement-breakpoint
CREATE TABLE "inventory_stock_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"item_id" text NOT NULL,
	"movement_type" "stock_movement_type" DEFAULT 'purchase' NOT NULL,
	"quantity" numeric DEFAULT '0' NOT NULL,
	"unit_cost" numeric DEFAULT '0' NOT NULL,
	"reference" text,
	"vendor" text,
	"remarks" text,
	"movement_date" timestamp with time zone DEFAULT now() NOT NULL,
	"recorded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stock_movements" ADD CONSTRAINT "inventory_stock_movements_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stock_movements" ADD CONSTRAINT "inventory_stock_movements_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stock_movements" ADD CONSTRAINT "inventory_stock_movements_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventory_items_school_idx" ON "inventory_items" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "inventory_items_category_idx" ON "inventory_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "inventory_items_status_idx" ON "inventory_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inventory_stock_movements_school_idx" ON "inventory_stock_movements" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "inventory_stock_movements_item_idx" ON "inventory_stock_movements" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "inventory_stock_movements_date_idx" ON "inventory_stock_movements" USING btree ("movement_date");