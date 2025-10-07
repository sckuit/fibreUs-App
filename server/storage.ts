// From javascript_database integration and business requirements
import {
  users,
  serviceRequests,
  projects,
  communications,
  visitors,
  inventoryItems,
  inventoryTransactions,
  tasks,
  reports,
  salesRecords,
  financialLogs,
  inquiries,
  leads,
  clients,
  suppliers,
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
  type Task,
  type InsertTaskType,
  type UpdateTaskType,
  type Report,
  type InsertReportType,
  type UpdateReportType,
  type SalesRecord,
  type InsertSalesRecordType,
  type UpdateSalesRecordType,
  type FinancialLog,
  type InsertFinancialLogType,
  type Inquiry,
  type InsertInquiryType,
  type UpdateInquiryType,
  type Lead,
  type InsertLeadType,
  type UpdateLeadType,
  type Client,
  type InsertClientType,
  type UpdateClientType,
  type Supplier,
  type InsertSupplierType,
  type UpdateSupplierType,
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

  // Task operations (managers create, employees view assigned)
  createTask(task: InsertTaskType): Promise<Task>;
  getTasks(filters?: { assignedToId?: string; createdById?: string; status?: string }): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  updateTask(id: string, updates: UpdateTaskType): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;

  // Report operations (employees CRUD own, managers approve/create)
  createReport(report: InsertReportType): Promise<Report>;
  getReports(filters?: { submittedById?: string; taskId?: string; status?: string }): Promise<Report[]>;
  getReport(id: string): Promise<Report | undefined>;
  updateReport(id: string, updates: UpdateReportType): Promise<Report | undefined>;
  deleteReport(id: string): Promise<void>;
  approveReport(reportId: string, approverId: string, approved: boolean, rejectionReason?: string): Promise<Report | undefined>;

  // Sales operations (sales role CRUD, admin full access)
  createSalesRecord(record: InsertSalesRecordType): Promise<SalesRecord>;
  getSalesRecords(filters?: { salesRepId?: string; clientId?: string; status?: string }): Promise<SalesRecord[]>;
  getSalesRecord(id: string): Promise<SalesRecord | undefined>;
  updateSalesRecord(id: string, updates: UpdateSalesRecordType): Promise<SalesRecord | undefined>;
  deleteSalesRecord(id: string): Promise<void>;

  // Financial log operations (read-only for admin, written by system)
  createFinancialLog(log: InsertFinancialLogType): Promise<FinancialLog>;
  getFinancialLogs(filters?: { entityType?: string; userId?: string; logType?: string; limit?: number }): Promise<FinancialLog[]>;

  // Inquiry operations (quote requests and contact forms)
  createInquiry(inquiry: InsertInquiryType): Promise<Inquiry>;
  getInquiries(filters?: { type?: string; status?: string; assignedToId?: string }): Promise<Inquiry[]>;
  getInquiry(id: string): Promise<Inquiry | undefined>;
  updateInquiry(id: string, updates: UpdateInquiryType): Promise<Inquiry | undefined>;
  deleteInquiry(id: string): Promise<void>;

  // Lead operations (CRM - potential clients)
  createLead(lead: InsertLeadType): Promise<Lead>;
  getLeads(filters?: { source?: string; status?: string; assignedToId?: string }): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  updateLead(id: string, updates: UpdateLeadType): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<void>;
  convertInquiryToLead(inquiryId: string, assignedToId: string): Promise<Lead>;

  // Client operations (CRM - current customers)
  createClient(client: InsertClientType): Promise<Client>;
  getClients(filters?: { status?: string; accountManagerId?: string }): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  updateClient(id: string, updates: UpdateClientType): Promise<Client | undefined>;
  deleteClient(id: string): Promise<void>;
  convertLeadToClient(leadId: string, accountManagerId: string, additionalData: Partial<Client>): Promise<Client>;

  // Supplier operations (vendors, suppliers, partners)
  createSupplier(supplier: InsertSupplierType): Promise<Supplier>;
  getSuppliers(filters?: { type?: string; status?: string }): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  updateSupplier(id: string, updates: UpdateSupplierType): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Helper function to generate ticket numbers
  private async generateTicketNumber(prefix: string, table: any): Promise<string> {
    const result = await db
      .select({ ticketNumber: table.ticketNumber })
      .from(table)
      .orderBy(desc(table.ticketNumber))
      .limit(1);
    
    if (result.length === 0) {
      return `${prefix}-00001`;
    }
    
    const lastTicket = result[0].ticketNumber;
    const lastNumber = parseInt(lastTicket.split('-')[1]);
    const nextNumber = lastNumber + 1;
    return `${prefix}-${nextNumber.toString().padStart(5, '0')}`;
  }

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
    const ticketNumber = await this.generateTicketNumber('PRJ', projects);
    const [newProject] = await db
      .insert(projects)
      .values({ ...project, ticketNumber })
      .returning();
    return newProject;
  }

  async getProjects(clientId?: string): Promise<Project[]> {
    const result = await db.select({
      id: projects.id,
      ticketNumber: projects.ticketNumber,
      serviceRequestId: projects.serviceRequestId,
      clientId: projects.clientId,
      serviceType: projects.serviceType,
      assignedTechnicianId: projects.assignedTechnicianId,
      projectName: projects.projectName,
      status: projects.status,
      startDate: projects.startDate,
      estimatedCompletionDate: projects.estimatedCompletionDate,
      actualCompletionDate: projects.actualCompletionDate,
      totalCost: projects.totalCost,
      equipmentUsed: projects.equipmentUsed,
      workNotes: projects.workNotes,
      clientFeedback: projects.clientFeedback,
      clientRating: projects.clientRating,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      clientName: clients.name,
    }).from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .orderBy(desc(projects.createdAt));
    
    if (clientId) {
      return result.filter(p => p.clientId === clientId);
    }
    
    return result as any;
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

  // Task operations
  async createTask(task: InsertTaskType): Promise<Task> {
    const ticketNumber = await this.generateTicketNumber('TSK', tasks);
    const [newTask] = await db
      .insert(tasks)
      .values({ ...task, ticketNumber })
      .returning();
    return newTask;
  }

  async getTasks(filters?: { assignedToId?: string; createdById?: string; status?: string }): Promise<Task[]> {
    let query = db.select().from(tasks);
    
    const conditions = [];
    if (filters?.assignedToId) {
      conditions.push(eq(tasks.assignedToId, filters.assignedToId));
    }
    if (filters?.createdById) {
      conditions.push(eq(tasks.createdById, filters.createdById));
    }
    if (filters?.status) {
      conditions.push(eq(tasks.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async updateTask(id: string, updates: UpdateTaskType): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Report operations
  async createReport(report: InsertReportType): Promise<Report> {
    const ticketNumber = await this.generateTicketNumber('RPT', reports);
    const [newReport] = await db
      .insert(reports)
      .values({ ...report, ticketNumber })
      .returning();
    return newReport;
  }

  async getReports(filters?: { submittedById?: string; taskId?: string; status?: string }): Promise<Report[]> {
    let query = db.select().from(reports);
    
    const conditions = [];
    if (filters?.submittedById) {
      conditions.push(eq(reports.submittedById, filters.submittedById));
    }
    if (filters?.taskId) {
      conditions.push(eq(reports.taskId, filters.taskId));
    }
    if (filters?.status) {
      conditions.push(eq(reports.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(desc(reports.createdAt));
  }

  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async updateReport(id: string, updates: UpdateReportType): Promise<Report | undefined> {
    const [report] = await db
      .update(reports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    return report;
  }

  async deleteReport(id: string): Promise<void> {
    await db.delete(reports).where(eq(reports.id, id));
  }

  async approveReport(reportId: string, approverId: string, approved: boolean, rejectionReason?: string): Promise<Report | undefined> {
    const updates: any = {
      approvedById: approverId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    };
    
    if (approved) {
      updates.status = 'approved';
    } else {
      updates.status = 'rejected';
      updates.rejectionReason = rejectionReason;
    }
    
    const [report] = await db
      .update(reports)
      .set(updates)
      .where(eq(reports.id, reportId))
      .returning();
    return report;
  }

  // Sales operations
  async createSalesRecord(record: InsertSalesRecordType): Promise<SalesRecord> {
    const [newRecord] = await db
      .insert(salesRecords)
      .values(record)
      .returning();

    // Create financial log
    await this.createFinancialLog({
      logType: 'sales_record_created',
      entityType: 'sales_record',
      entityId: newRecord.id,
      userId: record.salesRepId,
      newValue: record.dealValue,
      description: `Sales record created for deal value ${record.dealValue}`,
      metadata: { status: newRecord.status },
    });

    return newRecord;
  }

  async getSalesRecords(filters?: { salesRepId?: string; clientId?: string; status?: string }): Promise<SalesRecord[]> {
    let query = db.select().from(salesRecords);
    
    const conditions = [];
    if (filters?.salesRepId) {
      conditions.push(eq(salesRecords.salesRepId, filters.salesRepId));
    }
    if (filters?.clientId) {
      conditions.push(eq(salesRecords.clientId, filters.clientId));
    }
    if (filters?.status) {
      conditions.push(eq(salesRecords.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(desc(salesRecords.createdAt));
  }

  async getSalesRecord(id: string): Promise<SalesRecord | undefined> {
    const [record] = await db.select().from(salesRecords).where(eq(salesRecords.id, id));
    return record;
  }

  async updateSalesRecord(id: string, updates: UpdateSalesRecordType): Promise<SalesRecord | undefined> {
    const existingRecord = await this.getSalesRecord(id);
    
    const [record] = await db
      .update(salesRecords)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(salesRecords.id, id))
      .returning();

    // Create financial log if deal value changed
    if (updates.dealValue && existingRecord && updates.dealValue !== existingRecord.dealValue) {
      await this.createFinancialLog({
        logType: 'sales_record_updated',
        entityType: 'sales_record',
        entityId: id,
        userId: record.salesRepId,
        previousValue: existingRecord.dealValue,
        newValue: updates.dealValue,
        description: `Sales record deal value updated from ${existingRecord.dealValue} to ${updates.dealValue}`,
      });
    }

    return record;
  }

  async deleteSalesRecord(id: string): Promise<void> {
    await db.delete(salesRecords).where(eq(salesRecords.id, id));
  }

  // Financial log operations
  async createFinancialLog(log: InsertFinancialLogType): Promise<FinancialLog> {
    const [newLog] = await db
      .insert(financialLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getFinancialLogs(filters?: { entityType?: string; userId?: string; logType?: string; limit?: number }): Promise<FinancialLog[]> {
    let query = db.select().from(financialLogs);
    
    const conditions = [];
    if (filters?.entityType) {
      conditions.push(eq(financialLogs.entityType, filters.entityType));
    }
    if (filters?.userId) {
      conditions.push(eq(financialLogs.userId, filters.userId));
    }
    if (filters?.logType) {
      conditions.push(eq(financialLogs.logType, filters.logType));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query
      .orderBy(desc(financialLogs.createdAt))
      .limit(filters?.limit || 100);
  }

  // Inquiry operations
  async createInquiry(inquiry: InsertInquiryType): Promise<Inquiry> {
    const [result] = await db.insert(inquiries).values(inquiry).returning();
    return result;
  }

  async getInquiries(filters?: { type?: string; status?: string; assignedToId?: string }): Promise<Inquiry[]> {
    let query = db.select().from(inquiries);
    
    const conditions = [];
    if (filters?.type) {
      conditions.push(eq(inquiries.type, filters.type));
    }
    if (filters?.status) {
      conditions.push(eq(inquiries.status, filters.status));
    }
    if (filters?.assignedToId) {
      conditions.push(eq(inquiries.assignedToId, filters.assignedToId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(desc(inquiries.createdAt));
  }

  async getInquiry(id: string): Promise<Inquiry | undefined> {
    const [result] = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return result;
  }

  async updateInquiry(id: string, updates: UpdateInquiryType): Promise<Inquiry | undefined> {
    const [result] = await db
      .update(inquiries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(inquiries.id, id))
      .returning();
    return result;
  }

  async deleteInquiry(id: string): Promise<void> {
    await db.delete(inquiries).where(eq(inquiries.id, id));
  }

  // Lead operations
  async createLead(lead: InsertLeadType): Promise<Lead> {
    const [result] = await db.insert(leads).values(lead).returning();
    return result;
  }

  async getLeads(filters?: { source?: string; status?: string; assignedToId?: string }): Promise<Lead[]> {
    let query = db.select().from(leads);
    
    const conditions = [];
    if (filters?.source) {
      conditions.push(eq(leads.source, filters.source));
    }
    if (filters?.status) {
      conditions.push(eq(leads.status, filters.status));
    }
    if (filters?.assignedToId) {
      conditions.push(eq(leads.assignedToId, filters.assignedToId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(desc(leads.createdAt));
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const [result] = await db.select().from(leads).where(eq(leads.id, id));
    return result;
  }

  async updateLead(id: string, updates: UpdateLeadType): Promise<Lead | undefined> {
    const [result] = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return result;
  }

  async deleteLead(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  async convertInquiryToLead(inquiryId: string, assignedToId: string): Promise<Lead> {
    const inquiry = await this.getInquiry(inquiryId);
    if (!inquiry) {
      throw new Error('Inquiry not found');
    }
    
    if (inquiry.convertedLeadId) {
      throw new Error('Inquiry already converted to lead');
    }
    
    const [lead] = await db.insert(leads).values({
      source: 'inquiry',
      inquiryId: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      phone: inquiry.phone,
      company: inquiry.company,
      serviceType: inquiry.serviceType,
      address: inquiry.address,
      status: 'new',
      assignedToId,
      notes: inquiry.description || inquiry.notes || '',
    }).returning();
    
    await this.updateInquiry(inquiryId, {
      convertedLeadId: lead.id,
      status: 'converted',
    });
    
    return lead;
  }

  // Client operations
  async createClient(client: InsertClientType): Promise<Client> {
    const [result] = await db.insert(clients).values(client).returning();
    return result;
  }

  async getClients(filters?: { status?: string; accountManagerId?: string }): Promise<Client[]> {
    let query = db.select().from(clients);
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(clients.status, filters.status));
    }
    if (filters?.accountManagerId) {
      conditions.push(eq(clients.accountManagerId, filters.accountManagerId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(desc(clients.createdAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [result] = await db.select().from(clients).where(eq(clients.id, id));
    return result;
  }

  async updateClient(id: string, updates: UpdateClientType): Promise<Client | undefined> {
    const [result] = await db
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return result;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  async convertLeadToClient(leadId: string, accountManagerId: string, additionalData: Partial<Client> = {}): Promise<Client> {
    const lead = await this.getLead(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }
    
    if (lead.status === 'converted') {
      throw new Error('Lead already converted to client');
    }
    
    const [client] = await db.insert(clients).values({
      leadId: lead.id,
      accountManagerId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      address: lead.address,
      status: 'active',
      notes: lead.notes,
      ...additionalData,
    }).returning();
    
    await this.updateLead(leadId, {
      status: 'converted',
    });
    
    return client;
  }

  // Supplier operations
  async createSupplier(supplier: InsertSupplierType): Promise<Supplier> {
    const [result] = await db.insert(suppliers).values(supplier).returning();
    return result;
  }

  async getSuppliers(filters?: { type?: string; status?: string }): Promise<Supplier[]> {
    let query = db.select().from(suppliers);
    
    const conditions = [];
    if (filters?.type) {
      conditions.push(eq(suppliers.type, filters.type));
    }
    if (filters?.status) {
      conditions.push(eq(suppliers.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [result] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return result;
  }

  async updateSupplier(id: string, updates: UpdateSupplierType): Promise<Supplier | undefined> {
    const [result] = await db
      .update(suppliers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return result;
  }

  async deleteSupplier(id: string): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }
}

export const storage = new DatabaseStorage();
