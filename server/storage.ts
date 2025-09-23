// From javascript_database integration and business requirements
import {
  users,
  serviceRequests,
  projects,
  communications,
  type User,
  type UpsertUser,
  type ServiceRequest,
  type InsertServiceRequestType,
  type Project,
  type InsertProjectType,
  type Communication,
  type InsertCommunicationType,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Service request operations
  createServiceRequest(request: InsertServiceRequestType): Promise<ServiceRequest>;
  getServiceRequests(clientId?: string): Promise<ServiceRequest[]>;
  getServiceRequest(id: string): Promise<ServiceRequest | undefined>;
  updateServiceRequest(id: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest>;
  
  // Project operations
  createProject(project: InsertProjectType): Promise<Project>;
  getProjects(clientId?: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project>;
  
  // Communication operations
  createCommunication(communication: InsertCommunicationType): Promise<Communication>;
  getCommunications(serviceRequestId?: string, projectId?: string): Promise<Communication[]>;
  
  // Business queries
  getClientDashboard(clientId: string): Promise<{
    activeRequests: ServiceRequest[];
    activeProjects: Project[];
    recentCommunications: Communication[];
  }>;
  
  getAdminDashboard(): Promise<{
    pendingRequests: ServiceRequest[];
    activeProjects: Project[];
    recentCommunications: Communication[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Service request operations
  async createServiceRequest(request: InsertServiceRequestType): Promise<ServiceRequest> {
    const [serviceRequest] = await db
      .insert(serviceRequests)
      .values(request)
      .returning();
    return serviceRequest;
  }

  async getServiceRequests(clientId?: string): Promise<ServiceRequest[]> {
    if (clientId) {
      return db.select().from(serviceRequests)
        .where(eq(serviceRequests.clientId, clientId))
        .orderBy(desc(serviceRequests.createdAt));
    }
    return db.select().from(serviceRequests)
      .orderBy(desc(serviceRequests.createdAt));
  }

  async getServiceRequest(id: string): Promise<ServiceRequest | undefined> {
    const [request] = await db.select().from(serviceRequests)
      .where(eq(serviceRequests.id, id));
    return request;
  }

  async updateServiceRequest(id: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest> {
    const [request] = await db
      .update(serviceRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(serviceRequests.id, id))
      .returning();
    return request;
  }

  // Project operations
  async createProject(project: InsertProjectType): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }

  async getProjects(clientId?: string): Promise<Project[]> {
    if (clientId) {
      return db.select().from(projects)
        .where(eq(projects.clientId, clientId))
        .orderBy(desc(projects.createdAt));
    }
    return db.select().from(projects)
      .orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects)
      .where(eq(projects.id, id));
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  // Communication operations
  async createCommunication(communication: InsertCommunicationType): Promise<Communication> {
    const [newCommunication] = await db
      .insert(communications)
      .values(communication)
      .returning();
    return newCommunication;
  }

  async getCommunications(serviceRequestId?: string, projectId?: string): Promise<Communication[]> {
    if (serviceRequestId) {
      return db.select().from(communications)
        .where(eq(communications.serviceRequestId, serviceRequestId))
        .orderBy(desc(communications.createdAt));
    } else if (projectId) {
      return db.select().from(communications)
        .where(eq(communications.projectId, projectId))
        .orderBy(desc(communications.createdAt));
    }
    
    return db.select().from(communications)
      .orderBy(desc(communications.createdAt));
  }

  // Business dashboard queries
  async getClientDashboard(clientId: string): Promise<{
    activeRequests: ServiceRequest[];
    activeProjects: Project[];
    recentCommunications: Communication[];
  }> {
    const activeRequests = await db.select().from(serviceRequests)
      .where(and(
        eq(serviceRequests.clientId, clientId),
        or(
          eq(serviceRequests.status, 'pending'),
          eq(serviceRequests.status, 'reviewed'),
          eq(serviceRequests.status, 'quoted'),
          eq(serviceRequests.status, 'approved'),
          eq(serviceRequests.status, 'scheduled'),
          eq(serviceRequests.status, 'in_progress')
        )
      ))
      .orderBy(desc(serviceRequests.createdAt));

    const activeProjects = await db.select().from(projects)
      .innerJoin(serviceRequests, eq(projects.serviceRequestId, serviceRequests.id))
      .where(and(
        eq(serviceRequests.clientId, clientId),
        or(
          eq(projects.status, 'scheduled'),
          eq(projects.status, 'in_progress')
        )
      ))
      .orderBy(desc(projects.createdAt));

    const recentCommunications = await db.select().from(communications)
      .innerJoin(serviceRequests, eq(communications.serviceRequestId, serviceRequests.id))
      .where(eq(serviceRequests.clientId, clientId))
      .orderBy(desc(communications.createdAt))
      .limit(10);

    return {
      activeRequests,
      activeProjects: activeProjects.map(row => row.projects),
      recentCommunications: recentCommunications.map(row => row.communications),
    };
  }

  async getAdminDashboard(): Promise<{
    pendingRequests: ServiceRequest[];
    activeProjects: Project[];
    recentCommunications: Communication[];
  }> {
    const pendingRequests = await db.select().from(serviceRequests)
      .where(or(
        eq(serviceRequests.status, 'pending'),
        eq(serviceRequests.status, 'reviewed')
      ))
      .orderBy(desc(serviceRequests.createdAt))
      .limit(20);

    const activeProjects = await db.select().from(projects)
      .where(or(
        eq(projects.status, 'scheduled'),
        eq(projects.status, 'in_progress')
      ))
      .orderBy(desc(projects.createdAt))
      .limit(20);

    const recentCommunications = await db.select().from(communications)
      .where(eq(communications.isInternal, false))
      .orderBy(desc(communications.createdAt))
      .limit(20);

    return {
      pendingRequests,
      activeProjects,
      recentCommunications,
    };
  }
}

export const storage = new DatabaseStorage();
