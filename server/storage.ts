// From javascript_database integration and business requirements
import {
  users,
  serviceRequests,
  projects,
  communications,
  visitors,
  inventoryItems,
  inventoryTransactions,
  type User,
  type UpsertUser,
  type ServiceRequest,
  type InsertServiceRequestType,
  type Project,
  type InsertProjectType,
  type Communication,
  type InsertCommunicationType,
  type Visitor,
  type InsertVisitorType,
  type InventoryItem,
  type InsertInventoryItemType,
  type InventoryTransaction,
  type InsertInventoryTransactionType,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (supports both Replit Auth and email/password)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUserWithPassword(userData: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    company?: string;
    role?: 'client' | 'employee' | 'manager' | 'admin';
  }): Promise<User>;
  setPassword(userId: string, passwordHash: string): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
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
  getTechnicians(): Promise<User[]>;
  
  // Communication operations
  createCommunication(communication: InsertCommunicationType): Promise<Communication>;
  getCommunications(serviceRequestId?: string, projectId?: string): Promise<Communication[]>;
  
  // Visitor tracking operations
  trackVisitor(visitor: InsertVisitorType): Promise<Visitor>;
  getVisitors(limit?: number): Promise<Visitor[]>;
  getVisitorAnalytics(): Promise<{
    totalVisitors: number;
    uniqueVisitors: number;
    topReferrers: { referrer: string; count: number }[];
    topLandingPages: { landingPage: string; count: number }[];
    topCountries: { country: string; count: number }[];
    topBrowsers: { browser: string; count: number }[];
    visitorsByDate: { date: string; count: number }[];
  }>;
  
  // Inventory operations
  createInventoryItem(item: InsertInventoryItemType): Promise<InventoryItem>;
  getInventoryItems(includeInactive?: boolean): Promise<InventoryItem[]>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: string): Promise<void>;
  getLowStockItems(): Promise<InventoryItem[]>;
  
  // Inventory transaction operations
  createInventoryTransaction(transaction: InsertInventoryTransactionType): Promise<InventoryTransaction>;
  getInventoryTransactions(itemId?: string, projectId?: string, limit?: number): Promise<InventoryTransaction[]>;
  
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`);
    return user;
  }

  async createUserWithPassword(userData: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    company?: string;
    role?: 'client' | 'employee' | 'manager' | 'admin';
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email: userData.email.toLowerCase(),
        passwordHash: userData.passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        company: userData.company,
        role: userData.role || 'client',
      })
      .returning();
    return user;
  }

  async setPassword(userId: string, passwordHash: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(users.email);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
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
      const result = await db.select().from(projects)
        .innerJoin(serviceRequests, eq(projects.serviceRequestId, serviceRequests.id))
        .where(eq(serviceRequests.clientId, clientId))
        .orderBy(desc(projects.createdAt));
      return result.map(row => row.projects);
    }
    return db.select().from(projects)
      .orderBy(desc(projects.createdAt));
  }

  async getTechnicians(): Promise<User[]> {
    return db.select().from(users)
      .where(eq(users.role, 'employee'))
      .orderBy(users.firstName, users.lastName);
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

  // Visitor tracking operations
  async trackVisitor(visitor: InsertVisitorType): Promise<Visitor> {
    const [newVisitor] = await db
      .insert(visitors)
      .values(visitor)
      .returning();
    return newVisitor;
  }

  async getVisitors(limit: number = 100): Promise<Visitor[]> {
    return db.select().from(visitors)
      .orderBy(desc(visitors.visitedAt))
      .limit(limit);
  }

  async getVisitorAnalytics(): Promise<{
    totalVisitors: number;
    uniqueVisitors: number;
    topReferrers: { referrer: string; count: number }[];
    topLandingPages: { landingPage: string; count: number }[];
    topCountries: { country: string; count: number }[];
    topBrowsers: { browser: string; count: number }[];
    visitorsByDate: { date: string; count: number }[];
  }> {
    // Get total visitor count
    const totalVisitorsResult = await db.select({ count: sql`COUNT(*)` }).from(visitors);
    const totalVisitors = Number(totalVisitorsResult[0]?.count) || 0;

    // Get unique visitors count (by session ID)
    const uniqueVisitorsResult = await db.select({ count: sql`COUNT(DISTINCT session_id)` }).from(visitors);
    const uniqueVisitors = Number(uniqueVisitorsResult[0]?.count) || 0;

    // Get top referrers
    const topReferrers = await db.select({
      referrer: visitors.referrer,
      count: sql`COUNT(*)`.as('count')
    })
    .from(visitors)
    .where(sql`${visitors.referrer} IS NOT NULL AND ${visitors.referrer} != ''`)
    .groupBy(visitors.referrer)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

    // Get top landing pages
    const topLandingPages = await db.select({
      landingPage: visitors.landingPage,
      count: sql`COUNT(*)`.as('count')
    })
    .from(visitors)
    .where(sql`${visitors.landingPage} IS NOT NULL AND ${visitors.landingPage} != ''`)
    .groupBy(visitors.landingPage)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

    // Get top countries
    const topCountries = await db.select({
      country: visitors.country,
      count: sql`COUNT(*)`.as('count')
    })
    .from(visitors)
    .where(sql`${visitors.country} IS NOT NULL AND ${visitors.country} != ''`)
    .groupBy(visitors.country)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

    // Get top browsers
    const topBrowsers = await db.select({
      browser: visitors.browser,
      count: sql`COUNT(*)`.as('count')
    })
    .from(visitors)
    .where(sql`${visitors.browser} IS NOT NULL AND ${visitors.browser} != ''`)
    .groupBy(visitors.browser)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

    // Get visitors by date (last 30 days)
    const visitorsByDate = await db.select({
      date: sql`DATE(${visitors.visitedAt})`.as('date'),
      count: sql`COUNT(*)`.as('count')
    })
    .from(visitors)
    .where(sql`${visitors.visitedAt} >= NOW() - INTERVAL '30 days'`)
    .groupBy(sql`DATE(${visitors.visitedAt})`)
    .orderBy(sql`DATE(${visitors.visitedAt})`);

    return {
      totalVisitors,
      uniqueVisitors,
      topReferrers: topReferrers.map(r => ({ 
        referrer: r.referrer || 'Direct', 
        count: Number(r.count) 
      })),
      topLandingPages: topLandingPages.map(p => ({ 
        landingPage: p.landingPage || '/', 
        count: Number(p.count) 
      })),
      topCountries: topCountries.map(c => ({ 
        country: c.country || 'Unknown', 
        count: Number(c.count) 
      })),
      topBrowsers: topBrowsers.map(b => ({ 
        browser: b.browser || 'Unknown', 
        count: Number(b.count) 
      })),
      visitorsByDate: visitorsByDate.map(d => ({ 
        date: d.date as string, 
        count: Number(d.count) 
      })),
    };
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

  // Inventory operations
  async createInventoryItem(item: InsertInventoryItemType): Promise<InventoryItem> {
    const [newItem] = await db
      .insert(inventoryItems)
      .values(item)
      .returning();
    return newItem;
  }

  async getInventoryItems(includeInactive: boolean = false): Promise<InventoryItem[]> {
    if (includeInactive) {
      return db.select().from(inventoryItems)
        .orderBy(inventoryItems.name);
    }
    return db.select().from(inventoryItems)
      .where(eq(inventoryItems.isActive, true))
      .orderBy(inventoryItems.name);
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems)
      .where(eq(inventoryItems.id, id));
    return item;
  }

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const [item] = await db
      .update(inventoryItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    return item;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    // Soft delete by marking as inactive
    await db
      .update(inventoryItems)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id));
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems)
      .where(and(
        eq(inventoryItems.isActive, true),
        sql`${inventoryItems.quantityInStock} <= ${inventoryItems.minimumStockLevel}`
      ))
      .orderBy(inventoryItems.name);
  }

  // Inventory transaction operations
  async createInventoryTransaction(transaction: InsertInventoryTransactionType): Promise<InventoryTransaction> {
    // Create the transaction
    const [newTransaction] = await db
      .insert(inventoryTransactions)
      .values(transaction)
      .returning();

    // Update the inventory item quantity
    const item = await this.getInventoryItem(transaction.itemId);
    if (item) {
      const newQuantity = (item.quantityInStock || 0) + transaction.quantity;
      await this.updateInventoryItem(transaction.itemId, {
        quantityInStock: newQuantity
      });
    }

    return newTransaction;
  }

  async getInventoryTransactions(itemId?: string, projectId?: string, limit: number = 100): Promise<InventoryTransaction[]> {
    let query = db.select().from(inventoryTransactions);
    
    if (itemId && projectId) {
      query = query.where(and(
        eq(inventoryTransactions.itemId, itemId),
        eq(inventoryTransactions.projectId, projectId)
      ));
    } else if (itemId) {
      query = query.where(eq(inventoryTransactions.itemId, itemId));
    } else if (projectId) {
      query = query.where(eq(inventoryTransactions.projectId, projectId));
    }
    
    return query
      .orderBy(desc(inventoryTransactions.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
