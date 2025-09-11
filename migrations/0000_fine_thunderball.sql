CREATE TYPE "public"."asset_category" AS ENUM('equipment', 'vehicle', 'it_equipment', 'furniture', 'building', 'infrastructure');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('active', 'inactive', 'maintenance', 'disposed');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('contract', 'invoice', 'manual', 'certificate', 'report', 'other');--> statement-breakpoint
CREATE TYPE "public"."staff_status" AS ENUM('active', 'inactive', 'on_leave');--> statement-breakpoint
CREATE TYPE "public"."workflow_status" AS ENUM('pending', 'approved', 'rejected', 'completed');--> statement-breakpoint
CREATE TYPE "public"."workflow_type" AS ENUM('purchase', 'transfer', 'disposal', 'maintenance');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" varchar PRIMARY KEY DEFAULT concat('AST-', to_char(nextval('asset_seq'), 'FM0000')) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" "asset_category" NOT NULL,
	"serial_number" varchar,
	"status" "asset_status" DEFAULT 'active',
	"condition_score" integer DEFAULT 100,
	"purchase_date" timestamp,
	"purchase_value" numeric(12, 2),
	"current_value" numeric(12, 2),
	"warranty_expiry" timestamp,
	"custodian_id" varchar,
	"location" geometry(point),
	"address" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"tags" text[] DEFAULT '{}',
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"user_id" varchar,
	"change_summary" jsonb,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar,
	"user_agent" varchar,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" varchar PRIMARY KEY DEFAULT concat('DOC-', to_char(nextval('document_seq'), 'FM0000')) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "document_type" NOT NULL,
	"filename" varchar NOT NULL,
	"file_size" integer,
	"mime_type" varchar,
	"file_path" text NOT NULL,
	"linked_entity_type" varchar,
	"linked_entity_id" varchar,
	"retention_policy" varchar,
	"retention_expiry" timestamp,
	"tags" text[] DEFAULT '{}',
	"uploaded_by" varchar,
	"uploaded_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"employee_id" varchar,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"email" varchar,
	"phone" varchar,
	"role" varchar NOT NULL,
	"department" varchar NOT NULL,
	"manager_id" varchar,
	"status" "staff_status" DEFAULT 'active',
	"start_date" timestamp,
	"end_date" timestamp,
	"office_location" geometry(point),
	"office_address" text,
	"certifications" text[] DEFAULT '{}',
	"skills" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "staff_employee_id_unique" UNIQUE("employee_id"),
	CONSTRAINT "staff_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'user',
	"department" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" varchar PRIMARY KEY DEFAULT concat('WO-', to_char(nextval('work_order_seq'), 'FM0000')) NOT NULL,
	"asset_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"type" varchar NOT NULL,
	"priority" varchar DEFAULT 'medium',
	"status" varchar DEFAULT 'open',
	"assigned_to" varchar,
	"created_by" varchar,
	"scheduled_date" timestamp,
	"completed_date" timestamp,
	"estimated_cost" numeric(12, 2),
	"actual_cost" numeric(12, 2),
	"notes" text,
	"attachments" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" varchar PRIMARY KEY DEFAULT concat('WFL-', to_char(nextval('workflow_seq'), 'FM0000')) NOT NULL,
	"type" "workflow_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "workflow_status" DEFAULT 'pending',
	"priority" varchar DEFAULT 'medium',
	"requested_by" varchar,
	"assigned_to" varchar,
	"asset_id" varchar,
	"related_data" jsonb DEFAULT '{}'::jsonb,
	"approval_threshold" numeric(12, 2),
	"estimated_cost" numeric(12, 2),
	"actual_cost" numeric(12, 2),
	"scheduled_date" timestamp,
	"completed_date" timestamp,
	"comments" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_custodian_id_users_id_fk" FOREIGN KEY ("custodian_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_manager_id_staff_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assigned_to_staff_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");