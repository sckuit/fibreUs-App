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
export const userRoleEnum = pgEnum('user_role', ['client', 'admin', 'technician']);
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

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('client'),
  phone: varchar("phone"),
  company: varchar("company"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

export type InsertServiceRequestType = z.infer<typeof insertServiceRequestSchema>;
export type ClientInsertServiceRequestType = z.infer<typeof clientInsertServiceRequestSchema>;
export type UpdateServiceRequestType = z.infer<typeof updateServiceRequestSchema>;
export type InsertProjectType = z.infer<typeof insertProjectSchema>;
export type InsertCommunicationType = z.infer<typeof insertCommunicationSchema>;
