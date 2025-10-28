import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  pgEnum,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums for business logic
export const userRoleEnum = pgEnum('user_role', ['client', 'employee', 'manager', 'admin', 'sales', 'project_manager']);
export const serviceTypeEnum = pgEnum('service_type', [
  'cctv', 'alarm', 'access_control', 'intercom', 'cloud_storage', 'monitoring', 'fiber_installation', 'maintenance'
]);
export const requestStatusEnum = pgEnum('request_status', [
  'pending', 'reviewed', 'quoted', 'approved', 'scheduled', 'in_progress', 'completed', 'cancelled'
]);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'urgent']);
export const inventoryCategoryEnum = pgEnum('inventory_category', [
  'cameras', 'dvr_nvr', 'monitors', 'cables', 'connectors', 
  'alarms', 'sensors', 'keypads', 'access_control', 'intercoms',
  'fiber_optic', 'network_equipment', 'tools', 'mounting', 'power_supplies', 'other'
]);
export const unitOfMeasureEnum = pgEnum('unit_of_measure', [
  'piece', 'box', 'roll', 'meter', 'foot', 'pair', 'set', 'kit'
]);
export const transactionTypeEnum = pgEnum('transaction_type', [
  'purchase', 'sale', 'adjustment', 'project_usage', 'return', 'damage'
]);
export const reportStatusEnum = pgEnum('report_status', [
  'draft', 'submitted', 'approved', 'rejected'
]);
export const taskStatusEnum = pgEnum('task_status', [
  'pending', 'in_progress', 'completed', 'cancelled'
]);
export const financialLogTypeEnum = pgEnum('financial_log_type', [
  'project_cost_update', 'quote_created', 'quote_updated', 'inventory_purchase', 'inventory_sale', 'sales_record_created', 'sales_record_updated'
]);
export const leadSourceEnum = pgEnum('lead_source', ['manual', 'inquiry', 'referral', 'website']);
export const leadStatusEnum = pgEnum('lead_status', ['new', 'contacted', 'qualified', 'converted', 'lost']);
export const clientStatusEnum = pgEnum('client_status', ['potential', 'active', 'inactive', 'archived']);
export const supplierTypeEnum = pgEnum('supplier_type', ['supplier', 'vendor', 'partner']);
export const supplierStatusEnum = pgEnum('supplier_status', ['active', 'inactive', 'pending', 'suspended']);
export const quoteStatusEnum = pgEnum('quote_status', ['draft', 'sent', 'accepted', 'rejected', 'expired']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'partial', 'cancelled', 'overdue']);
export const paymentStatusEnum = pgEnum('payment_status', ['unpaid', 'partial', 'paid']);
export const referralStatusEnum = pgEnum('referral_status', ['pending', 'contacted', 'qualified', 'converted', 'declined']);
export const expenseCategoryEnum = pgEnum('expense_category', [
  'operations', 'equipment', 'payroll', 'marketing', 'utilities', 
  'rent', 'insurance', 'maintenance', 'supplies', 'transportation', 'professional_services', 'other'
]);
export const revenueSourceEnum = pgEnum('revenue_source', [
  'contract', 'service', 'installation', 'maintenance', 'consultation', 'recurring', 'other'
]);

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (supports both Replit Auth and email/password)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: text("password_hash"), // nullable for dual auth support
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('client'),
  phone: varchar("phone"),
  company: varchar("company"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_users_email_lower").on(sql`LOWER(${table.email})`),
]);

// Service requests from clients
export const serviceRequests = pgTable("service_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id),
  serviceType: serviceTypeEnum("service_type").notNull(),
  status: requestStatusEnum("status").default('pending'),
  priority: priorityEnum("priority").default('medium'),
  title: varchar("title").notNull(),
  description: text("description"),
  propertyType: varchar("property_type"), // residential, commercial, industrial
  address: text("address"),
  estimatedValue: decimal("estimated_value", { precision: 10, scale: 2 }),
  quotedAmount: decimal("quoted_amount", { precision: 10, scale: 2 }),
  adminNotes: text("admin_notes"),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects (approved service requests become projects)
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: varchar("ticket_number").notNull().unique(),
  serviceRequestId: varchar("service_request_id").references(() => serviceRequests.id),
  clientId: varchar("client_id").references(() => clients.id),
  serviceType: serviceTypeEnum("service_type"),
  assignedTechnicianId: varchar("assigned_technician_id").references(() => users.id),
  projectName: varchar("project_name").notNull(),
  status: requestStatusEnum("status").default('scheduled'),
  startDate: timestamp("start_date"),
  estimatedCompletionDate: timestamp("estimated_completion_date"),
  actualCompletionDate: timestamp("actual_completion_date"),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  equipmentUsed: jsonb("equipment_used"), // JSON array of equipment
  workNotes: text("work_notes"),
  clientFeedback: text("client_feedback"),
  clientRating: integer("client_rating"), // 1-5 stars
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Communications/updates between clients and admins
export const communications = pgTable("communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").references(() => serviceRequests.id),
  projectId: varchar("project_id").references(() => projects.id),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  isInternal: boolean("is_internal").default(false), // true for admin-only notes
  attachments: jsonb("attachments"), // JSON array of file URLs
  createdAt: timestamp("created_at").defaultNow(),
});

// Visitor tracking for marketing analytics
export const visitors = pgTable("visitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(), // unique session identifier
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"), // where they came from
  landingPage: text("landing_page"), // first page they visited
  country: varchar("country"), // derived from IP
  city: varchar("city"), // derived from IP
  browser: varchar("browser"), // parsed from user agent
  device: varchar("device"), // mobile, desktop, tablet
  operatingSystem: varchar("operating_system"), // parsed from user agent
  isFirstVisit: boolean("is_first_visit").default(true),
  visitedAt: timestamp("visited_at").defaultNow(),
});

// Inventory items for equipment and parts tracking
export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: varchar("sku").notNull().unique(),
  name: varchar("name").notNull(),
  description: text("description"),
  category: inventoryCategoryEnum("category").notNull(),
  unitOfMeasure: unitOfMeasureEnum("unit_of_measure").default('piece'),
  quantityInStock: integer("quantity_in_stock").default(0),
  minimumStockLevel: integer("minimum_stock_level").default(0),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  supplier: varchar("supplier"),
  location: varchar("location"), // warehouse location
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory transactions for tracking stock movements
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => inventoryItems.id),
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  quantity: integer("quantity").notNull(), // positive for additions, can be negative for removals
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  projectId: varchar("project_id").references(() => projects.id), // if used in a project
  performedById: varchar("performed_by_id").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tasks created by managers
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: varchar("ticket_number").notNull().unique(),
  title: varchar("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").default('pending'),
  priority: priorityEnum("priority").default('medium'),
  assignedToId: varchar("assigned_to_id").references(() => users.id), // employee assigned
  createdById: varchar("created_by_id").notNull().references(() => users.id), // manager
  projectId: varchar("project_id").references(() => projects.id),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reports submitted by employees
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: varchar("ticket_number").notNull().unique(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  status: reportStatusEnum("status").default('draft'),
  submittedById: varchar("submitted_by_id").notNull().references(() => users.id),
  taskId: varchar("task_id").references(() => tasks.id), // optional link to task
  projectId: varchar("project_id").references(() => projects.id), // optional link to project
  approvedById: varchar("approved_by_id").references(() => users.id), // manager who approved
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales records for sales role
export const salesRecords = pgTable("sales_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id),
  projectId: varchar("project_id").references(() => projects.id),
  taskId: varchar("task_id").references(() => tasks.id),
  salesRepId: varchar("sales_rep_id").notNull().references(() => users.id),
  dealValue: decimal("deal_value", { precision: 10, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 10, scale: 2 }),
  notes: text("notes"),
  status: varchar("status").default('prospecting'), // prospecting, negotiation, closed_won, closed_lost
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Financial logs for audit trail (read-only for admin)
export const financialLogs = pgTable("financial_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  logType: financialLogTypeEnum("log_type").notNull(),
  entityType: varchar("entity_type").notNull(), // 'project', 'sales_record', 'inventory_transaction', etc.
  entityId: varchar("entity_id").notNull(), // ID of the entity affected
  userId: varchar("user_id").notNull().references(() => users.id), // who made the change
  previousValue: decimal("previous_value", { precision: 10, scale: 2 }),
  newValue: decimal("new_value", { precision: 10, scale: 2 }),
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // additional context
  createdAt: timestamp("created_at").defaultNow(),
});

// Inquiries from quote requests and contact forms
export const inquiries = pgTable("inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // 'quote' or 'appointment'
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  company: varchar("company"),
  serviceType: varchar("service_type").notNull(),
  propertyType: varchar("property_type"), // for quotes only
  address: varchar("address").notNull(),
  description: text("description"), // project description for quotes
  notes: text("notes"), // additional notes for appointments
  urgency: varchar("urgency"), // for quotes only
  preferredDate: varchar("preferred_date"), // for appointments only
  preferredTime: varchar("preferred_time"), // for appointments only
  status: varchar("status").default('new'), // new, contacted, converted, closed
  assignedToId: varchar("assigned_to_id").references(() => users.id), // sales/admin assigned
  convertedLeadId: varchar("converted_lead_id"), // references leads.id when converted
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leads - potential clients that can be converted to clients
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: leadSourceEnum("source").notNull().default('manual'),
  inquiryId: varchar("inquiry_id").references(() => inquiries.id), // nullable for manual leads
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  company: varchar("company"),
  serviceType: varchar("service_type"),
  address: text("address"),
  status: leadStatusEnum("status").notNull().default('new'),
  assignedToId: varchar("assigned_to_id").references(() => users.id), // sales user
  notes: text("notes"),
  estimatedValue: decimal("estimated_value", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients - current customers converted from leads
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id), // nullable for direct clients
  accountManagerId: varchar("account_manager_id").references(() => users.id),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  company: varchar("company"),
  industry: varchar("industry"),
  companySize: varchar("company_size"), // small, medium, large, enterprise
  address: text("address"),
  status: clientStatusEnum("status").notNull().default('potential'),
  contractValue: decimal("contract_value", { precision: 10, scale: 2 }),
  contractStartDate: timestamp("contract_start_date"),
  contractEndDate: timestamp("contract_end_date"),
  preferredContactMethod: varchar("preferred_contact_method"), // email, phone, both
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suppliers - vendors, suppliers, and partners
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: supplierTypeEnum("type").notNull().default('supplier'),
  companyName: varchar("company_name").notNull(),
  contactPerson: varchar("contact_person").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  alternatePhone: varchar("alternate_phone"),
  address: text("address"),
  website: varchar("website"),
  industry: varchar("industry"),
  servicesProvided: text("services_provided"), // Description of services/products
  status: supplierStatusEnum("status").notNull().default('active'),
  paymentTerms: varchar("payment_terms"), // Net 30, Net 60, etc.
  taxId: varchar("tax_id"),
  rating: integer("rating"), // 1-5 stars
  notes: text("notes"),
  contractStartDate: timestamp("contract_start_date"),
  contractEndDate: timestamp("contract_end_date"),
  createdById: varchar("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activities - audit log for system actions
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action").notNull(), // created, updated, deleted, login, logout, etc.
  entityType: varchar("entity_type").notNull(), // user, project, task, report, etc.
  entityId: varchar("entity_id"), // ID of the affected entity
  entityName: varchar("entity_name"), // Human-readable name/identifier
  details: text("details"), // Additional context or changes made
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  serviceRequests: many(serviceRequests),
  assignedProjects: many(projects),
  communications: many(communications),
}));

export const serviceRequestsRelations = relations(serviceRequests, ({ one, many }) => ({
  client: one(users, {
    fields: [serviceRequests.clientId],
    references: [users.id],
  }),
  project: one(projects),
  communications: many(communications),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [projects.serviceRequestId],
    references: [serviceRequests.id],
  }),
  assignedTechnician: one(users, {
    fields: [projects.assignedTechnicianId],
    references: [users.id],
  }),
  communications: many(communications),
}));

export const communicationsRelations = relations(communications, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [communications.serviceRequestId],
    references: [serviceRequests.id],
  }),
  project: one(projects, {
    fields: [communications.projectId],
    references: [projects.id],
  }),
  fromUser: one(users, {
    fields: [communications.fromUserId],
    references: [users.id],
  }),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ many }) => ({
  transactions: many(inventoryTransactions),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [inventoryTransactions.itemId],
    references: [inventoryItems.id],
  }),
  project: one(projects, {
    fields: [inventoryTransactions.projectId],
    references: [projects.id],
  }),
  performedBy: one(users, {
    fields: [inventoryTransactions.performedById],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  assignedTo: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  reports: many(reports),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  submittedBy: one(users, {
    fields: [reports.submittedById],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [reports.taskId],
    references: [tasks.id],
  }),
  project: one(projects, {
    fields: [reports.projectId],
    references: [projects.id],
  }),
  approvedBy: one(users, {
    fields: [reports.approvedById],
    references: [users.id],
  }),
}));

export const salesRecordsRelations = relations(salesRecords, ({ one }) => ({
  client: one(users, {
    fields: [salesRecords.clientId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [salesRecords.projectId],
    references: [projects.id],
  }),
  salesRep: one(users, {
    fields: [salesRecords.salesRepId],
    references: [users.id],
  }),
}));

export const financialLogsRelations = relations(financialLogs, ({ one }) => ({
  user: one(users, {
    fields: [financialLogs.userId],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

// Type exports for the new entities
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertServiceRequest = typeof serviceRequests.$inferInsert;
export type ServiceRequest = typeof serviceRequests.$inferSelect;

export type InsertProject = typeof projects.$inferInsert;
export type Project = typeof projects.$inferSelect;

export type InsertCommunication = typeof communications.$inferInsert;
export type Communication = typeof communications.$inferSelect;

export type InsertVisitor = typeof visitors.$inferInsert;
export type Visitor = typeof visitors.$inferSelect;

export type InsertInventoryItem = typeof inventoryItems.$inferInsert;
export type InventoryItem = typeof inventoryItems.$inferSelect;

export type InsertInventoryTransaction = typeof inventoryTransactions.$inferInsert;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;

// Zod schemas for validation
export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Client-only schema for creating requests (excludes admin-only fields)
export const clientInsertServiceRequestSchema = z.object({
  serviceType: z.enum(['cctv', 'alarm', 'access_control', 'intercom', 'cloud_storage', 'monitoring', 'fiber_installation', 'maintenance']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  title: z.string().min(1),
  description: z.string().optional(),
  propertyType: z.string().optional(),
  address: z.string().optional(),
  estimatedValue: z.number().positive().optional(),
}).strict(); // Reject unknown fields explicitly

export const updateServiceRequestSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'quoted', 'approved', 'scheduled', 'in_progress', 'completed', 'cancelled']),
  quotedAmount: z.number().min(0).optional(), // Allow 0 quotes
  adminNotes: z.string().optional(),
}).strict(); // Reject unknown fields explicitly

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  ticketNumber: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.coerce.date().optional(),
  estimatedCompletionDate: z.coerce.date().optional(),
  actualCompletionDate: z.coerce.date().optional(),
  totalCost: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
});

export const insertCommunicationSchema = createInsertSchema(communications).omit({
  id: true,
  createdAt: true,
});

export const insertVisitorSchema = createInsertSchema(visitors).omit({
  id: true,
  visitedAt: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventoryTransactionSchema = createInsertSchema(inventoryTransactions).omit({
  id: true,
  createdAt: true,
});

// Authentication schemas for email/password system
export const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain uppercase, lowercase, number, and special character"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  company: z.string().optional(),
}).strict();

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, "Password is required"),
}).strict();

export const resetPasswordRequestSchema = z.object({
  email: z.string().email().toLowerCase(),
}).strict();

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain uppercase, lowercase, number, and special character"),
}).strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain uppercase, lowercase, number, and special character"),
}).strict();

export type InsertServiceRequestType = z.infer<typeof insertServiceRequestSchema>;
export type ClientInsertServiceRequestType = z.infer<typeof clientInsertServiceRequestSchema>;
export type UpdateServiceRequestType = z.infer<typeof updateServiceRequestSchema>;
export type InsertProjectType = z.infer<typeof insertProjectSchema>;
export type InsertCommunicationType = z.infer<typeof insertCommunicationSchema>;
export type InsertVisitorType = z.infer<typeof insertVisitorSchema>;
export type InsertInventoryItemType = z.infer<typeof insertInventoryItemSchema>;
export type InsertInventoryTransactionType = z.infer<typeof insertInventoryTransactionSchema>;

export type InsertTask = typeof tasks.$inferInsert;
export type Task = typeof tasks.$inferSelect;

export type InsertReport = typeof reports.$inferInsert;
export type Report = typeof reports.$inferSelect;

export type InsertSalesRecord = typeof salesRecords.$inferInsert;
export type SalesRecord = typeof salesRecords.$inferSelect;

export type InsertFinancialLog = typeof financialLogs.$inferInsert;
export type FinancialLog = typeof financialLogs.$inferSelect;

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  ticketNumber: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
}).extend({
  dueDate: z.coerce.date().optional(),
});

export const updateTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
}).extend({
  dueDate: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
}).partial();

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  ticketNumber: true,
  createdAt: true,
  updatedAt: true,
  submittedById: true,
  approvedById: true,
  approvedAt: true,
  submittedAt: true,
  rejectionReason: true,
}).refine(
  (data) => data.taskId || data.projectId,
  {
    message: "Report must be linked to either a task or a project",
    path: ["taskId"],
  }
);

export const updateReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedById: true,
}).partial().refine(
  (data) => {
    // If either taskId or projectId is being updated, ensure at least one is provided
    if (data.taskId !== undefined || data.projectId !== undefined) {
      return data.taskId || data.projectId;
    }
    return true;
  },
  {
    message: "Report must be linked to either a task or a project",
    path: ["taskId"],
  }
);

export const approveReportSchema = z.object({
  reportId: z.string(),
  approved: z.boolean(),
  rejectionReason: z.string().optional(),
});

export const insertSalesRecordSchema = createInsertSchema(salesRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true,
});

export const updateSalesRecordSchema = createInsertSchema(salesRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  closedAt: z.coerce.date().optional(),
}).partial();

export const insertFinancialLogSchema = createInsertSchema(financialLogs).omit({
  id: true,
  createdAt: true,
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  assignedToId: true,
  convertedLeadId: true,
});

export const updateInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  contractStartDate: z.coerce.date().optional(),
  contractEndDate: z.coerce.date().optional(),
});

export const updateClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  contractStartDate: z.coerce.date().optional(),
  contractEndDate: z.coerce.date().optional(),
}).partial();

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  contractStartDate: z.coerce.date().optional(),
  contractEndDate: z.coerce.date().optional(),
});

export const updateSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  contractStartDate: z.coerce.date().optional(),
  contractEndDate: z.coerce.date().optional(),
}).partial();

export type InsertTaskType = z.infer<typeof insertTaskSchema>;
export type UpdateTaskType = z.infer<typeof updateTaskSchema>;
export type InsertReportType = z.infer<typeof insertReportSchema>;
export type UpdateReportType = z.infer<typeof updateReportSchema>;
export type ApproveReportType = z.infer<typeof approveReportSchema>;
export type InsertSalesRecordType = z.infer<typeof insertSalesRecordSchema>;
export type UpdateSalesRecordType = z.infer<typeof updateSalesRecordSchema>;
export type InsertFinancialLogType = z.infer<typeof insertFinancialLogSchema>;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiryType = z.infer<typeof insertInquirySchema>;
export type UpdateInquiryType = z.infer<typeof updateInquirySchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLeadType = z.infer<typeof insertLeadSchema>;
export type UpdateLeadType = z.infer<typeof updateLeadSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClientType = z.infer<typeof insertClientSchema>;
export type UpdateClientType = z.infer<typeof updateClientSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplierType = z.infer<typeof insertSupplierSchema>;
export type UpdateSupplierType = z.infer<typeof updateSupplierSchema>;

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivityType = z.infer<typeof insertActivitySchema>;

// System Configuration table
export const systemConfig = pgTable("system_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: varchar("company_name"),
  website: varchar("website"),
  contactEmail: varchar("contact_email"),
  infoEmail: varchar("info_email"),
  address: text("address"),
  phoneNumber: varchar("phone_number"),
  mission: text("mission"),
  aboutUs: text("about_us"),
  headerTagline: varchar("header_tagline"),
  footerTagline: varchar("footer_tagline"),
  logoUrl: varchar("logo_url"), // Main logo
  darkLogoUrl: varchar("dark_logo_url"), // Dark mode logo
  iconUrl: varchar("icon_url"), // Favicon/icon
  // Social Media Links
  facebookUrl: varchar("facebook_url"),
  twitterUrl: varchar("twitter_url"),
  linkedinUrl: varchar("linkedin_url"),
  instagramUrl: varchar("instagram_url"),
  // Emergency Contacts
  emergencyPhone: varchar("emergency_phone"),
  emergencyEmail: varchar("emergency_email"),
  // Legal Document URLs
  termsOfServiceUrl: varchar("terms_of_service_url"),
  serviceAgreementUrl: varchar("service_agreement_url"),
  warrantyInfoUrl: varchar("warranty_info_url"),
  privacyPolicyUrl: varchar("privacy_policy_url"),
  // Frontpage Service Selection
  selectedFrontpageServices: text("selected_frontpage_services").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service Types table (configurable service offerings)
export const serviceTypes = pgTable("service_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  minServiceFee: decimal("min_service_fee", { precision: 10, scale: 2 }).notNull().default('0'),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default('0'),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company Certifications table (for public display)
export const companyCertifications = pgTable("company_certifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull().default('certification'), // certification, license, standard
  iconName: varchar("icon_name"), // lucide-react icon name
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team Members table (for public display)
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  name: varchar("name").notNull(),
  role: varchar("role").notNull(),
  bio: text("bio"),
  photoUrl: varchar("photo_url"),
  certifications: text("certifications").array(),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Price Matrix table (billable items catalog)
export const priceMatrix = pgTable("price_matrix", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  item: varchar("item").notNull(),
  description: text("description"),
  unit: varchar("unit").notNull(), // e.g., "hour", "unit", "sq ft", etc.
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  customerPrice: decimal("customer_price", { precision: 10, scale: 2 }).notNull(),
  year: integer("year").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quotes table (formal quotes sent to leads/clients)
export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quoteNumber: varchar("quote_number").notNull().unique(),
  leadId: varchar("lead_id").references(() => leads.id),
  clientId: varchar("client_id").references(() => clients.id),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  status: quoteStatusEnum("status").default('draft').notNull(),
  items: jsonb("items").notNull(), // Array of {priceMatrixId, quantity, lineTotal}
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default('0'),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default('0'),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  validUntil: timestamp("valid_until"),
  notes: text("notes"),
  termsAndConditions: text("terms_and_conditions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoices table (formal invoices sent to leads/clients)
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  quoteId: varchar("quote_id").references(() => quotes.id),
  leadId: varchar("lead_id").references(() => leads.id),
  clientId: varchar("client_id").references(() => clients.id),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  status: invoiceStatusEnum("status").default('draft').notNull(),
  items: jsonb("items").notNull(), // Array of {priceMatrixId, itemName, description, unit, unitPrice, quantity, total}
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default('0'),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default('0'),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  percentageOfQuote: decimal("percentage_of_quote", { precision: 5, scale: 2 }), // Optional: if invoice is % of quote (e.g., 50% deposit)
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default('0').notNull(),
  balanceDue: decimal("balance_due", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default('unpaid').notNull(),
  dueDate: timestamp("due_date"),
  notes: text("notes"),
  termsAndConditions: text("terms_and_conditions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Legal Documents table (stores legal content)
export const legalDocuments = pgTable("legal_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  privacyPolicy: text("privacy_policy"),
  termsOfService: text("terms_of_service"),
  serviceAgreement: text("service_agreement"),
  warrantyInfo: text("warranty_info"),
  termsAndConditions: text("terms_and_conditions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom Legal Documents table (user-defined document types like NDA, Warranty Policy, etc.)
export const customLegalDocuments = pgTable("custom_legal_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rate Types table (stores rate type names like Phone/Remote, Trip, Onsite, Bench Time)
export const rateTypes = pgTable("rate_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  isCustom: boolean("is_custom").default(false).notNull(),
  displayOrder: integer("display_order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service Rates table (stores rates for each rate type across time periods)
export const serviceRates = pgTable("service_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rateTypeId: varchar("rate_type_id").notNull().references(() => rateTypes.id, { onDelete: 'cascade' }),
  regularRate: decimal("regular_rate", { precision: 10, scale: 2 }),
  afterHoursRate: decimal("after_hours_rate", { precision: 10, scale: 2 }),
  holidayRate: decimal("holiday_rate", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Support Plans table (stores support plan offerings)
export const supportPlans = pgTable("support_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  rate: decimal("rate", { precision: 10, scale: 2 }),
  billingPeriod: varchar("billing_period", { length: 50 }), // e.g., "monthly", "annual", "one-time"
  description: text("description"),
  isCustom: boolean("is_custom").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Referral Programs table (stores different referral program types with reward structures)
export const referralPrograms = pgTable("referral_programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 }).notNull(),
  rewardType: varchar("reward_type", { length: 50 }).notNull(), // 'fixed' or 'percentage'
  servicesReferred: text("services_referred").array(), // Array of service type IDs that can be referred
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Referral Codes table (stores unique referral codes for users)
export const referralCodes = pgTable("referral_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  code: varchar("code", { length: 20 }).notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Referrals table (tracks people referred using referral codes)
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referralCodeId: varchar("referral_code_id").references(() => referralCodes.id, { onDelete: 'cascade' }),
  referralProgramId: varchar("referral_program_id").references(() => referralPrograms.id),
  referrerName: varchar("referrer_name", { length: 255 }),
  referrerEmail: varchar("referrer_email", { length: 255 }),
  referrerPhone: varchar("referrer_phone", { length: 50 }),
  referredName: varchar("referred_name", { length: 255 }).notNull(),
  referredEmail: varchar("referred_email", { length: 255 }).notNull(),
  referredPhone: varchar("referred_phone", { length: 50 }),
  referredCompany: varchar("referred_company", { length: 255 }),
  convertedLeadId: varchar("converted_lead_id").references(() => leads.id),
  convertedClientId: varchar("converted_client_id").references(() => clients.id),
  status: referralStatusEnum("status").default('pending').notNull(),
  rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 }).default('0'),
  pointsEarned: integer("points_earned").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Expenses table (tracks business expenses)
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull().defaultNow(),
  category: expenseCategoryEnum("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  vendor: varchar("vendor"),
  receipt: varchar("receipt"), // URL to receipt/attachment stored in object storage
  projectId: varchar("project_id").references(() => projects.id), // optional link to project
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Revenue table (tracks business revenue)
export const revenue = pgTable("revenue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull().defaultNow(),
  source: revenueSourceEnum("source").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  clientId: varchar("client_id").references(() => clients.id),
  invoiceId: varchar("invoice_id").references(() => invoices.id),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertServiceTypeSchema = createInsertSchema(serviceTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateServiceTypeSchema = createInsertSchema(serviceTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertCompanyCertificationSchema = createInsertSchema(companyCertifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCompanyCertificationSchema = createInsertSchema(companyCertifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfigType = z.infer<typeof insertSystemConfigSchema>;
export type UpdateSystemConfigType = z.infer<typeof updateSystemConfigSchema>;
export type ServiceType = typeof serviceTypes.$inferSelect;
export type InsertServiceTypeType = z.infer<typeof insertServiceTypeSchema>;
export type UpdateServiceTypeType = z.infer<typeof updateServiceTypeSchema>;
export type CompanyCertification = typeof companyCertifications.$inferSelect;
export type InsertCompanyCertificationType = z.infer<typeof insertCompanyCertificationSchema>;
export type UpdateCompanyCertificationType = z.infer<typeof updateCompanyCertificationSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMemberType = z.infer<typeof insertTeamMemberSchema>;
export type UpdateTeamMemberType = z.infer<typeof updateTeamMemberSchema>;

export const insertPriceMatrixSchema = createInsertSchema(priceMatrix).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePriceMatrixSchema = createInsertSchema(priceMatrix).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type PriceMatrix = typeof priceMatrix.$inferSelect;
export type InsertPriceMatrixType = z.infer<typeof insertPriceMatrixSchema>;
export type UpdatePriceMatrixType = z.infer<typeof updatePriceMatrixSchema>;

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  quoteNumber: z.string().optional(),
  validUntil: z.string().optional(),
});

export const updateQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial().extend({
  validUntil: z.string().optional(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuoteType = z.infer<typeof insertQuoteSchema>;
export type UpdateQuoteType = z.infer<typeof updateQuoteSchema>;

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  invoiceNumber: z.string().optional(),
  dueDate: z.string().optional(),
});

export const updateInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial().extend({
  dueDate: z.string().optional(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoiceType = z.infer<typeof insertInvoiceSchema>;
export type UpdateInvoiceType = z.infer<typeof updateInvoiceSchema>;

export const insertLegalDocumentsSchema = createInsertSchema(legalDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateLegalDocumentsSchema = createInsertSchema(legalDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type LegalDocuments = typeof legalDocuments.$inferSelect;
export type InsertLegalDocumentsType = z.infer<typeof insertLegalDocumentsSchema>;
export type UpdateLegalDocumentsType = z.infer<typeof updateLegalDocumentsSchema>;

export const insertCustomLegalDocumentSchema = createInsertSchema(customLegalDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCustomLegalDocumentSchema = createInsertSchema(customLegalDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type CustomLegalDocument = typeof customLegalDocuments.$inferSelect;
export type InsertCustomLegalDocumentType = z.infer<typeof insertCustomLegalDocumentSchema>;
export type UpdateCustomLegalDocumentType = z.infer<typeof updateCustomLegalDocumentSchema>;

export const insertRateTypeSchema = createInsertSchema(rateTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateRateTypeSchema = createInsertSchema(rateTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type RateType = typeof rateTypes.$inferSelect;
export type InsertRateTypeType = z.infer<typeof insertRateTypeSchema>;
export type UpdateRateTypeType = z.infer<typeof updateRateTypeSchema>;

export const insertServiceRateSchema = createInsertSchema(serviceRates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  regularRate: z.union([
    z.string().transform(val => val === '' ? undefined : val),
    z.number().transform(val => val.toString()),
    z.undefined()
  ]).optional(),
  afterHoursRate: z.union([
    z.string().transform(val => val === '' ? undefined : val),
    z.number().transform(val => val.toString()),
    z.undefined()
  ]).optional(),
  holidayRate: z.union([
    z.string().transform(val => val === '' ? undefined : val),
    z.number().transform(val => val.toString()),
    z.undefined()
  ]).optional(),
});

export const updateServiceRateSchema = createInsertSchema(serviceRates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial().extend({
  regularRate: z.union([
    z.string().transform(val => val === '' ? undefined : val),
    z.number().transform(val => val.toString()),
    z.undefined()
  ]).optional(),
  afterHoursRate: z.union([
    z.string().transform(val => val === '' ? undefined : val),
    z.number().transform(val => val.toString()),
    z.undefined()
  ]).optional(),
  holidayRate: z.union([
    z.string().transform(val => val === '' ? undefined : val),
    z.number().transform(val => val.toString()),
    z.undefined()
  ]).optional(),
});

export type ServiceRate = typeof serviceRates.$inferSelect;
export type InsertServiceRateType = z.infer<typeof insertServiceRateSchema>;
export type UpdateServiceRateType = z.infer<typeof updateServiceRateSchema>;

export const insertSupportPlanSchema = createInsertSchema(supportPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  rate: z.union([
    z.string().transform(val => val === '' ? undefined : val),
    z.number().transform(val => val.toString()),
    z.undefined()
  ]).optional(),
});

export const updateSupportPlanSchema = createInsertSchema(supportPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial().extend({
  rate: z.union([
    z.string().transform(val => val === '' ? undefined : val),
    z.number().transform(val => val.toString()),
    z.undefined()
  ]).optional(),
});

export type SupportPlan = typeof supportPlans.$inferSelect;
export type InsertSupportPlanType = z.infer<typeof insertSupportPlanSchema>;
export type UpdateSupportPlanType = z.infer<typeof updateSupportPlanSchema>;

// Referral Programs schemas
export const insertReferralProgramSchema = createInsertSchema(referralPrograms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateReferralProgramSchema = createInsertSchema(referralPrograms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type ReferralProgram = typeof referralPrograms.$inferSelect;
export type InsertReferralProgramType = z.infer<typeof insertReferralProgramSchema>;
export type UpdateReferralProgramType = z.infer<typeof updateReferralProgramSchema>;

// Referral Codes schemas
export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateReferralCodeSchema = createInsertSchema(referralCodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCodeType = z.infer<typeof insertReferralCodeSchema>;
export type UpdateReferralCodeType = z.infer<typeof updateReferralCodeSchema>;

// Referrals schemas
export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type Referral = typeof referrals.$inferSelect;
export type InsertReferralType = z.infer<typeof insertReferralSchema>;
export type UpdateReferralType = z.infer<typeof updateReferralSchema>;

// Public Referral Submission schema (for public form submissions)
export const publicReferralSubmissionSchema = z.object({
  referrerName: z.string().optional(),
  referrerEmail: z.string().email().optional(),
  referrerPhone: z.string().optional(),
  referredName: z.string().min(1, "Referred name is required"),
  referredEmail: z.string().email("Valid email is required"),
  referredPhone: z.string().optional(),
  referredCompany: z.string().optional(),
  referralProgramId: z.string().optional(),
});

export type PublicReferralSubmissionType = z.infer<typeof publicReferralSubmissionSchema>;

// Expenses schemas
export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
}).extend({
  date: z.coerce.date(),
  amount: z.union([z.string(), z.number()]).transform(val => String(val)),
  vendor: z.string().transform(val => val === '' ? undefined : val).optional(),
  receipt: z.string().transform(val => val === '' ? undefined : val).optional(),
  projectId: z.string().transform(val => val === '' ? undefined : val).optional(),
});

export const updateExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
}).partial().extend({
  date: z.coerce.date().optional(),
  amount: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  vendor: z.string().transform(val => val === '' ? undefined : val).optional(),
  receipt: z.string().transform(val => val === '' ? undefined : val).optional(),
  projectId: z.string().transform(val => val === '' ? undefined : val).optional(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpenseType = z.infer<typeof insertExpenseSchema>;
export type UpdateExpenseType = z.infer<typeof updateExpenseSchema>;

// Revenue schemas
export const insertRevenueSchema = createInsertSchema(revenue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.coerce.date(),
  amount: z.union([z.string(), z.number()]).transform(val => String(val)),
});

export const updateRevenueSchema = createInsertSchema(revenue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial().extend({
  date: z.coerce.date().optional(),
  amount: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
});

export type Revenue = typeof revenue.$inferSelect;
export type InsertRevenueType = z.infer<typeof insertRevenueSchema>;
export type UpdateRevenueType = z.infer<typeof updateRevenueSchema>;

// Authentication types
export type RegisterType = z.infer<typeof registerSchema>;
export type LoginType = z.infer<typeof loginSchema>;
export type ResetPasswordRequestType = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordType = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordType = z.infer<typeof changePasswordSchema>;
