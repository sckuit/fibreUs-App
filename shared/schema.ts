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
  clientId: varchar("client_id").references(() => users.id),
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
});

export const updateTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
}).partial();

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  ticketNumber: true,
  createdAt: true,
  updatedAt: true,
  approvedById: true,
  approvedAt: true,
  submittedAt: true,
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
});

export const updateClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

// Authentication types
export type RegisterType = z.infer<typeof registerSchema>;
export type LoginType = z.infer<typeof loginSchema>;
export type ResetPasswordRequestType = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordType = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordType = z.infer<typeof changePasswordSchema>;
