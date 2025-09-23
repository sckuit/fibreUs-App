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
export const userRoleEnum = pgEnum('user_role', ['client', 'employee', 'manager', 'admin']);
export const serviceTypeEnum = pgEnum('service_type', [
  'cctv', 'alarm', 'access_control', 'intercom', 'cloud_storage', 'monitoring', 'fiber_installation', 'maintenance'
]);
export const requestStatusEnum = pgEnum('request_status', [
  'pending', 'reviewed', 'quoted', 'approved', 'scheduled', 'in_progress', 'completed', 'cancelled'
]);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'urgent']);

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
  serviceRequestId: varchar("service_request_id").notNull().references(() => serviceRequests.id),
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

// Authentication types
export type RegisterType = z.infer<typeof registerSchema>;
export type LoginType = z.infer<typeof loginSchema>;
export type ResetPasswordRequestType = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordType = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordType = z.infer<typeof changePasswordSchema>;
