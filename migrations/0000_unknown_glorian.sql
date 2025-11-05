CREATE TYPE "public"."client_status" AS ENUM('potential', 'active', 'inactive', 'archived');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('operations', 'equipment', 'payroll', 'marketing', 'utilities', 'rent', 'insurance', 'maintenance', 'supplies', 'transportation', 'professional_services', 'other');--> statement-breakpoint
CREATE TYPE "public"."financial_log_type" AS ENUM('project_cost_update', 'quote_created', 'quote_updated', 'inventory_purchase', 'inventory_sale', 'sales_record_created', 'sales_record_updated');--> statement-breakpoint
CREATE TYPE "public"."inventory_category" AS ENUM('cameras', 'dvr_nvr', 'monitors', 'cables', 'connectors', 'alarms', 'sensors', 'keypads', 'access_control', 'intercoms', 'fiber_optic', 'network_equipment', 'tools', 'mounting', 'power_supplies', 'other');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'partial', 'cancelled', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('manual', 'inquiry', 'referral', 'website');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'converted', 'lost');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'partial', 'paid');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('draft', 'sent', 'accepted', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('pending', 'contacted', 'qualified', 'converted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('draft', 'submitted', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('pending', 'reviewed', 'quoted', 'approved', 'scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."revenue_source" AS ENUM('contract', 'service', 'installation', 'maintenance', 'consultation', 'recurring', 'other');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('cctv', 'alarm', 'access_control', 'intercom', 'cloud_storage', 'monitoring', 'fiber_installation', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."supplier_status" AS ENUM('active', 'inactive', 'pending', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."supplier_type" AS ENUM('supplier', 'vendor', 'partner');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('purchase', 'sale', 'adjustment', 'project_usage', 'return', 'damage');--> statement-breakpoint
CREATE TYPE "public"."unit_of_measure" AS ENUM('piece', 'box', 'roll', 'meter', 'foot', 'pair', 'set', 'kit');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('client', 'employee', 'manager', 'admin', 'sales', 'project_manager');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"action" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar,
	"entity_name" varchar,
	"details" text,
	"ip_address" varchar,
	"user_agent" varchar,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"lead_id" varchar,
	"account_manager_id" varchar,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"company" varchar,
	"industry" varchar,
	"company_size" varchar,
	"address" text,
	"status" "client_status" DEFAULT 'potential' NOT NULL,
	"contract_value" numeric(10, 2),
	"contract_start_date" timestamp,
	"contract_end_date" timestamp,
	"preferred_contact_method" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "communications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_request_id" varchar,
	"project_id" varchar,
	"from_user_id" varchar NOT NULL,
	"message" text NOT NULL,
	"is_internal" boolean DEFAULT false,
	"attachments" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "company_certifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"category" varchar DEFAULT 'certification' NOT NULL,
	"icon_name" varchar,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_legal_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"category" "expense_category" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"vendor" varchar,
	"receipt" varchar,
	"project_id" varchar,
	"created_by_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financial_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"log_type" "financial_log_type" NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"previous_value" numeric(10, 2),
	"new_value" numeric(10, 2),
	"description" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"company" varchar,
	"service_type" varchar NOT NULL,
	"property_type" varchar,
	"address" varchar NOT NULL,
	"description" text,
	"notes" text,
	"urgency" varchar,
	"preferred_date" varchar,
	"preferred_time" varchar,
	"status" varchar DEFAULT 'new',
	"assigned_to_id" varchar,
	"converted_lead_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"category" "inventory_category" NOT NULL,
	"unit_of_measure" "unit_of_measure" DEFAULT 'piece',
	"quantity_in_stock" integer DEFAULT 0,
	"minimum_stock_level" integer DEFAULT 0,
	"unit_cost" numeric(10, 2),
	"unit_price" numeric(10, 2),
	"supplier" varchar,
	"location" varchar,
	"image_url" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "inventory_items_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" varchar NOT NULL,
	"transaction_type" "transaction_type" NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(10, 2),
	"total_cost" numeric(10, 2),
	"project_id" varchar,
	"performed_by_id" varchar NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar NOT NULL,
	"quote_id" varchar,
	"lead_id" varchar,
	"client_id" varchar,
	"created_by_id" varchar NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"items" jsonb NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"percentage_of_quote" numeric(5, 2),
	"amount_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"balance_due" numeric(10, 2) NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"due_date" timestamp,
	"notes" text,
	"terms_and_conditions" text,
	"share_token" varchar,
	"share_token_created_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "invoices_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"source" "lead_source" DEFAULT 'manual' NOT NULL,
	"inquiry_id" varchar,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"company" varchar,
	"service_type" varchar,
	"address" text,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"assigned_to_id" varchar,
	"notes" text,
	"estimated_value" numeric(10, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "legal_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"privacy_policy" text,
	"terms_of_service" text,
	"service_agreement" text,
	"warranty_info" text,
	"terms_and_conditions" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "price_matrix" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item" varchar NOT NULL,
	"description" text,
	"unit" varchar NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"cost_price" numeric(10, 2) NOT NULL,
	"customer_price" numeric(10, 2) NOT NULL,
	"year" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" varchar NOT NULL,
	"service_request_id" varchar,
	"lead_id" varchar,
	"client_id" varchar,
	"service_type" "service_type",
	"assigned_technician_id" varchar,
	"project_name" varchar NOT NULL,
	"status" "request_status" DEFAULT 'scheduled',
	"start_date" timestamp,
	"estimated_completion_date" timestamp,
	"actual_completion_date" timestamp,
	"total_cost" numeric(10, 2),
	"equipment_used" jsonb,
	"work_notes" text,
	"client_feedback" text,
	"client_rating" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "projects_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_number" varchar NOT NULL,
	"lead_id" varchar,
	"client_id" varchar,
	"created_by_id" varchar NOT NULL,
	"status" "quote_status" DEFAULT 'draft' NOT NULL,
	"items" jsonb NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"valid_until" timestamp,
	"notes" text,
	"terms_and_conditions" text,
	"share_token" varchar,
	"share_token_created_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "quotes_quote_number_unique" UNIQUE("quote_number"),
	CONSTRAINT "quotes_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "rate_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"display_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"code" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referral_programs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"reward_amount" numeric(10, 2) NOT NULL,
	"reward_type" varchar(50) NOT NULL,
	"services_referred" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referral_code_id" varchar,
	"referral_program_id" varchar,
	"referrer_name" varchar(255),
	"referrer_email" varchar(255),
	"referrer_phone" varchar(50),
	"referred_name" varchar(255) NOT NULL,
	"referred_email" varchar(255) NOT NULL,
	"referred_phone" varchar(50),
	"referred_company" varchar(255),
	"converted_lead_id" varchar,
	"converted_client_id" varchar,
	"status" "referral_status" DEFAULT 'pending' NOT NULL,
	"reward_amount" numeric(10, 2) DEFAULT '0',
	"points_earned" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" varchar NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"status" "report_status" DEFAULT 'draft',
	"submitted_by_id" varchar NOT NULL,
	"task_id" varchar,
	"project_id" varchar,
	"approved_by_id" varchar,
	"approved_at" timestamp,
	"rejection_reason" text,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "reports_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "revenue" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"source" "revenue_source" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"client_id" varchar,
	"invoice_id" varchar,
	"created_by_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"project_id" varchar,
	"task_id" varchar,
	"sales_rep_id" varchar NOT NULL,
	"deal_value" numeric(10, 2) NOT NULL,
	"commission" numeric(10, 2),
	"notes" text,
	"status" varchar DEFAULT 'prospecting',
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_rates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rate_type_id" varchar NOT NULL,
	"regular_rate" numeric(10, 2),
	"after_hours_rate" numeric(10, 2),
	"holiday_rate" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar NOT NULL,
	"service_type" "service_type" NOT NULL,
	"status" "request_status" DEFAULT 'pending',
	"priority" "priority" DEFAULT 'medium',
	"title" varchar NOT NULL,
	"description" text,
	"property_type" varchar,
	"address" text,
	"estimated_value" numeric(10, 2),
	"quoted_amount" numeric(10, 2),
	"admin_notes" text,
	"scheduled_date" timestamp,
	"completed_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"display_name" varchar NOT NULL,
	"description" text,
	"min_service_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "service_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "supplier_type" DEFAULT 'supplier' NOT NULL,
	"company_name" varchar NOT NULL,
	"contact_person" varchar NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"alternate_phone" varchar,
	"address" text,
	"website" varchar,
	"industry" varchar,
	"services_provided" text,
	"status" "supplier_status" DEFAULT 'active' NOT NULL,
	"payment_terms" varchar,
	"tax_id" varchar,
	"rating" integer,
	"notes" text,
	"contract_start_date" timestamp,
	"contract_end_date" timestamp,
	"created_by_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"rate" numeric(10, 2),
	"billing_period" varchar(50),
	"description" text,
	"is_custom" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" varchar,
	"website" varchar,
	"contact_email" varchar,
	"info_email" varchar,
	"address" text,
	"phone_number" varchar,
	"mission" text,
	"about_us" text,
	"header_tagline" varchar,
	"footer_tagline" varchar,
	"logo_url" varchar,
	"dark_logo_url" varchar,
	"icon_url" varchar,
	"facebook_url" varchar,
	"twitter_url" varchar,
	"linkedin_url" varchar,
	"instagram_url" varchar,
	"emergency_phone" varchar,
	"emergency_email" varchar,
	"terms_of_service_url" varchar,
	"service_agreement_url" varchar,
	"warranty_info_url" varchar,
	"privacy_policy_url" varchar,
	"selected_frontpage_services" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'pending',
	"priority" "priority" DEFAULT 'medium',
	"assigned_to_id" varchar,
	"created_by_id" varchar NOT NULL,
	"project_id" varchar,
	"due_date" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tasks_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" varchar NOT NULL,
	"role" varchar NOT NULL,
	"bio" text,
	"photo_url" varchar,
	"certifications" text[],
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"password_hash" text,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" "user_role" DEFAULT 'client',
	"phone" varchar,
	"company" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "visitors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ip_address" varchar,
	"user_agent" text,
	"referrer" text,
	"landing_page" text,
	"country" varchar,
	"city" varchar,
	"browser" varchar,
	"device" varchar,
	"operating_system" varchar,
	"is_first_visit" boolean DEFAULT true,
	"visited_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_account_manager_id_users_id_fk" FOREIGN KEY ("account_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_service_request_id_service_requests_id_fk" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_logs" ADD CONSTRAINT "financial_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_performed_by_id_users_id_fk" FOREIGN KEY ("performed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_comments" ADD CONSTRAINT "project_comments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_comments" ADD CONSTRAINT "project_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_service_request_id_service_requests_id_fk" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_assigned_technician_id_users_id_fk" FOREIGN KEY ("assigned_technician_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referral_code_id_referral_codes_id_fk" FOREIGN KEY ("referral_code_id") REFERENCES "public"."referral_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referral_program_id_referral_programs_id_fk" FOREIGN KEY ("referral_program_id") REFERENCES "public"."referral_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_converted_lead_id_leads_id_fk" FOREIGN KEY ("converted_lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_converted_client_id_clients_id_fk" FOREIGN KEY ("converted_client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue" ADD CONSTRAINT "revenue_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue" ADD CONSTRAINT "revenue_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revenue" ADD CONSTRAINT "revenue_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_records" ADD CONSTRAINT "sales_records_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_records" ADD CONSTRAINT "sales_records_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_records" ADD CONSTRAINT "sales_records_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_records" ADD CONSTRAINT "sales_records_sales_rep_id_users_id_fk" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_rates" ADD CONSTRAINT "service_rates_rate_type_id_rate_types_id_fk" FOREIGN KEY ("rate_type_id") REFERENCES "public"."rate_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_users_email_lower" ON "users" USING btree (LOWER("email"));