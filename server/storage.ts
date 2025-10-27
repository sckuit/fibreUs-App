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
  activities,
  systemConfig,
  serviceTypes,
  companyCertifications,
  teamMembers,
  priceMatrix,
  quotes,
  invoices,
  legalDocuments,
  customLegalDocuments,
  rateTypes,
  serviceRates,
  supportPlans,
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
  type Activity,
  type InsertActivityType,
  type SystemConfig,
  type InsertSystemConfigType,
  type UpdateSystemConfigType,
  type ServiceType,
  type InsertServiceTypeType,
  type UpdateServiceTypeType,
  type CompanyCertification,
  type InsertCompanyCertificationType,
  type UpdateCompanyCertificationType,
  type TeamMember,
  type InsertTeamMemberType,
  type UpdateTeamMemberType,
  type PriceMatrix,
  type InsertPriceMatrixType,
  type UpdatePriceMatrixType,
  type Quote,
  type InsertQuoteType,
  type UpdateQuoteType,
  type Invoice,
  type InsertInvoiceType,
  type UpdateInvoiceType,
  type LegalDocuments,
  type InsertLegalDocumentsType,
  type UpdateLegalDocumentsType,
  type CustomLegalDocument,
  type InsertCustomLegalDocumentType,
  type UpdateCustomLegalDocumentType,
  type RateType,
  type InsertRateTypeType,
  type UpdateRateTypeType,
  type ServiceRate,
  type InsertServiceRateType,
  type UpdateServiceRateType,
  type SupportPlan,
  type InsertSupportPlanType,
  type UpdateSupportPlanType,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, asc } from "drizzle-orm";

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
  getProjects(filters?: { clientId?: string; assignedTechnicianId?: string }): Promise<Project[]>;
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

  // Activity log operations (audit trail)
  logActivity(activity: InsertActivityType): Promise<Activity>;
  getActivities(filters?: { userId?: string; entityType?: string; action?: string; limit?: number }): Promise<Activity[]>;

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

  // System Configuration operations
  getSystemConfig(): Promise<SystemConfig | undefined>;
  updateSystemConfig(updates: UpdateSystemConfigType): Promise<SystemConfig>;

  // Service Type operations
  createServiceType(data: InsertServiceTypeType): Promise<ServiceType>;
  getServiceTypes(includeInactive?: boolean): Promise<ServiceType[]>;
  getServiceType(id: string): Promise<ServiceType | undefined>;
  updateServiceType(id: string, updates: UpdateServiceTypeType): Promise<ServiceType | undefined>;
  deleteServiceType(id: string): Promise<void>;

  // Company Certification operations
  createCompanyCertification(data: InsertCompanyCertificationType): Promise<CompanyCertification>;
  getCompanyCertifications(includeInactive?: boolean): Promise<CompanyCertification[]>;
  updateCompanyCertification(id: string, updates: UpdateCompanyCertificationType): Promise<CompanyCertification | undefined>;
  deleteCompanyCertification(id: string): Promise<void>;

  // Team Member operations
  createTeamMember(data: InsertTeamMemberType): Promise<TeamMember>;
  getTeamMembers(includeInactive?: boolean): Promise<TeamMember[]>;
  updateTeamMember(id: string, updates: UpdateTeamMemberType): Promise<TeamMember | undefined>;
  deleteTeamMember(id: string): Promise<void>;

  // Price Matrix operations
  createPriceMatrixItem(data: InsertPriceMatrixType): Promise<PriceMatrix>;
  getPriceMatrixItems(includeInactive?: boolean): Promise<PriceMatrix[]>;
  getPriceMatrixItem(id: string): Promise<PriceMatrix | undefined>;
  updatePriceMatrixItem(id: string, updates: UpdatePriceMatrixType): Promise<PriceMatrix | undefined>;
  deletePriceMatrixItem(id: string): Promise<void>;

  // Quote operations
  createQuote(data: InsertQuoteType): Promise<Quote>;
  getQuotes(filters?: { leadId?: string; clientId?: string; status?: string }): Promise<Quote[]>;
  getQuote(id: string): Promise<Quote | undefined>;
  updateQuote(id: string, updates: UpdateQuoteType): Promise<Quote | undefined>;
  deleteQuote(id: string): Promise<void>;

  // Invoice operations
  createInvoice(data: InsertInvoiceType): Promise<Invoice>;
  getInvoices(filters?: { leadId?: string; clientId?: string; quoteId?: string; paymentStatus?: string }): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  updateInvoice(id: string, updates: UpdateInvoiceType): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<void>;

  // Legal Documents operations
  getLegalDocuments(): Promise<LegalDocuments | undefined>;
  updateLegalDocuments(updates: UpdateLegalDocumentsType): Promise<LegalDocuments>;

  // Custom Legal Documents operations
  createCustomLegalDocument(data: InsertCustomLegalDocumentType): Promise<CustomLegalDocument>;
  getCustomLegalDocuments(): Promise<CustomLegalDocument[]>;
  getCustomLegalDocument(id: string): Promise<CustomLegalDocument | undefined>;
  updateCustomLegalDocument(id: string, updates: UpdateCustomLegalDocumentType): Promise<CustomLegalDocument | undefined>;
  deleteCustomLegalDocument(id: string): Promise<void>;

  // Rate Type operations
  createRateType(data: InsertRateTypeType): Promise<RateType>;
  getRateTypes(): Promise<RateType[]>;
  updateRateType(id: string, updates: UpdateRateTypeType): Promise<RateType | undefined>;
  deleteRateType(id: string): Promise<void>;

  // Service Rate operations
  createServiceRate(data: InsertServiceRateType): Promise<ServiceRate>;
  getServiceRates(): Promise<ServiceRate[]>;
  getServiceRateByRateTypeId(rateTypeId: string): Promise<ServiceRate | undefined>;
  updateServiceRate(id: string, updates: UpdateServiceRateType): Promise<ServiceRate | undefined>;
  deleteServiceRate(id: string): Promise<void>;

  // Support Plan operations
  createSupportPlan(data: InsertSupportPlanType): Promise<SupportPlan>;
  getSupportPlans(): Promise<SupportPlan[]>;
  updateSupportPlan(id: string, updates: UpdateSupportPlanType): Promise<SupportPlan | undefined>;
  deleteSupportPlan(id: string): Promise<void>;
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

  async getProjects(filters?: { clientId?: string; assignedTechnicianId?: string }): Promise<Project[]> {
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
    
    if (filters?.clientId) {
      return result.filter(p => p.clientId === filters.clientId);
    }
    
    if (filters?.assignedTechnicianId) {
      return result.filter(p => p.assignedTechnicianId === filters.assignedTechnicianId);
    }
    
    return result as any;
  }

  async getTechnicians(): Promise<User[]> {
    return db.select().from(users)
      .where(eq(users.role, 'employee'))
      .orderBy(users.firstName, users.lastName);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select({
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
      .where(eq(projects.id, id));
    return project as any;
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

  // Activity log operations
  async logActivity(activity: InsertActivityType): Promise<Activity> {
    const [result] = await db.insert(activities).values(activity).returning();
    return result;
  }

  async getActivities(filters?: { userId?: string; entityType?: string; action?: string; limit?: number }): Promise<Activity[]> {
    let query = db.select().from(activities);
    
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(activities.userId, filters.userId));
    }
    if (filters?.entityType) {
      conditions.push(eq(activities.entityType, filters.entityType));
    }
    if (filters?.action) {
      conditions.push(eq(activities.action, filters.action));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query
      .orderBy(desc(activities.timestamp))
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

  // System Configuration operations
  async getSystemConfig(): Promise<SystemConfig | undefined> {
    const [config] = await db.select().from(systemConfig).limit(1);
    return config;
  }

  async updateSystemConfig(updates: UpdateSystemConfigType): Promise<SystemConfig> {
    // Check if config exists
    const existing = await this.getSystemConfig();
    
    if (existing) {
      const [result] = await db
        .update(systemConfig)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(systemConfig.id, existing.id))
        .returning();
      return result;
    } else {
      // Create new config if it doesn't exist
      const [result] = await db
        .insert(systemConfig)
        .values(updates)
        .returning();
      return result;
    }
  }

  // Service Type operations
  async createServiceType(data: InsertServiceTypeType): Promise<ServiceType> {
    const [result] = await db.insert(serviceTypes).values(data).returning();
    return result;
  }

  async getServiceTypes(includeInactive = false): Promise<ServiceType[]> {
    let query = db.select().from(serviceTypes);
    
    if (!includeInactive) {
      query = query.where(eq(serviceTypes.isActive, true));
    }
    
    return query.orderBy(desc(serviceTypes.createdAt));
  }

  async getServiceType(id: string): Promise<ServiceType | undefined> {
    const [result] = await db.select().from(serviceTypes).where(eq(serviceTypes.id, id));
    return result;
  }

  async updateServiceType(id: string, updates: UpdateServiceTypeType): Promise<ServiceType | undefined> {
    const [result] = await db
      .update(serviceTypes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(serviceTypes.id, id))
      .returning();
    return result;
  }

  async deleteServiceType(id: string): Promise<void> {
    await db.delete(serviceTypes).where(eq(serviceTypes.id, id));
  }

  // Company Certification operations
  async createCompanyCertification(data: InsertCompanyCertificationType): Promise<CompanyCertification> {
    const [result] = await db.insert(companyCertifications).values(data).returning();
    return result;
  }

  async getCompanyCertifications(includeInactive = false): Promise<CompanyCertification[]> {
    let query = db.select().from(companyCertifications);
    
    if (!includeInactive) {
      query = query.where(eq(companyCertifications.isActive, true));
    }
    
    return query.orderBy(asc(companyCertifications.displayOrder), desc(companyCertifications.createdAt));
  }

  async updateCompanyCertification(id: string, updates: UpdateCompanyCertificationType): Promise<CompanyCertification | undefined> {
    const [result] = await db
      .update(companyCertifications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companyCertifications.id, id))
      .returning();
    return result;
  }

  async deleteCompanyCertification(id: string): Promise<void> {
    await db.delete(companyCertifications).where(eq(companyCertifications.id, id));
  }

  // Team Member operations
  async createTeamMember(data: InsertTeamMemberType): Promise<TeamMember> {
    const [result] = await db.insert(teamMembers).values(data).returning();
    return result;
  }

  async getTeamMembers(includeInactive = false): Promise<TeamMember[]> {
    let query = db.select().from(teamMembers);
    
    if (!includeInactive) {
      query = query.where(eq(teamMembers.isActive, true));
    }
    
    return query.orderBy(asc(teamMembers.displayOrder), desc(teamMembers.createdAt));
  }

  async updateTeamMember(id: string, updates: UpdateTeamMemberType): Promise<TeamMember | undefined> {
    const [result] = await db
      .update(teamMembers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(teamMembers.id, id))
      .returning();
    return result;
  }

  async deleteTeamMember(id: string): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.id, id));
  }

  // Price Matrix operations
  async createPriceMatrixItem(data: InsertPriceMatrixType): Promise<PriceMatrix> {
    const [result] = await db.insert(priceMatrix).values(data).returning();
    return result;
  }

  async getPriceMatrixItems(includeInactive = false): Promise<PriceMatrix[]> {
    let query = db.select().from(priceMatrix);
    
    if (!includeInactive) {
      query = query.where(eq(priceMatrix.isActive, true));
    }
    
    return query.orderBy(desc(priceMatrix.year), asc(priceMatrix.item));
  }

  async getPriceMatrixItem(id: string): Promise<PriceMatrix | undefined> {
    const [result] = await db.select().from(priceMatrix).where(eq(priceMatrix.id, id));
    return result;
  }

  async updatePriceMatrixItem(id: string, updates: UpdatePriceMatrixType): Promise<PriceMatrix | undefined> {
    const [result] = await db
      .update(priceMatrix)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(priceMatrix.id, id))
      .returning();
    return result;
  }

  async deletePriceMatrixItem(id: string): Promise<void> {
    await db.delete(priceMatrix).where(eq(priceMatrix.id, id));
  }

  // Quote operations
  async createQuote(data: InsertQuoteType): Promise<Quote> {
    // Generate quote number if not provided
    let quoteNumber = data.quoteNumber;
    if (!quoteNumber) {
      const year = new Date().getFullYear();
      const result = await db
        .select({ quoteNumber: quotes.quoteNumber })
        .from(quotes)
        .orderBy(desc(quotes.quoteNumber))
        .limit(1);
      
      if (result.length === 0) {
        quoteNumber = `Q-${year}-00001`;
      } else {
        const lastQuote = result[0].quoteNumber;
        const parts = lastQuote.split('-');
        const lastNumber = parseInt(parts[2]);
        const nextNumber = lastNumber + 1;
        quoteNumber = `Q-${year}-${nextNumber.toString().padStart(5, '0')}`;
      }
    }
    
    // Transform validUntil string to Date object or undefined
    const transformedData = {
      ...data,
      quoteNumber,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
    };
    
    const [result] = await db.insert(quotes).values(transformedData).returning();
    return result;
  }

  async getQuotes(filters?: { leadId?: string; clientId?: string; status?: string }): Promise<Quote[]> {
    let query = db.select().from(quotes);
    
    const conditions = [];
    if (filters?.leadId) {
      conditions.push(eq(quotes.leadId, filters.leadId));
    }
    if (filters?.clientId) {
      conditions.push(eq(quotes.clientId, filters.clientId));
    }
    if (filters?.status) {
      conditions.push(eq(quotes.status, filters.status as any));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(desc(quotes.createdAt));
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    const [result] = await db.select().from(quotes).where(eq(quotes.id, id));
    return result;
  }

  async updateQuote(id: string, updates: UpdateQuoteType): Promise<Quote | undefined> {
    // Transform validUntil string to Date object or null
    const transformedUpdates = {
      ...updates,
      validUntil: updates.validUntil ? new Date(updates.validUntil) : null,
      updatedAt: new Date(),
    };
    
    const [result] = await db
      .update(quotes)
      .set(transformedUpdates)
      .where(eq(quotes.id, id))
      .returning();
    return result;
  }

  async deleteQuote(id: string): Promise<void> {
    await db.delete(quotes).where(eq(quotes.id, id));
  }

  // Invoice operations
  async createInvoice(data: InsertInvoiceType): Promise<Invoice> {
    // Generate invoice number if not provided
    let invoiceNumber = data.invoiceNumber;
    if (!invoiceNumber) {
      const year = new Date().getFullYear();
      const result = await db
        .select({ invoiceNumber: invoices.invoiceNumber })
        .from(invoices)
        .orderBy(desc(invoices.invoiceNumber))
        .limit(1);
      
      if (result.length === 0) {
        invoiceNumber = `INV-${year}-00001`;
      } else {
        const lastInvoice = result[0].invoiceNumber;
        const parts = lastInvoice.split('-');
        const lastNumber = parseInt(parts[2]);
        const nextNumber = lastNumber + 1;
        invoiceNumber = `INV-${year}-${nextNumber.toString().padStart(5, '0')}`;
      }
    }
    
    // Calculate initial balanceDue if not provided
    const total = data.total || 0;
    const amountPaid = data.amountPaid || 0;
    const balanceDue = data.balanceDue !== undefined ? data.balanceDue : (total - amountPaid);
    
    // Transform dueDate string to Date object or undefined
    const transformedData = {
      ...data,
      invoiceNumber,
      balanceDue,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    };
    
    // Determine initial payment status
    let paymentStatus = transformedData.paymentStatus;
    if (!paymentStatus) {
      if (balanceDue <= 0) {
        paymentStatus = 'paid';
      } else if (amountPaid > 0) {
        paymentStatus = 'partial';
      } else {
        paymentStatus = 'unpaid';
      }
    }
    
    const [result] = await db.insert(invoices).values({
      ...transformedData,
      balanceDue,
      paymentStatus
    }).returning();
    return result;
  }

  async getInvoices(filters?: { leadId?: string; clientId?: string; quoteId?: string; paymentStatus?: string }): Promise<Invoice[]> {
    let query = db.select().from(invoices);
    
    const conditions = [];
    if (filters?.leadId) {
      conditions.push(eq(invoices.leadId, filters.leadId));
    }
    if (filters?.clientId) {
      conditions.push(eq(invoices.clientId, filters.clientId));
    }
    if (filters?.quoteId) {
      conditions.push(eq(invoices.quoteId, filters.quoteId));
    }
    if (filters?.paymentStatus) {
      conditions.push(eq(invoices.paymentStatus, filters.paymentStatus as any));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [result] = await db.select().from(invoices).where(eq(invoices.id, id));
    return result;
  }

  async updateInvoice(id: string, updates: UpdateInvoiceType): Promise<Invoice | undefined> {
    // Get current invoice to recalculate balanceDue if needed
    const current = await this.getInvoice(id);
    if (!current) {
      return undefined;
    }
    
    // Prepare updated data with date transformation
    const updatedData: any = {
      ...updates,
      dueDate: updates.dueDate ? new Date(updates.dueDate) : null,
      updatedAt: new Date(),
    };
    
    // Recalculate balanceDue if total or amountPaid changed
    const newTotal = updates.total !== undefined ? updates.total : current.total;
    const newAmountPaid = updates.amountPaid !== undefined ? updates.amountPaid : current.amountPaid;
    updatedData.balanceDue = newTotal - newAmountPaid;
    
    // Update paymentStatus based on balance
    if (updatedData.balanceDue <= 0) {
      updatedData.paymentStatus = 'paid';
    } else if (newAmountPaid > 0) {
      updatedData.paymentStatus = 'partial';
    } else {
      updatedData.paymentStatus = 'unpaid';
    }
    
    const [result] = await db
      .update(invoices)
      .set(updatedData)
      .where(eq(invoices.id, id))
      .returning();
    return result;
  }

  async deleteInvoice(id: string): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  // Legal Documents operations
  async getLegalDocuments(): Promise<LegalDocuments | undefined> {
    const [docs] = await db.select().from(legalDocuments).limit(1);
    return docs;
  }

  async updateLegalDocuments(updates: UpdateLegalDocumentsType): Promise<LegalDocuments> {
    const existing = await this.getLegalDocuments();
    
    if (existing) {
      const [result] = await db
        .update(legalDocuments)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(legalDocuments.id, existing.id))
        .returning();
      return result;
    } else {
      const [result] = await db
        .insert(legalDocuments)
        .values({ ...updates, updatedAt: new Date() })
        .returning();
      return result;
    }
  }

  // Custom Legal Documents operations
  async createCustomLegalDocument(data: InsertCustomLegalDocumentType): Promise<CustomLegalDocument> {
    const [result] = await db.insert(customLegalDocuments).values(data).returning();
    return result;
  }

  async getCustomLegalDocuments(): Promise<CustomLegalDocument[]> {
    return db.select().from(customLegalDocuments).orderBy(desc(customLegalDocuments.createdAt));
  }

  async getCustomLegalDocument(id: string): Promise<CustomLegalDocument | undefined> {
    const [result] = await db.select().from(customLegalDocuments).where(eq(customLegalDocuments.id, id));
    return result;
  }

  async updateCustomLegalDocument(id: string, updates: UpdateCustomLegalDocumentType): Promise<CustomLegalDocument | undefined> {
    const [result] = await db
      .update(customLegalDocuments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customLegalDocuments.id, id))
      .returning();
    return result;
  }

  async deleteCustomLegalDocument(id: string): Promise<void> {
    await db.delete(customLegalDocuments).where(eq(customLegalDocuments.id, id));
  }

  // Rate Type operations
  async createRateType(data: InsertRateTypeType): Promise<RateType> {
    const [result] = await db.insert(rateTypes).values(data).returning();
    
    // Automatically create a service_rate record for this rate type
    await db.insert(serviceRates).values({
      rateTypeId: result.id,
      regularRate: null,
      afterHoursRate: null,
      holidayRate: null,
      notes: null,
    });
    
    return result;
  }

  async getRateTypes(): Promise<RateType[]> {
    return db.select().from(rateTypes).orderBy(asc(rateTypes.displayOrder));
  }

  async updateRateType(id: string, updates: UpdateRateTypeType): Promise<RateType | undefined> {
    const [result] = await db
      .update(rateTypes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rateTypes.id, id))
      .returning();
    return result;
  }

  async deleteRateType(id: string): Promise<void> {
    await db.delete(rateTypes).where(eq(rateTypes.id, id));
  }

  // Service Rate operations
  async createServiceRate(data: InsertServiceRateType): Promise<ServiceRate> {
    const cleanedData = {
      ...data,
      regularRate: data.regularRate === undefined ? null : data.regularRate,
      afterHoursRate: data.afterHoursRate === undefined ? null : data.afterHoursRate,
      holidayRate: data.holidayRate === undefined ? null : data.holidayRate,
    };
    const [result] = await db.insert(serviceRates).values(cleanedData).returning();
    return result;
  }

  async getServiceRates(): Promise<ServiceRate[]> {
    return db.select().from(serviceRates);
  }

  async getServiceRateByRateTypeId(rateTypeId: string): Promise<ServiceRate | undefined> {
    const [result] = await db
      .select()
      .from(serviceRates)
      .where(eq(serviceRates.rateTypeId, rateTypeId));
    return result;
  }

  async updateServiceRate(id: string, updates: UpdateServiceRateType): Promise<ServiceRate | undefined> {
    const cleanedUpdates = {
      ...updates,
      regularRate: updates.regularRate === undefined ? null : updates.regularRate,
      afterHoursRate: updates.afterHoursRate === undefined ? null : updates.afterHoursRate,
      holidayRate: updates.holidayRate === undefined ? null : updates.holidayRate,
      updatedAt: new Date()
    };
    const [result] = await db
      .update(serviceRates)
      .set(cleanedUpdates)
      .where(eq(serviceRates.id, id))
      .returning();
    return result;
  }

  async deleteServiceRate(id: string): Promise<void> {
    await db.delete(serviceRates).where(eq(serviceRates.id, id));
  }

  // Support Plan operations
  async createSupportPlan(data: InsertSupportPlanType): Promise<SupportPlan> {
    const cleanedData = {
      ...data,
      rate: data.rate === undefined ? null : data.rate,
    };
    const [result] = await db.insert(supportPlans).values(cleanedData).returning();
    return result;
  }

  async getSupportPlans(): Promise<SupportPlan[]> {
    return db.select().from(supportPlans).orderBy(desc(supportPlans.createdAt));
  }

  async updateSupportPlan(id: string, updates: UpdateSupportPlanType): Promise<SupportPlan | undefined> {
    const cleanedUpdates = {
      ...updates,
      rate: updates.rate === undefined ? null : updates.rate,
      updatedAt: new Date()
    };
    const [result] = await db
      .update(supportPlans)
      .set(cleanedUpdates)
      .where(eq(supportPlans.id, id))
      .returning();
    return result;
  }

  async deleteSupportPlan(id: string): Promise<void> {
    await db.delete(supportPlans).where(eq(supportPlans.id, id));
  }
}

export const storage = new DatabaseStorage();
