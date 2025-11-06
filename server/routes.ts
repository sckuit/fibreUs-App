// Session-based authentication routes
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { trackVisitor } from "./visitorMiddleware";
import { hashPassword, verifyPassword, generateResetToken } from "./passwordUtils";
import { hasPermission } from "@shared/permissions";
import { getSession } from "./replitAuth";
import { 
  clientInsertServiceRequestSchema, 
  updateServiceRequestSchema, 
  registerSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  changePasswordSchema,
  insertInventoryItemSchema,
  insertInventoryTransactionSchema,
  insertProjectSchema,
  insertProjectCommentSchema,
  insertTicketSchema,
  insertTicketCommentSchema,
  insertTaskSchema,
  updateTaskSchema,
  insertReportSchema,
  updateReportSchema,
  approveReportSchema,
  insertSalesRecordSchema,
  updateSalesRecordSchema,
  insertInquirySchema,
  updateInquirySchema,
  insertLeadSchema,
  updateLeadSchema,
  insertClientSchema,
  updateClientSchema,
  insertSupplierSchema,
  updateSupplierSchema,
  insertSystemConfigSchema,
  updateSystemConfigSchema,
  insertServiceTypeSchema,
  updateServiceTypeSchema,
  insertCompanyCertificationSchema,
  updateCompanyCertificationSchema,
  insertTeamMemberSchema,
  updateTeamMemberSchema,
  insertPriceMatrixSchema,
  updatePriceMatrixSchema,
  insertQuoteSchema,
  updateQuoteSchema,
  insertInvoiceSchema,
  updateInvoiceSchema,
  updateLegalDocumentsSchema,
  insertCustomLegalDocumentSchema,
  updateCustomLegalDocumentSchema,
  insertRateTypeSchema,
  updateRateTypeSchema,
  insertServiceRateSchema,
  updateServiceRateSchema,
  insertSupportPlanSchema,
  updateSupportPlanSchema,
  insertReferralProgramSchema,
  updateReferralProgramSchema,
  insertReferralCodeSchema,
  updateReferralCodeSchema,
  insertReferralSchema,
  updateReferralSchema,
  publicReferralSubmissionSchema,
  insertExpenseSchema,
  updateExpenseSchema,
  insertRevenueSchema,
  updateRevenueSchema,
  type ServiceRequest, 
  type Communication 
} from "@shared/schema";
import { z } from "zod";

// Centralized sanitization functions
function sanitizeServiceRequest(request: ServiceRequest, userRole: string): ServiceRequest {
  if (userRole === 'admin') {
    return request;
  }
  // Remove admin-only fields for non-admin users
  const { adminNotes, ...publicFields } = request;
  return publicFields as ServiceRequest;
}

function sanitizeCommunication(communication: Communication, userRole: string): Communication | null {
  if (userRole === 'admin') {
    return communication;
  }
  // Filter out internal communications for non-admin users
  if (communication.isInternal) {
    return null;
  }
  return communication;
}

function sanitizeCommunications(communications: Communication[], userRole: string): Communication[] {
  return communications
    .map(comm => sanitizeCommunication(comm, userRole))
    .filter((comm): comm is Communication => comm !== null);
}

// Activity logging helper
async function logActivity(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  entityName: string | null,
  details?: string,
  req?: any
) {
  try {
    await storage.logActivity({
      userId: userId || undefined,
      action,
      entityType,
      entityId: entityId || undefined,
      entityName: entityName || undefined,
      details: details || undefined,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('user-agent'),
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw - logging failures shouldn't break operations
  }
}

// Helper to get client/lead IDs for a logged-in user
async function getUserClientLeadIds(userId: string): Promise<{ clientIds: string[], leadIds: string[] }> {
  try {
    const clients = await storage.getClients();
    const leads = await storage.getLeads();
    
    const clientIds = clients
      .filter((client) => client.userId === userId)
      .map((client) => client.id);
    
    const leadIds = leads
      .filter((lead) => lead.userId === userId)
      .map((lead) => lead.id);
    
    return { clientIds, leadIds };
  } catch (error) {
    console.error("Error fetching client/lead IDs:", error);
    return { clientIds: [], leadIds: [] };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware must be configured before any routes that use sessions
  app.use(getSession());

  // Visitor tracking middleware (should be early in the chain)
  app.use(trackVisitor);

  // Middleware to load user from session and attach to req.user
  app.use(async (req: any, res: any, next: any) => {
    if (req.session?.userId) {
      try {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          req.user = user;
        }
      } catch (error) {
        console.error('Error loading user from session:', error);
      }
    }
    next();
  });

  // Session-based authentication middleware (email/password only)
  const isSessionAuthenticated = (req: any, res: any, next: any) => {
    if (req.session?.userId) {
      return next();
    }
    
    return res.status(401).json({ message: "Authentication required" });
  };

  // Auth routes
  app.get('/api/auth/user', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Email/Password Authentication Endpoints
  app.post('/api/auth/register', async (req: any, res) => {
    try {
      // Validate registration data
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }
      
      // Hash the password
      const passwordHash = await hashPassword(validatedData.password);
      
      // Create user with hashed password
      const user = await storage.createUserWithPassword({
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        company: validatedData.company,
      });
      
      // Regenerate session first to prevent session fixation
      req.session.regenerate((err: any) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Session creation failed" });
        }
        
        // Set userId in new session
        req.session.userId = user.id;
        
        // Save session before responding
        req.session.save((saveErr: any) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Session creation failed" });
          }
          
          res.status(201).json({
            message: "User registered successfully",
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
            }
          });
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Registration failed" });
      }
    }
  });

  app.post('/api/auth/login', async (req: any, res) => {
    try {
      // Validate login data
      const validatedData = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ message: "Your account has been deactivated. Please contact an administrator." });
      }
      
      // Verify password
      const isValidPassword = await verifyPassword(user.passwordHash, validatedData.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Regenerate session first to prevent session fixation
      req.session.regenerate((err: any) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Session creation failed" });
        }
        
        // Set userId in new session
        req.session.userId = user.id;
        
        // Save session before responding
        req.session.save(async (saveErr: any) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Session creation failed" });
          }
          
          // Log login activity
          await logActivity(
            user.id,
            'login',
            'user',
            user.id,
            `${user.firstName} ${user.lastName}`,
            `User logged in via email/password`,
            req
          );
          
          res.json({
            message: "Login successful",
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
            }
          });
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid login data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Login failed" });
      }
    }
  });

  app.post('/api/auth/logout', isSessionAuthenticated, async (req: any, res) => {
    const userId = req.session.userId;
    
    // Log logout activity before destroying session
    if (userId) {
      try {
        const user = await storage.getUser(userId);
        if (user) {
          await logActivity(
            userId,
            'logout',
            'user',
            userId,
            `${user.firstName} ${user.lastName}`,
            'User logged out',
            req
          );
        }
      } catch (error) {
        console.error("Failed to log logout activity:", error);
      }
    }
    
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      
      // Clear session cookie with proper security settings
      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      res.json({ message: "Logout successful" });
    });
  });

  app.post('/api/auth/change-password', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
      // Validate change password data
      const validatedData = changePasswordSchema.parse(req.body);
      
      // Get current user
      const user = await storage.getUser(userId);
      if (!user || !user.passwordHash) {
        return res.status(400).json({ message: "Cannot change password for this account" });
      }
      
      // Verify current password
      const isValidPassword = await verifyPassword(user.passwordHash, validatedData.currentPassword);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password and update
      const newPasswordHash = await hashPassword(validatedData.newPassword);
      await storage.setPassword(userId, newPasswordHash);
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid password data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to change password" });
      }
    }
  });

  // Service request routes
  app.post("/api/service-requests", 
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !user.role || !userId) {
          return res.status(401).json({ message: "User not found" });
        }
        
        // Check permission
        if (!hasPermission(user.role, 'createRequests')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        // Validate with client-only schema to prevent privilege escalation
        const validatedData = clientInsertServiceRequestSchema.parse(req.body);
        
        // Construct request data with server-controlled fields
        const requestData = {
          ...validatedData,
          clientId: userId,
          status: 'pending' as const, // Always start as pending
          // Convert number to string for decimal field
          estimatedValue: validatedData.estimatedValue ? validatedData.estimatedValue.toString() : undefined,
          // adminNotes, quotedAmount, scheduledDate, completedDate not allowed for clients
        };
        
        const serviceRequest = await storage.createServiceRequest(requestData);
        res.json(serviceRequest);
      } catch (error) {
        console.error("Error creating service request:", error);
        if (error instanceof z.ZodError) {
          res.status(400).json({ message: "Invalid request data", errors: error.errors });
        } else {
          res.status(500).json({ message: "Failed to create service request" });
        }
      }
    }
  );

  app.get("/api/service-requests", 
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !user.role || !userId) {
          return res.status(401).json({ message: "User not found" });
        }
        
        let requests: Awaited<ReturnType<typeof storage.getServiceRequests>>;
        
        // Get requests based on user role and permissions
        if (user.role === 'admin' || user.role === 'manager') {
          // Admins and managers can view all requests
          requests = await storage.getServiceRequests();
        } else if (user.role === 'client') {
          // Clients can only view their own requests
          requests = await storage.getServiceRequests(userId);
        } else if (user.role === 'employee') {
          // Employees can only view requests for projects they're assigned to
          // For now, return empty array until we implement project assignment filtering
          requests = [];
        } else {
          // Default to client-like behavior for unknown roles
          requests = await storage.getServiceRequests(userId);
        }
        
        // Sanitize requests for non-admin users
        const sanitizedRequests = requests.map(request => 
          sanitizeServiceRequest(request, user.role)
        );
        
        res.json(sanitizedRequests);
      } catch (error) {
        console.error("Error fetching service requests:", error);
        res.status(500).json({ message: "Failed to fetch service requests" });
      }
    }
  );

  app.get("/api/service-requests/:id", 
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !user.role || !userId) {
          return res.status(401).json({ message: "User not found" });
        }
        
        // Check permission
        if (!hasPermission(user.role, 'viewOwnRequests')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const request = await storage.getServiceRequest(id);
        if (!request) {
          return res.status(404).json({ message: "Service request not found" });
        }
        
        // Enforce proper ownership and role-based access
        let hasAccess = false;
        
        if (user.role === 'admin' || user.role === 'manager') {
          // Admins and managers can view all requests
          hasAccess = true;
        } else if (user.role === 'client' && request.clientId === userId) {
          // Clients can only view their own requests
          hasAccess = true;
        } else if (user.role === 'employee') {
          // Employees can view requests for projects they're assigned to
          // For now, deny access until project assignment is implemented
          hasAccess = false;
        }
        
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        // Sanitize request for non-admin users
        const sanitizedRequest = sanitizeServiceRequest(request, user.role);
        
        res.json(sanitizedRequest);
      } catch (error) {
        console.error("Error fetching service request:", error);
        res.status(500).json({ message: "Failed to fetch service request" });
      }
    }
  );

  // Manager/Admin route to update service requests
  app.put("/api/service-requests/:id", 
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !user.role || !userId) {
          return res.status(401).json({ message: "User not found" });
        }
        
        // Check permission
        if (!hasPermission(user.role, 'editAllRequests')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        // Validate and whitelist allowed fields
        const validatedUpdates = updateServiceRequestSchema.parse(req.body);
        
        // Convert number to string for decimal field
        const updates = {
          ...validatedUpdates,
          quotedAmount: validatedUpdates.quotedAmount !== undefined 
            ? validatedUpdates.quotedAmount.toString() 
            : undefined,
        };
        
        const updatedRequest = await storage.updateServiceRequest(id, updates);
        
        if (!updatedRequest) {
          return res.status(404).json({ message: "Service request not found" });
        }
        
        res.json(updatedRequest);
      } catch (error) {
        console.error("Error updating service request:", error);
        if (error instanceof z.ZodError) {
          res.status(400).json({ message: "Invalid update data", errors: error.errors });
        } else {
          res.status(500).json({ message: "Failed to update service request" });
        }
      }
    }
  );

  // Dashboard routes
  app.get("/api/dashboard/client", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const dashboard = await storage.getClientDashboard(userId);
      
      // Sanitize all nested objects to prevent information disclosure
      const sanitizedDashboard = {
        activeRequests: dashboard.activeRequests?.map(request => 
          sanitizeServiceRequest(request, user.role)
        ) || [],
        activeProjects: dashboard.activeProjects || [],
        recentCommunications: sanitizeCommunications(
          dashboard.recentCommunications || [], 
          user.role
        ),
      };
      
      res.json(sanitizedDashboard);
    } catch (error) {
      console.error("Error fetching client dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard" });
    }
  });

  app.get("/api/dashboard/admin", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const dashboard = await storage.getAdminDashboard();
      
      // Admins see all data including admin-only fields
      const sanitizedDashboard = {
        pendingRequests: dashboard.pendingRequests?.map(request => 
          sanitizeServiceRequest(request, 'admin')
        ) || [],
        activeProjects: dashboard.activeProjects || [],
        recentCommunications: sanitizeCommunications(
          dashboard.recentCommunications || [], 
          'admin'
        ),
      };
      
      res.json(sanitizedDashboard);
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Failed to fetch admin dashboard" });
    }
  });

  // System metrics route (admin-only)
  app.get("/api/system/metrics", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const metrics = await storage.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching system metrics:", error);
      res.status(500).json({ message: "Failed to fetch system metrics" });
    }
  });

  // Projects routes
  app.get("/api/projects", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Check if user has permission to view projects
      if (!hasPermission(user.role, 'viewOwnProjects')) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      // If user can view all projects, get all. Otherwise, filter based on role
      if (hasPermission(user.role, 'viewAllProjects')) {
        const projects = await storage.getProjects();
        res.json(projects);
      } else if (user.role === 'employee') {
        // For employees, filter by assignedTechnicianId
        const projects = await storage.getProjects({ assignedTechnicianId: userId });
        res.json(projects);
      } else if (user.role === 'client') {
        // For clients, find their client/lead records and filter projects by those IDs
        const { clientIds, leadIds } = await getUserClientLeadIds(userId);
        const allProjects = await storage.getProjects();
        
        // Filter projects where clientId or leadId matches any of the user's client/lead IDs
        const userProjects = allProjects.filter(project => 
          (project.clientId && clientIds.includes(project.clientId)) ||
          (project.leadId && leadIds.includes(project.leadId))
        );
        
        res.json(userProjects);
      } else {
        // Default: return empty array for other roles without explicit permissions
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Check if user has permission to manage all projects
      if (!hasPermission(user.role, 'manageAllProjects')) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const validatedData = insertProjectSchema.parse(req.body);
      const newProject = await storage.createProject(validatedData);
      res.status(201).json(newProject);
    } catch (error) {
      console.error("Error creating project:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Check if user has permission to manage all projects
      if (!hasPermission(user.role, 'manageAllProjects')) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const projectId = req.params.id;
      const updates = req.body;
      
      // Validate status if provided
      if (updates.status && !['scheduled', 'in_progress', 'completed', 'on_hold', 'cancelled'].includes(updates.status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Convert date strings to Date objects for Drizzle
      const processedUpdates: any = { ...updates };
      
      // Handle startDate conversion
      if ('startDate' in updates) {
        if (typeof updates.startDate === 'string') {
          if (updates.startDate.trim() === '') {
            // Empty string means clear the date
            processedUpdates.startDate = null;
          } else {
            const date = new Date(updates.startDate);
            if (isNaN(date.getTime())) {
              return res.status(400).json({ message: "Invalid start date format" });
            }
            processedUpdates.startDate = date;
          }
        }
      }
      
      // Handle estimatedCompletionDate conversion
      if ('estimatedCompletionDate' in updates) {
        if (typeof updates.estimatedCompletionDate === 'string') {
          if (updates.estimatedCompletionDate.trim() === '') {
            // Empty string means clear the date
            processedUpdates.estimatedCompletionDate = null;
          } else {
            const date = new Date(updates.estimatedCompletionDate);
            if (isNaN(date.getTime())) {
              return res.status(400).json({ message: "Invalid estimated completion date format" });
            }
            processedUpdates.estimatedCompletionDate = date;
          }
        }
      }
      
      const updatedProject = await storage.updateProject(projectId, processedUpdates);
      
      await logActivity(
        userId,
        'update',
        'project',
        projectId,
        updatedProject.projectName,
        undefined,
        req
      );
      
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Client feedback endpoint for projects
  app.post("/api/projects/:id/feedback", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Only clients can submit feedback
      if (user.role !== 'client') {
        return res.status(403).json({ message: "Only clients can submit feedback" });
      }
      
      const projectId = req.params.id;
      const { feedback, rating } = req.body;
      
      // Validate feedback and rating
      if (!feedback || typeof feedback !== 'string' || !feedback.trim()) {
        return res.status(400).json({ message: "Feedback text is required" });
      }
      
      if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      
      // Get the project to verify ownership
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify client owns this project
      const { clientIds, leadIds } = await getUserClientLeadIds(userId);
      const isOwner = (project.clientId && clientIds.includes(project.clientId)) ||
                      (project.leadId && leadIds.includes(project.leadId));
      
      if (!isOwner) {
        return res.status(403).json({ message: "You can only provide feedback for your own projects" });
      }
      
      // Verify project is completed
      if (project.status !== 'completed') {
        return res.status(400).json({ message: "Feedback can only be submitted for completed projects" });
      }
      
      // Update project with feedback
      const updatedProject = await storage.updateProject(projectId, {
        clientFeedback: feedback,
        clientRating: rating,
      });
      
      res.json(updatedProject);
    } catch (error) {
      console.error("Error submitting project feedback:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  // Share project - generate shareable link
  app.post("/api/projects/:id/share",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
        
        const project = await storage.getProject(req.params.id);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Permission check: manageSettings OR assigned technician
        const hasAccess = hasPermission(user.role, 'manageSettings') || project.assignedTechnicianId === userId;
        if (!hasAccess) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        // Generate crypto-random UUID for shareToken
        const crypto = await import('crypto');
        const shareToken = crypto.randomUUID();
        
        // Update project with shareToken and shareTokenCreatedAt
        const updatedProject = await storage.updateProject(req.params.id, {
          shareToken,
          shareTokenCreatedAt: new Date(),
        });
        
        if (!updatedProject) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        await logActivity(
          userId,
          'share',
          'project',
          updatedProject.id,
          updatedProject.projectName,
          'Generated share token',
          req
        );
        
        // Build shareable URL using ticketNumber
        const domain = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',')[0] : 'localhost:5000';
        const protocol = process.env.REPLIT_DOMAINS ? 'https' : 'http';
        const shareUrl = `${protocol}://${domain}/project/${updatedProject.ticketNumber}/${shareToken}`;
        
        res.json({
          token: shareToken,
          projectNumber: updatedProject.ticketNumber,
          shareUrl,
          shareTokenCreatedAt: updatedProject.shareTokenCreatedAt,
        });
      } catch (error) {
        console.error("Error generating share token for project:", error);
        res.status(500).json({ message: "Failed to generate share token" });
      }
    }
  );

  // Get project comments
  app.get("/api/projects/:id/comments", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const projectId = req.params.id;
      
      // Get the project to verify access
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify access permissions
      if (user.role === 'client') {
        const { clientIds, leadIds } = await getUserClientLeadIds(userId);
        const isOwner = (project.clientId && clientIds.includes(project.clientId)) ||
                        (project.leadId && leadIds.includes(project.leadId));
        
        if (!isOwner) {
          return res.status(403).json({ message: "You can only view comments for your own projects" });
        }
      } else {
        // Non-client roles need project view permission (either own or all)
        if (!hasPermission(user.role, 'viewOwnProjects') && !hasPermission(user.role, 'viewAllProjects')) {
          return res.status(403).json({ message: "Permission denied" });
        }
      }
      
      const comments = await storage.getProjectComments(projectId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching project comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Add project comment
  app.post("/api/projects/:id/comments", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const projectId = req.params.id;
      
      // Get the project to verify access
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify access permissions
      if (user.role === 'client') {
        const { clientIds, leadIds } = await getUserClientLeadIds(userId);
        const isOwner = (project.clientId && clientIds.includes(project.clientId)) ||
                        (project.leadId && leadIds.includes(project.leadId));
        
        if (!isOwner) {
          return res.status(403).json({ message: "You can only comment on your own projects" });
        }
      } else {
        // Non-client roles need project management permission
        const canManageAll = hasPermission(user.role, 'manageAllProjects');
        const canManageOwn = hasPermission(user.role, 'manageOwnProjects');
        
        if (!canManageAll && !canManageOwn) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        // For users with only manageOwnProjects, verify they are assigned to this project
        if (!canManageAll && canManageOwn) {
          const isAssigned = project.assignedTechnicianId === userId;
          if (!isAssigned) {
            return res.status(403).json({ message: "You can only comment on projects assigned to you" });
          }
        }
      }
      
      // Validate request body
      const validatedData = insertProjectCommentSchema.parse({
        projectId,
        userId,
        comment: req.body.comment,
      });
      
      const newComment = await storage.createProjectComment(validatedData);
      
      await logActivity(
        userId,
        'create',
        'project_comment',
        newComment.id,
        `Comment on ${project.projectName}`,
        undefined,
        req
      );
      
      res.status(201).json(newComment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating project comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Get all tickets (with role-based filtering)
  app.get("/api/tickets", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Get all tickets first
      const allProjects = await storage.getProjects();
      let accessibleTickets: any[] = [];
      
      // Role-based filtering
      if (user.role === 'client') {
        // Clients can only see tickets for their own projects
        const { clientIds, leadIds } = await getUserClientLeadIds(userId);
        const clientProjects = allProjects.filter(p => 
          (p.clientId && clientIds.includes(p.clientId)) ||
          (p.leadId && leadIds.includes(p.leadId))
        );
        
        for (const project of clientProjects) {
          const tickets = await storage.getTicketsByProject(project.id);
          accessibleTickets.push(...tickets);
        }
      } else if (hasPermission(user.role, 'viewAllProjects')) {
        // Managers, admins, project managers can see all tickets
        for (const project of allProjects) {
          const tickets = await storage.getTicketsByProject(project.id);
          accessibleTickets.push(...tickets);
        }
      } else if (user.role === 'employee') {
        // Employees can only see tickets assigned to them
        for (const project of allProjects) {
          const tickets = await storage.getTicketsByProject(project.id);
          const assignedTickets = tickets.filter(t => t.assignedToId === userId);
          accessibleTickets.push(...assignedTickets);
        }
      } else if (user.role === 'sales') {
        // Sales can see tickets for all projects (they have viewProjects permission)
        for (const project of allProjects) {
          const tickets = await storage.getTicketsByProject(project.id);
          accessibleTickets.push(...tickets);
        }
      } else {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      res.json(accessibleTickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  // Get tickets for a project
  app.get("/api/projects/:projectId/tickets", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const projectId = req.params.projectId;
      
      // Get the project to verify access
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify access permissions (same as project access)
      if (user.role === 'client') {
        const { clientIds, leadIds } = await getUserClientLeadIds(userId);
        const isOwner = (project.clientId && clientIds.includes(project.clientId)) ||
                        (project.leadId && leadIds.includes(project.leadId));
        
        if (!isOwner) {
          return res.status(403).json({ message: "You can only view tickets for your own projects" });
        }
      } else {
        if (!hasPermission(user.role, 'viewProjects')) {
          return res.status(403).json({ message: "Permission denied" });
        }
      }
      
      const tickets = await storage.getTicketsByProject(projectId);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  // Create a new ticket
  app.post("/api/projects/:projectId/tickets", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const projectId = req.params.projectId;
      
      // Get the project to verify access
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Project managers, managers, and admins can create tickets
      const canManageAll = hasPermission(user.role, 'manageAllProjects');
      const canManageOwn = hasPermission(user.role, 'manageOwnProjects');
      
      if (!canManageAll && !canManageOwn) {
        return res.status(403).json({ message: "Permission denied. Only project managers, managers, and admins can create tickets." });
      }
      
      // Validate request body
      const validatedData = insertTicketSchema.parse({
        ...req.body,
        projectId,
        createdById: userId,
      });
      
      const newTicket = await storage.createTicket(validatedData);
      
      await logActivity(
        userId,
        'create',
        'ticket',
        newTicket.id,
        newTicket.title,
        undefined,
        req
      );
      
      res.status(201).json(newTicket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating ticket:", error);
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  // Get a specific ticket
  app.get("/api/tickets/:id", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Get the project to verify access
      const project = await storage.getProject(ticket.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify access permissions
      if (user.role === 'client') {
        const { clientIds, leadIds } = await getUserClientLeadIds(userId);
        const isOwner = (project.clientId && clientIds.includes(project.clientId)) ||
                        (project.leadId && leadIds.includes(project.leadId));
        
        if (!isOwner) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else {
        if (!hasPermission(user.role, 'viewProjects')) {
          return res.status(403).json({ message: "Permission denied" });
        }
      }
      
      res.json(ticket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });

  // Update a ticket
  app.patch("/api/tickets/:id", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Project managers, managers, and admins can update tickets
      const canManageAll = hasPermission(user.role, 'manageAllProjects');
      const canManageOwn = hasPermission(user.role, 'manageOwnProjects');
      
      if (!canManageAll && !canManageOwn) {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const updatedTicket = await storage.updateTicket(req.params.id, req.body);
      
      await logActivity(
        userId,
        'update',
        'ticket',
        updatedTicket.id,
        updatedTicket.title,
        undefined,
        req
      );
      
      res.json(updatedTicket);
    } catch (error) {
      console.error("Error updating ticket:", error);
      res.status(500).json({ message: "Failed to update ticket" });
    }
  });

  // Delete a ticket
  app.delete("/api/tickets/:id", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Only admins and managers can delete tickets
      const canDelete = hasPermission(user.role, 'manageSettings');
      if (!canDelete) {
        return res.status(403).json({ message: "Permission denied. Only managers and admins can delete tickets." });
      }
      
      await storage.deleteTicket(req.params.id);
      
      await logActivity(
        userId,
        'delete',
        'ticket',
        req.params.id,
        ticket.title,
        undefined,
        req
      );
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      res.status(500).json({ message: "Failed to delete ticket" });
    }
  });

  // Get ticket comments
  app.get("/api/tickets/:id/comments", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Get the project to verify access
      const project = await storage.getProject(ticket.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify access permissions
      if (user.role === 'client') {
        const { clientIds, leadIds } = await getUserClientLeadIds(userId);
        const isOwner = (project.clientId && clientIds.includes(project.clientId)) ||
                        (project.leadId && leadIds.includes(project.leadId));
        
        if (!isOwner) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else {
        if (!hasPermission(user.role, 'viewProjects')) {
          return res.status(403).json({ message: "Permission denied" });
        }
      }
      
      const comments = await storage.getTicketComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching ticket comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Add ticket comment (clients and technicians can only comment, not update ticket itself)
  app.post("/api/tickets/:id/comments", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const ticket = await storage.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Get the project to verify access
      const project = await storage.getProject(ticket.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Verify access permissions - clients, technicians, and staff can comment
      if (user.role === 'client') {
        const { clientIds, leadIds } = await getUserClientLeadIds(userId);
        const isOwner = (project.clientId && clientIds.includes(project.clientId)) ||
                        (project.leadId && leadIds.includes(project.leadId));
        
        if (!isOwner) {
          return res.status(403).json({ message: "You can only comment on tickets for your own projects" });
        }
      } else if (user.role === 'employee') {
        // Technicians can comment if they are assigned to the project or the ticket
        const isAssigned = project.assignedTechnicianId === userId || ticket.assignedToId === userId;
        if (!isAssigned) {
          return res.status(403).json({ message: "You can only comment on tickets assigned to you" });
        }
      } else {
        // Managers and admins can always comment
        if (!hasPermission(user.role, 'viewProjects')) {
          return res.status(403).json({ message: "Permission denied" });
        }
      }
      
      // Validate request body
      const validatedData = insertTicketCommentSchema.parse({
        ticketId: req.params.id,
        userId,
        comment: req.body.comment,
      });
      
      const newComment = await storage.createTicketComment(validatedData);
      
      await logActivity(
        userId,
        'create',
        'ticket_comment',
        newComment.id,
        `Comment on ${ticket.title}`,
        undefined,
        req
      );
      
      res.status(201).json(newComment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating ticket comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Share ticket - generate shareable link
  app.post("/api/tickets/:id/share",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
        
        const ticket = await storage.getTicket(req.params.id);
        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }
        
        // Permission check: managers and admins only
        const hasAccess = hasPermission(user.role, 'manageSettings');
        if (!hasAccess) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        // Generate crypto-random UUID for shareToken
        const crypto = await import('crypto');
        const shareToken = crypto.randomUUID();
        
        // Update ticket with shareToken and shareTokenCreatedAt
        const updatedTicket = await storage.updateTicket(req.params.id, {
          shareToken,
          shareTokenCreatedAt: new Date(),
        });
        
        if (!updatedTicket) {
          return res.status(404).json({ message: "Ticket not found" });
        }
        
        await logActivity(
          userId,
          'share',
          'ticket',
          updatedTicket.id,
          updatedTicket.title,
          'Generated share token',
          req
        );
        
        // Build shareable URL using ticketNumber
        const domain = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',')[0] : 'localhost:5000';
        const protocol = process.env.REPLIT_DOMAINS ? 'https' : 'http';
        const shareUrl = `${protocol}://${domain}/ticket/${updatedTicket.ticketNumber}/${shareToken}`;
        
        res.json({
          token: shareToken,
          ticketNumber: updatedTicket.ticketNumber,
          shareUrl,
          shareTokenCreatedAt: updatedTicket.shareTokenCreatedAt,
        });
      } catch (error) {
        console.error("Error generating share token for ticket:", error);
        res.status(500).json({ message: "Failed to generate share token" });
      }
    }
  );

  app.get("/api/technicians", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !user.role || !userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const technicians = await storage.getTechnicians();
      res.json(technicians);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      res.status(500).json({ message: "Failed to fetch technicians" });
    }
  });

  // Visitor analytics routes
  app.get("/api/analytics/visitors", 
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !user.role || !userId) {
          return res.status(401).json({ message: "User not found" });
        }
        
        // Check permission
        if (!hasPermission(user.role, 'viewVisitors')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const analytics = await storage.getVisitorAnalytics();
        res.json(analytics);
      } catch (error) {
        console.error("Error fetching visitor analytics:", error);
        res.status(500).json({ message: "Failed to fetch visitor analytics" });
      }
    }
  );

  app.get("/api/analytics/recent-visitors", 
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !user.role || !userId) {
          return res.status(401).json({ message: "User not found" });
        }
        
        // Check permission
        if (!hasPermission(user.role, 'viewVisitors')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const limit = parseInt(req.query.limit as string) || 50;
        const visitors = await storage.getVisitors(limit);
        res.json(visitors);
      } catch (error) {
        console.error("Error fetching recent visitors:", error);
        res.status(500).json({ message: "Failed to fetch recent visitors" });
      }
    }
  );

  // User management routes (admin only)
  app.get("/api/users", 
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !user.role || !hasPermission(user.role, 'viewUsers')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const users = await storage.getAllUsers();
        res.json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
    }
  );

  app.post("/api/users", 
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !user.role || !hasPermission(user.role, 'manageUsers')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const { email, password, firstName, lastName, phone, company, role } = req.body;
        
        // Check if user already exists
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: "User already exists with this email" });
        }
        
        // Hash the password
        const passwordHash = await hashPassword(password);
        
        // Create user
        const newUser = await storage.createUserWithPassword({
          email,
          passwordHash,
          firstName,
          lastName,
          phone,
          company,
          role,
        });
        
        // Log activity
        await logActivity(
          userId,
          'created',
          'user',
          newUser.id,
          `${newUser.firstName} ${newUser.lastName}`,
          `Created new user with role: ${newUser.role}`,
          req
        );
        
        res.status(201).json(newUser);
      } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  );

  app.put("/api/users/:id", 
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !user.role || !hasPermission(user.role, 'manageUsers')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const targetUserId = req.params.id;
        const updates = req.body;
        
        // If password is being updated, hash it
        if (updates.password) {
          updates.passwordHash = await hashPassword(updates.password);
          delete updates.password;
        }
        
        const updatedUser = await storage.updateUser(targetUserId, updates);
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Log activity
        await logActivity(
          userId,
          'updated',
          'user',
          updatedUser.id,
          `${updatedUser.firstName} ${updatedUser.lastName}`,
          `Updated user information`,
          req
        );
        
        res.json(updatedUser);
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update user" });
      }
    }
  );

  app.patch("/api/users/:id/toggle-status",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !user.role || !hasPermission(user.role, 'manageUsers')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const targetUserId = req.params.id;
        
        // Prevent admin from deactivating themselves
        if (targetUserId === userId) {
          return res.status(400).json({ message: "Cannot deactivate your own account" });
        }
        
        const targetUser = await storage.getUser(targetUserId);
        if (!targetUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const updatedUser = await storage.updateUser(targetUserId, { 
          isActive: !targetUser.isActive 
        });
        
        // Log activity
        await logActivity(
          userId,
          updatedUser?.isActive ? 'activated' : 'deactivated',
          'user',
          targetUserId,
          `${targetUser.firstName} ${targetUser.lastName}`,
          `User status changed to ${updatedUser?.isActive ? 'active' : 'inactive'}`,
          req
        );
        
        res.json(updatedUser);
      } catch (error) {
        console.error("Error toggling user status:", error);
        res.status(500).json({ message: "Failed to toggle user status" });
      }
    }
  );

  app.delete("/api/users/:id", 
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !user.role || !hasPermission(user.role, 'manageUsers')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const targetUserId = req.params.id;
        
        // Prevent admin from deleting themselves
        if (targetUserId === userId) {
          return res.status(400).json({ message: "Cannot delete your own account" });
        }
        
        // Get user info before deleting
        const targetUser = await storage.getUser(targetUserId);
        
        await storage.deleteUser(targetUserId);
        
        // Log activity
        if (targetUser) {
          await logActivity(
            userId,
            'deleted',
            'user',
            targetUserId,
            `${targetUser.firstName} ${targetUser.lastName}`,
            `Deleted user with role: ${targetUser.role}`,
            req
          );
        }
        
        res.json({ message: "User deleted successfully" });
      } catch (error: any) {
        console.error("Error deleting user:", error);
        
        // Handle foreign key constraint violations
        if (error.code === '23503') {
          return res.status(409).json({ 
            message: "Cannot delete user: This user has associated records (tasks, projects, reports, etc.). Consider deactivating the user instead of deleting." 
          });
        }
        
        res.status(500).json({ message: "Failed to delete user" });
      }
    }
  );

  // Inventory Management Routes
  app.get("/api/inventory/items",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'viewInventory')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const includeInactive = req.query.includeInactive === 'true';
        const items = await storage.getInventoryItems(includeInactive);
        res.json(items);
      } catch (error) {
        console.error("Error fetching inventory items:", error);
        res.status(500).json({ message: "Failed to fetch inventory items" });
      }
    }
  );

  app.get("/api/inventory/items/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'viewInventory')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const item = await storage.getInventoryItem(req.params.id);
        if (!item) {
          return res.status(404).json({ message: "Inventory item not found" });
        }
        
        res.json(item);
      } catch (error) {
        console.error("Error fetching inventory item:", error);
        res.status(500).json({ message: "Failed to fetch inventory item" });
      }
    }
  );

  app.post("/api/inventory/items",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !user.role || !['manager', 'admin'].includes(user.role)) {
          return res.status(403).json({ message: "Manager access or higher required" });
        }
        
        // Validate request body
        const validatedData = insertInventoryItemSchema.parse(req.body);
        
        const newItem = await storage.createInventoryItem(validatedData);
        res.status(201).json(newItem);
      } catch (error) {
        console.error("Error creating inventory item:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid inventory item data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to create inventory item" });
      }
    }
  );

  app.put("/api/inventory/items/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !user.role || !['manager', 'admin', 'project_manager'].includes(user.role)) {
          return res.status(403).json({ message: "Manager access or higher required" });
        }
        
        // Validate partial update data - pick only allowed fields
        const allowedUpdates = insertInventoryItemSchema.partial().parse(req.body);
        
        const updatedItem = await storage.updateInventoryItem(req.params.id, allowedUpdates);
        if (!updatedItem) {
          return res.status(404).json({ message: "Inventory item not found" });
        }
        
        res.json(updatedItem);
      } catch (error) {
        console.error("Error updating inventory item:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid inventory item data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update inventory item" });
      }
    }
  );

  app.delete("/api/inventory/items/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !user.role || !hasPermission(user.role, 'manageInventory')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        await storage.deleteInventoryItem(req.params.id);
        res.json({ message: "Inventory item deleted successfully" });
      } catch (error) {
        console.error("Error deleting inventory item:", error);
        res.status(500).json({ message: "Failed to delete inventory item" });
      }
    }
  );

  app.get("/api/inventory/low-stock",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'viewInventory')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const items = await storage.getLowStockItems();
        res.json(items);
      } catch (error) {
        console.error("Error fetching low stock items:", error);
        res.status(500).json({ message: "Failed to fetch low stock items" });
      }
    }
  );

  app.get("/api/inventory/transactions",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'viewInventory')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const itemId = req.query.itemId as string | undefined;
        const projectId = req.query.projectId as string | undefined;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
        
        const transactions = await storage.getInventoryTransactions(itemId, projectId, limit);
        res.json(transactions);
      } catch (error) {
        console.error("Error fetching inventory transactions:", error);
        res.status(500).json({ message: "Failed to fetch inventory transactions" });
      }
    }
  );

  app.post("/api/inventory/transactions",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageInventory')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        // Validate request body but exclude performedById from user input
        const validatedData = insertInventoryTransactionSchema.omit({ performedById: true }).parse(req.body);
        
        // Always use session user ID for performedById (prevent spoofing)
        const transactionData = {
          ...validatedData,
          performedById: userId!,
        };
        
        const newTransaction = await storage.createInventoryTransaction(transactionData);
        res.status(201).json(newTransaction);
      } catch (error) {
        console.error("Error creating inventory transaction:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to create inventory transaction" });
      }
    }
  );

  // Task routes (managers create, employees view assigned)
  app.post("/api/tasks",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageAllTasks')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = insertTaskSchema.parse(req.body);
        const taskData = {
          ...validatedData,
          createdById: userId!,
        };
        
        const newTask = await storage.createTask(taskData);
        res.status(201).json(newTask);
      } catch (error) {
        console.error("Error creating task:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid task data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to create task" });
      }
    }
  );

  app.get("/api/tasks",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        // Check if user has permission to view tasks (either own or all)
        if (!user || !user.role || (!hasPermission(user.role, 'viewOwnTasks') && !hasPermission(user.role, 'viewAllTasks'))) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const filters: any = {};
        if (req.query.assignedToId) filters.assignedToId = req.query.assignedToId as string;
        if (req.query.createdById) filters.createdById = req.query.createdById as string;
        if (req.query.status) filters.status = req.query.status;
        
        // Users with viewOwnTasks (but not viewAllTasks) can only see their own assigned tasks
        if (hasPermission(user.role, 'viewOwnTasks') && !hasPermission(user.role, 'viewAllTasks')) {
          filters.assignedToId = userId!;
        }
        
        const tasks = await storage.getTasks(filters);
        res.json(tasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Failed to fetch tasks" });
      }
    }
  );

  app.get("/api/tasks/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        // Check if user has permission to view tasks (either own or all)
        if (!user || !user.role || (!hasPermission(user.role, 'viewOwnTasks') && !hasPermission(user.role, 'viewAllTasks'))) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const task = await storage.getTask(req.params.id);
        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }
        
        // Users with viewOwnTasks (but not viewAllTasks) can only see their own assigned tasks
        if (hasPermission(user.role, 'viewOwnTasks') && !hasPermission(user.role, 'viewAllTasks') && task.assignedToId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        res.json(task);
      } catch (error) {
        console.error("Error fetching task:", error);
        res.status(500).json({ message: "Failed to fetch task" });
      }
    }
  );

  app.put("/api/tasks/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        // Check if user has permission to manage tasks (either own or all)
        if (!user || !user.role || (!hasPermission(user.role, 'manageOwnTasks') && !hasPermission(user.role, 'manageAllTasks'))) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const task = await storage.getTask(req.params.id);
        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }
        
        // Users with manageOwnTasks (but not manageAllTasks) can only edit their own assigned tasks
        if (hasPermission(user.role, 'manageOwnTasks') && !hasPermission(user.role, 'manageAllTasks') && task.assignedToId !== userId) {
          return res.status(403).json({ message: "Access denied: You can only edit tasks assigned to you" });
        }
        
        const validatedData = updateTaskSchema.parse(req.body);
        const updatedTask = await storage.updateTask(req.params.id, validatedData);
        
        res.json(updatedTask);
      } catch (error) {
        console.error("Error updating task:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid task data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update task" });
      }
    }
  );

  app.delete("/api/tasks/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageAllTasks')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        await storage.deleteTask(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Failed to delete task" });
      }
    }
  );

  // Report routes
  app.post("/api/reports",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageOwnReports')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = insertReportSchema.parse(req.body);
        const reportData = {
          ...validatedData,
          submittedById: userId,
        };
        
        const newReport = await storage.createReport(reportData);
        res.status(201).json(newReport);
      } catch (error) {
        console.error("Error creating report:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid report data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to create report" });
      }
    }
  );

  app.get("/api/reports",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        // Check if user has permission to view reports (either own or all)
        if (!user || !user.role || (!hasPermission(user.role, 'viewOwnReports') && !hasPermission(user.role, 'viewAllReports'))) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const filters: any = {};
        if (req.query.submittedById) filters.submittedById = req.query.submittedById;
        if (req.query.taskId) filters.taskId = req.query.taskId;
        if (req.query.status) filters.status = req.query.status;
        
        // Users with viewOwnReports (but not viewAllReports) can only see their own reports
        if (hasPermission(user.role, 'viewOwnReports') && !hasPermission(user.role, 'viewAllReports')) {
          filters.submittedById = userId;
        }
        
        const reports = await storage.getReports(filters);
        res.json(reports);
      } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ message: "Failed to fetch reports" });
      }
    }
  );

  app.get("/api/reports/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        // Check if user has permission to view reports (either own or all)
        if (!user || !user.role || (!hasPermission(user.role, 'viewOwnReports') && !hasPermission(user.role, 'viewAllReports'))) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const report = await storage.getReport(req.params.id);
        if (!report) {
          return res.status(404).json({ message: "Report not found" });
        }
        
        // Users with viewOwnReports (but not viewAllReports) can only see their own reports
        if (hasPermission(user.role, 'viewOwnReports') && !hasPermission(user.role, 'viewAllReports') && report.submittedById !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        res.json(report);
      } catch (error) {
        console.error("Error fetching report:", error);
        res.status(500).json({ message: "Failed to fetch report" });
      }
    }
  );

  app.put("/api/reports/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        // Check if user has permission to manage reports (either own or all)
        if (!user || !user.role || (!hasPermission(user.role, 'manageOwnReports') && !hasPermission(user.role, 'manageAllReports'))) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const report = await storage.getReport(req.params.id);
        if (!report) {
          return res.status(404).json({ message: "Report not found" });
        }
        
        // Users with manageOwnReports (but not manageAllReports) can only edit their own reports
        if (hasPermission(user.role, 'manageOwnReports') && !hasPermission(user.role, 'manageAllReports') && report.submittedById !== userId) {
          return res.status(403).json({ message: "Access denied: You can only edit reports you submitted" });
        }
        
        const validatedData = updateReportSchema.parse(req.body);
        const updatedReport = await storage.updateReport(req.params.id, validatedData);
        res.json(updatedReport);
      } catch (error) {
        console.error("Error updating report:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid report data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update report" });
      }
    }
  );

  app.delete("/api/reports/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageAllReports')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const report = await storage.getReport(req.params.id);
        if (!report) {
          return res.status(404).json({ message: "Report not found" });
        }
        
        // Employees can only delete their own reports
        if (user.role === 'employee' && report.submittedById !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        await storage.deleteReport(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting report:", error);
        res.status(500).json({ message: "Failed to delete report" });
      }
    }
  );

  app.post("/api/reports/:id/approve",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'approveReports')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const { approved, rejectionReason } = approveReportSchema.parse({ ...req.body, reportId: req.params.id });
        const updatedReport = await storage.approveReport(req.params.id, userId, approved, rejectionReason);
        
        if (!updatedReport) {
          return res.status(404).json({ message: "Report not found" });
        }
        
        res.json(updatedReport);
      } catch (error) {
        console.error("Error approving report:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid approval data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to approve report" });
      }
    }
  );

  // Sales routes
  app.post("/api/sales",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !['sales', 'admin'].includes(user.role)) {
          return res.status(403).json({ message: "Sales access required" });
        }
        
        const validatedData = insertSalesRecordSchema.parse(req.body);
        const newRecord = await storage.createSalesRecord(validatedData);
        res.status(201).json(newRecord);
      } catch (error) {
        console.error("Error creating sales record:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid sales data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to create sales record" });
      }
    }
  );

  app.get("/api/sales",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !['sales', 'admin'].includes(user.role)) {
          return res.status(403).json({ message: "Sales access required" });
        }
        
        const filters: any = {};
        if (req.query.salesRepId) filters.salesRepId = req.query.salesRepId;
        if (req.query.clientId) filters.clientId = req.query.clientId;
        if (req.query.status) filters.status = req.query.status;
        
        // Sales role can only see their own records
        if (user.role === 'sales') {
          filters.salesRepId = userId;
        }
        
        const records = await storage.getSalesRecords(filters);
        res.json(records);
      } catch (error) {
        console.error("Error fetching sales records:", error);
        res.status(500).json({ message: "Failed to fetch sales records" });
      }
    }
  );

  app.get("/api/sales/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !['sales', 'admin'].includes(user.role)) {
          return res.status(403).json({ message: "Sales access required" });
        }
        
        const record = await storage.getSalesRecord(req.params.id);
        if (!record) {
          return res.status(404).json({ message: "Sales record not found" });
        }
        
        // Sales role can only see their own records
        if (user.role === 'sales' && record.salesRepId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        res.json(record);
      } catch (error) {
        console.error("Error fetching sales record:", error);
        res.status(500).json({ message: "Failed to fetch sales record" });
      }
    }
  );

  app.put("/api/sales/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !['sales', 'admin'].includes(user.role)) {
          return res.status(403).json({ message: "Sales access required" });
        }
        
        const record = await storage.getSalesRecord(req.params.id);
        if (!record) {
          return res.status(404).json({ message: "Sales record not found" });
        }
        
        // Sales role can only edit their own records
        if (user.role === 'sales' && record.salesRepId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        const validatedData = updateSalesRecordSchema.parse(req.body);
        const updatedRecord = await storage.updateSalesRecord(req.params.id, validatedData);
        res.json(updatedRecord);
      } catch (error) {
        console.error("Error updating sales record:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid sales data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update sales record" });
      }
    }
  );

  app.delete("/api/sales/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !['sales', 'admin'].includes(user.role)) {
          return res.status(403).json({ message: "Sales access required" });
        }
        
        const record = await storage.getSalesRecord(req.params.id);
        if (!record) {
          return res.status(404).json({ message: "Sales record not found" });
        }
        
        // Sales role can only delete their own records
        if (user.role === 'sales' && record.salesRepId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        await storage.deleteSalesRecord(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting sales record:", error);
        res.status(500).json({ message: "Failed to delete sales record" });
      }
    }
  );

  // Financial logs routes (admin read-only)
  app.get("/api/financial-logs",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !user.role || !hasPermission(user.role, 'viewFinancial')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const filters: any = {};
        if (req.query.entityType) filters.entityType = req.query.entityType;
        if (req.query.userId) filters.userId = req.query.userId;
        if (req.query.logType) filters.logType = req.query.logType;
        if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
        
        const logs = await storage.getFinancialLogs(filters);
        res.json(logs);
      } catch (error) {
        console.error("Error fetching financial logs:", error);
        res.status(500).json({ message: "Failed to fetch financial logs" });
      }
    }
  );

  // Activity logs routes (admin read-only for audit trail)
  app.get("/api/activities",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !user.role || !hasPermission(user.role, 'viewActivities')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const filters: any = {};
        if (req.query.userId) filters.userId = req.query.userId;
        if (req.query.entityType) filters.entityType = req.query.entityType;
        if (req.query.action) filters.action = req.query.action;
        if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
        
        const activities = await storage.getActivities(filters);
        res.json(activities);
      } catch (error) {
        console.error("Error fetching activities:", error);
        res.status(500).json({ message: "Failed to fetch activities" });
      }
    }
  );

  // Inquiry routes (quote requests and contact forms - public POST, sales/admin GET/UPDATE)
  app.post("/api/inquiries", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      }
      console.error("Error creating inquiry:", error);
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  app.get("/api/inquiries",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'viewAllMessages')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const filters: any = {};
        if (req.query.type) filters.type = req.query.type;
        if (req.query.status) filters.status = req.query.status;
        if (req.query.assignedToId) filters.assignedToId = req.query.assignedToId;
        
        const inquiries = await storage.getInquiries(filters);
        res.json(inquiries);
      } catch (error) {
        console.error("Error fetching inquiries:", error);
        res.status(500).json({ message: "Failed to fetch inquiries" });
      }
    }
  );

  app.get("/api/inquiries/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'viewAllMessages')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const inquiry = await storage.getInquiry(req.params.id);
        if (!inquiry) {
          return res.status(404).json({ message: "Inquiry not found" });
        }
        
        res.json(inquiry);
      } catch (error) {
        console.error("Error fetching inquiry:", error);
        res.status(500).json({ message: "Failed to fetch inquiry" });
      }
    }
  );

  app.patch("/api/inquiries/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageMessages')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = updateInquirySchema.parse(req.body);
        const inquiry = await storage.updateInquiry(req.params.id, validatedData);
        
        if (!inquiry) {
          return res.status(404).json({ message: "Inquiry not found" });
        }
        
        res.json(inquiry);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid update data", errors: error.errors });
        }
        console.error("Error updating inquiry:", error);
        res.status(500).json({ message: "Failed to update inquiry" });
      }
    }
  );

  app.delete("/api/inquiries/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageMessages')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        await storage.deleteInquiry(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting inquiry:", error);
        res.status(500).json({ message: "Failed to delete inquiry" });
      }
    }
  );

  // ===== Lead Routes (CRM) =====
  app.post("/api/leads",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageLeads')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = insertLeadSchema.parse(req.body);
        const lead = await storage.createLead({
          ...validatedData,
          assignedToId: validatedData.assignedToId || userId,
        });
        
        res.status(201).json(lead);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
        }
        console.error("Error creating lead:", error);
        res.status(500).json({ message: "Failed to create lead" });
      }
    }
  );

  app.post("/api/leads/convert-from-inquiry/:inquiryId",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageLeads')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const lead = await storage.convertInquiryToLead(req.params.inquiryId, userId);
        res.status(201).json(lead);
      } catch (error) {
        if (error instanceof Error && error.message === 'Inquiry not found') {
          return res.status(404).json({ message: "Inquiry not found" });
        }
        if (error instanceof Error && error.message === 'Inquiry already converted to lead') {
          return res.status(400).json({ message: "Inquiry already converted to lead" });
        }
        console.error("Error converting inquiry to lead:", error);
        res.status(500).json({ message: "Failed to convert inquiry to lead" });
      }
    }
  );

  app.get("/api/leads",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'viewLeads')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const filters: any = {};
        if (req.query.source) filters.source = req.query.source;
        if (req.query.status) filters.status = req.query.status;
        if (req.query.assignedToId) filters.assignedToId = req.query.assignedToId;
        
        const leads = await storage.getLeads(filters);
        res.json(leads);
      } catch (error) {
        console.error("Error fetching leads:", error);
        res.status(500).json({ message: "Failed to fetch leads" });
      }
    }
  );

  app.get("/api/leads/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'viewLeads')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const lead = await storage.getLead(req.params.id);
        
        if (!lead) {
          return res.status(404).json({ message: "Lead not found" });
        }
        
        res.json(lead);
      } catch (error) {
        console.error("Error fetching lead:", error);
        res.status(500).json({ message: "Failed to fetch lead" });
      }
    }
  );

  app.patch("/api/leads/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageLeads')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = updateLeadSchema.parse(req.body);
        const lead = await storage.updateLead(req.params.id, validatedData);
        
        if (!lead) {
          return res.status(404).json({ message: "Lead not found" });
        }
        
        res.json(lead);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid update data", errors: error.errors });
        }
        console.error("Error updating lead:", error);
        res.status(500).json({ message: "Failed to update lead" });
      }
    }
  );

  app.delete("/api/leads/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageLeads')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        await storage.deleteLead(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting lead:", error);
        res.status(500).json({ message: "Failed to delete lead" });
      }
    }
  );

  // ===== Client Routes (CRM) =====
  app.post("/api/clients",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageClients')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = insertClientSchema.parse(req.body);
        const client = await storage.createClient(validatedData);
        
        res.status(201).json(client);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid client data", errors: error.errors });
        }
        console.error("Error creating client:", error);
        res.status(500).json({ message: "Failed to create client" });
      }
    }
  );

  app.post("/api/clients/convert-from-lead/:leadId",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageLeads')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const { accountManagerId, ...additionalData } = req.body;
        const client = await storage.convertLeadToClient(
          req.params.leadId, 
          accountManagerId || userId,
          additionalData
        );
        res.status(201).json(client);
      } catch (error) {
        if (error instanceof Error && error.message === 'Lead not found') {
          return res.status(404).json({ message: "Lead not found" });
        }
        if (error instanceof Error && error.message === 'Lead already converted to client') {
          return res.status(400).json({ message: "Lead already converted to client" });
        }
        console.error("Error converting lead to client:", error);
        res.status(500).json({ message: "Failed to convert lead to client" });
      }
    }
  );

  app.get("/api/clients",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'viewClients')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const filters: any = {};
        if (req.query.status) filters.status = req.query.status;
        if (req.query.accountManagerId) filters.accountManagerId = req.query.accountManagerId;
        
        const clients = await storage.getClients(filters);
        res.json(clients);
      } catch (error) {
        console.error("Error fetching clients:", error);
        res.status(500).json({ message: "Failed to fetch clients" });
      }
    }
  );

  app.get("/api/clients/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'viewClients')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const client = await storage.getClient(req.params.id);
        
        if (!client) {
          return res.status(404).json({ message: "Client not found" });
        }
        
        res.json(client);
      } catch (error) {
        console.error("Error fetching client:", error);
        res.status(500).json({ message: "Failed to fetch client" });
      }
    }
  );

  app.patch("/api/clients/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageClients')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = updateClientSchema.parse(req.body);
        const client = await storage.updateClient(req.params.id, validatedData);
        
        if (!client) {
          return res.status(404).json({ message: "Client not found" });
        }
        
        res.json(client);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid update data", errors: error.errors });
        }
        console.error("Error updating client:", error);
        res.status(500).json({ message: "Failed to update client" });
      }
    }
  );

  app.delete("/api/clients/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageClients')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        await storage.deleteClient(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting client:", error);
        res.status(500).json({ message: "Failed to delete client" });
      }
    }
  );

  // ===== Supplier Routes (Vendors, Suppliers, Partners) =====
  app.post("/api/suppliers",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSuppliers')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = insertSupplierSchema.parse(req.body);
        const supplier = await storage.createSupplier(validatedData);
        
        res.status(201).json(supplier);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
        }
        console.error("Error creating supplier:", error);
        res.status(500).json({ message: "Failed to create supplier" });
      }
    }
  );

  app.get("/api/suppliers",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'viewSuppliers')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const filters: any = {};
        if (req.query.type) filters.type = req.query.type;
        if (req.query.status) filters.status = req.query.status;
        
        const suppliers = await storage.getSuppliers(filters);
        res.json(suppliers);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        res.status(500).json({ message: "Failed to fetch suppliers" });
      }
    }
  );

  app.get("/api/suppliers/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'viewSuppliers')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const supplier = await storage.getSupplier(req.params.id);
        if (!supplier) {
          return res.status(404).json({ message: "Supplier not found" });
        }
        
        res.json(supplier);
      } catch (error) {
        console.error("Error fetching supplier:", error);
        res.status(500).json({ message: "Failed to fetch supplier" });
      }
    }
  );

  app.patch("/api/suppliers/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSuppliers')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = updateSupplierSchema.parse(req.body);
        const supplier = await storage.updateSupplier(req.params.id, validatedData);
        
        if (!supplier) {
          return res.status(404).json({ message: "Supplier not found" });
        }
        
        res.json(supplier);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid update data", errors: error.errors });
        }
        console.error("Error updating supplier:", error);
        res.status(500).json({ message: "Failed to update supplier" });
      }
    }
  );

  app.delete("/api/suppliers/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSuppliers')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        await storage.deleteSupplier(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting supplier:", error);
        res.status(500).json({ message: "Failed to delete supplier" });
      }
    }
  );

  // System Configuration routes
  // Public endpoint - no authentication required for viewing company config
  app.get("/api/system-config",
    async (req: any, res) => {
      try {
        const config = await storage.getSystemConfig();
        res.json(config || {});
      } catch (error) {
        console.error("Error getting system config:", error);
        res.status(500).json({ message: "Failed to get system configuration" });
      }
    }
  );

  app.put("/api/system-config",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = updateSystemConfigSchema.parse(req.body);
        const config = await storage.updateSystemConfig(validatedData);
        res.json(config);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid configuration data", errors: error.errors });
        }
        console.error("Error updating system config:", error);
        res.status(500).json({ message: "Failed to update system configuration" });
      }
    }
  );

  // Legal Documents routes
  app.get("/api/legal-documents",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const docs = await storage.getLegalDocuments();
        res.json(docs || {});
      } catch (error) {
        console.error("Error getting legal documents:", error);
        res.status(500).json({ message: "Failed to get legal documents" });
      }
    }
  );

  app.put("/api/legal-documents",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = updateLegalDocumentsSchema.parse(req.body);
        const docs = await storage.updateLegalDocuments(validatedData);
        res.json(docs);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid legal documents data", errors: error.errors });
        }
        console.error("Error updating legal documents:", error);
        res.status(500).json({ message: "Failed to update legal documents" });
      }
    }
  );

  // Custom Legal Documents routes
  app.post("/api/custom-legal-documents",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = insertCustomLegalDocumentSchema.parse(req.body);
        const doc = await storage.createCustomLegalDocument(validatedData);
        res.status(201).json(doc);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid custom legal document data", errors: error.errors });
        }
        console.error("Error creating custom legal document:", error);
        res.status(500).json({ message: "Failed to create custom legal document" });
      }
    }
  );

  app.get("/api/custom-legal-documents",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const docs = await storage.getCustomLegalDocuments();
        res.json(docs);
      } catch (error) {
        console.error("Error getting custom legal documents:", error);
        res.status(500).json({ message: "Failed to get custom legal documents" });
      }
    }
  );

  app.get("/api/custom-legal-documents/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const doc = await storage.getCustomLegalDocument(req.params.id);
        if (!doc) {
          return res.status(404).json({ message: "Custom legal document not found" });
        }
        res.json(doc);
      } catch (error) {
        console.error("Error getting custom legal document:", error);
        res.status(500).json({ message: "Failed to get custom legal document" });
      }
    }
  );

  app.put("/api/custom-legal-documents/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = updateCustomLegalDocumentSchema.parse(req.body);
        const doc = await storage.updateCustomLegalDocument(req.params.id, validatedData);
        if (!doc) {
          return res.status(404).json({ message: "Custom legal document not found" });
        }
        res.json(doc);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid custom legal document data", errors: error.errors });
        }
        console.error("Error updating custom legal document:", error);
        res.status(500).json({ message: "Failed to update custom legal document" });
      }
    }
  );

  app.delete("/api/custom-legal-documents/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        await storage.deleteCustomLegalDocument(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting custom legal document:", error);
        res.status(500).json({ message: "Failed to delete custom legal document" });
      }
    }
  );

  // Rate Types routes
  app.post("/api/rate-types",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = insertRateTypeSchema.parse(req.body);
        const rateType = await storage.createRateType(validatedData);
        res.status(201).json(rateType);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid rate type data", errors: error.errors });
        }
        console.error("Error creating rate type:", error);
        res.status(500).json({ message: "Failed to create rate type" });
      }
    }
  );

  app.get("/api/rate-types",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const rateTypes = await storage.getRateTypes();
        res.json(rateTypes);
      } catch (error) {
        console.error("Error getting rate types:", error);
        res.status(500).json({ message: "Failed to get rate types" });
      }
    }
  );

  app.put("/api/rate-types/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = updateRateTypeSchema.parse(req.body);
        const rateType = await storage.updateRateType(req.params.id, validatedData);
        if (!rateType) {
          return res.status(404).json({ message: "Rate type not found" });
        }
        res.json(rateType);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid rate type data", errors: error.errors });
        }
        console.error("Error updating rate type:", error);
        res.status(500).json({ message: "Failed to update rate type" });
      }
    }
  );

  app.delete("/api/rate-types/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        await storage.deleteRateType(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting rate type:", error);
        res.status(500).json({ message: "Failed to delete rate type" });
      }
    }
  );

  // Service Rates routes
  app.post("/api/service-rates",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = insertServiceRateSchema.parse(req.body);
        const serviceRate = await storage.createServiceRate(validatedData);
        res.status(201).json(serviceRate);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid service rate data", errors: error.errors });
        }
        console.error("Error creating service rate:", error);
        res.status(500).json({ message: "Failed to create service rate" });
      }
    }
  );

  app.get("/api/service-rates",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const serviceRates = await storage.getServiceRates();
        res.json(serviceRates);
      } catch (error) {
        console.error("Error getting service rates:", error);
        res.status(500).json({ message: "Failed to get service rates" });
      }
    }
  );

  app.put("/api/service-rates/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = updateServiceRateSchema.parse(req.body);
        const serviceRate = await storage.updateServiceRate(req.params.id, validatedData);
        if (!serviceRate) {
          return res.status(404).json({ message: "Service rate not found" });
        }
        res.json(serviceRate);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid service rate data", errors: error.errors });
        }
        console.error("Error updating service rate:", error);
        res.status(500).json({ message: "Failed to update service rate" });
      }
    }
  );

  app.delete("/api/service-rates/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        await storage.deleteServiceRate(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting service rate:", error);
        res.status(500).json({ message: "Failed to delete service rate" });
      }
    }
  );

  // Support Plans routes
  app.post("/api/support-plans",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = insertSupportPlanSchema.parse(req.body);
        const supportPlan = await storage.createSupportPlan(validatedData);
        res.status(201).json(supportPlan);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid support plan data", errors: error.errors });
        }
        console.error("Error creating support plan:", error);
        res.status(500).json({ message: "Failed to create support plan" });
      }
    }
  );

  app.get("/api/support-plans",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const supportPlans = await storage.getSupportPlans();
        res.json(supportPlans);
      } catch (error) {
        console.error("Error getting support plans:", error);
        res.status(500).json({ message: "Failed to get support plans" });
      }
    }
  );

  app.put("/api/support-plans/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = updateSupportPlanSchema.parse(req.body);
        const supportPlan = await storage.updateSupportPlan(req.params.id, validatedData);
        if (!supportPlan) {
          return res.status(404).json({ message: "Support plan not found" });
        }
        res.json(supportPlan);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid support plan data", errors: error.errors });
        }
        console.error("Error updating support plan:", error);
        res.status(500).json({ message: "Failed to update support plan" });
      }
    }
  );

  app.delete("/api/support-plans/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        await storage.deleteSupportPlan(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting support plan:", error);
        res.status(500).json({ message: "Failed to delete support plan" });
      }
    }
  );

  // Referral Program routes
  app.post("/api/referral-programs",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = insertReferralProgramSchema.parse(req.body);
        const referralProgram = await storage.createReferralProgram(validatedData);
        res.status(201).json(referralProgram);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid referral program data", errors: error.errors });
        }
        console.error("Error creating referral program:", error);
        res.status(500).json({ message: "Failed to create referral program" });
      }
    }
  );

  app.get("/api/referral-programs",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const referralPrograms = await storage.getReferralPrograms();
        res.json(referralPrograms);
      } catch (error) {
        console.error("Error getting referral programs:", error);
        res.status(500).json({ message: "Failed to get referral programs" });
      }
    }
  );

  app.get("/api/referral-programs/active",
    async (req: any, res) => {
      try {
        const referralPrograms = await storage.getActiveReferralPrograms();
        res.json(referralPrograms);
      } catch (error) {
        console.error("Error getting active referral programs:", error);
        res.status(500).json({ message: "Failed to get active referral programs" });
      }
    }
  );

  app.get("/api/referral-programs/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const referralProgram = await storage.getReferralProgramById(req.params.id);
        if (!referralProgram) {
          return res.status(404).json({ message: "Referral program not found" });
        }
        res.json(referralProgram);
      } catch (error) {
        console.error("Error getting referral program:", error);
        res.status(500).json({ message: "Failed to get referral program" });
      }
    }
  );

  app.put("/api/referral-programs/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = updateReferralProgramSchema.parse(req.body);
        const referralProgram = await storage.updateReferralProgram(req.params.id, validatedData);
        if (!referralProgram) {
          return res.status(404).json({ message: "Referral program not found" });
        }
        res.json(referralProgram);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid referral program data", errors: error.errors });
        }
        console.error("Error updating referral program:", error);
        res.status(500).json({ message: "Failed to update referral program" });
      }
    }
  );

  app.delete("/api/referral-programs/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        await storage.deleteReferralProgram(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting referral program:", error);
        res.status(500).json({ message: "Failed to delete referral program" });
      }
    }
  );

  // Public referral submission route (no authentication required)
  app.post("/api/referrals/submit-public",
    async (req: any, res) => {
      try {
        // Validate the submission data
        const validatedData = publicReferralSubmissionSchema.parse(req.body);
        
        // Create a lead with source='referral'
        const lead = await storage.createLead({
          source: 'referral',
          name: validatedData.referredName,
          email: validatedData.referredEmail,
          phone: validatedData.referredPhone || '',
          company: validatedData.referredCompany,
          status: 'new',
        });
        
        // Create a referral record linked to the created lead
        const referral = await storage.createReferral({
          referralProgramId: validatedData.referralProgramId,
          referrerName: validatedData.referrerName,
          referrerEmail: validatedData.referrerEmail,
          referrerPhone: validatedData.referrerPhone,
          referredName: validatedData.referredName,
          referredEmail: validatedData.referredEmail,
          referredPhone: validatedData.referredPhone,
          referredCompany: validatedData.referredCompany,
          convertedLeadId: lead.id,
          status: 'pending',
        });
        
        res.status(201).json({ lead, referral });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            message: "Invalid referral submission data", 
            errors: error.errors 
          });
        }
        console.error("Error creating referral submission:", error);
        res.status(500).json({ message: "Failed to create referral submission" });
      }
    }
  );

  // Service Types routes
  app.post("/api/service-types",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = insertServiceTypeSchema.parse(req.body);
        const serviceType = await storage.createServiceType(validatedData);
        res.status(201).json(serviceType);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid service type data", errors: error.errors });
        }
        console.error("Error creating service type:", error);
        res.status(500).json({ message: "Failed to create service type" });
      }
    }
  );

  app.get("/api/service-types",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const includeInactive = req.query.includeInactive === 'true';
        const serviceTypes = await storage.getServiceTypes(includeInactive);
        res.json(serviceTypes);
      } catch (error) {
        console.error("Error getting service types:", error);
        res.status(500).json({ message: "Failed to get service types" });
      }
    }
  );

  app.get("/api/service-types/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const serviceType = await storage.getServiceType(req.params.id);
        if (!serviceType) {
          return res.status(404).json({ message: "Service type not found" });
        }
        res.json(serviceType);
      } catch (error) {
        console.error("Error getting service type:", error);
        res.status(500).json({ message: "Failed to get service type" });
      }
    }
  );

  app.patch("/api/service-types/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = updateServiceTypeSchema.parse(req.body);
        const serviceType = await storage.updateServiceType(req.params.id, validatedData);
        if (!serviceType) {
          return res.status(404).json({ message: "Service type not found" });
        }
        res.json(serviceType);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid update data", errors: error.errors });
        }
        console.error("Error updating service type:", error);
        res.status(500).json({ message: "Failed to update service type" });
      }
    }
  );

  app.delete("/api/service-types/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        await storage.deleteServiceType(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting service type:", error);
        res.status(500).json({ message: "Failed to delete service type" });
      }
    }
  );

  // Company Certifications routes
  app.get("/api/certifications", async (req: any, res) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const certifications = await storage.getCompanyCertifications(includeInactive);
      res.json(certifications);
    } catch (error) {
      console.error("Error getting certifications:", error);
      res.status(500).json({ message: "Failed to get certifications" });
    }
  });

  app.post("/api/certifications",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = insertCompanyCertificationSchema.parse(req.body);
        const certification = await storage.createCompanyCertification(validatedData);
        res.status(201).json(certification);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid certification data", errors: error.errors });
        }
        console.error("Error creating certification:", error);
        res.status(500).json({ message: "Failed to create certification" });
      }
    }
  );

  app.patch("/api/certifications/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = updateCompanyCertificationSchema.parse(req.body);
        const certification = await storage.updateCompanyCertification(req.params.id, validatedData);
        if (!certification) {
          return res.status(404).json({ message: "Certification not found" });
        }
        res.json(certification);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid update data", errors: error.errors });
        }
        console.error("Error updating certification:", error);
        res.status(500).json({ message: "Failed to update certification" });
      }
    }
  );

  app.delete("/api/certifications/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        await storage.deleteCompanyCertification(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting certification:", error);
        res.status(500).json({ message: "Failed to delete certification" });
      }
    }
  );

  // Team Members routes
  app.get("/api/team-members", async (req: any, res) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const teamMembers = await storage.getTeamMembers(includeInactive);
      res.json(teamMembers);
    } catch (error) {
      console.error("Error getting team members:", error);
      res.status(500).json({ message: "Failed to get team members" });
    }
  });

  app.post("/api/team-members",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = insertTeamMemberSchema.parse(req.body);
        const teamMember = await storage.createTeamMember(validatedData);
        res.status(201).json(teamMember);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid team member data", errors: error.errors });
        }
        console.error("Error creating team member:", error);
        res.status(500).json({ message: "Failed to create team member" });
      }
    }
  );

  app.patch("/api/team-members/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validatedData = updateTeamMemberSchema.parse(req.body);
        const teamMember = await storage.updateTeamMember(req.params.id, validatedData);
        if (!teamMember) {
          return res.status(404).json({ message: "Team member not found" });
        }
        res.json(teamMember);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid update data", errors: error.errors });
        }
        console.error("Error updating team member:", error);
        res.status(500).json({ message: "Failed to update team member" });
      }
    }
  );

  app.delete("/api/team-members/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        await storage.deleteTeamMember(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting team member:", error);
        res.status(500).json({ message: "Failed to delete team member" });
      }
    }
  );

  // Price Matrix routes
  // Get all price matrix items (for settings/management tab)
  app.get("/api/price-matrix",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        // Only admins with manageSettings can view all items
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const items = await storage.getPriceMatrixItems(true); // Always include inactive
        res.json(items);
      } catch (error) {
        console.error("Error fetching price matrix items:", error);
        res.status(500).json({ message: "Failed to fetch price matrix items" });
      }
    }
  );

  // Get only active price matrix items (for quote/invoice building)
  app.get("/api/price-matrix/active",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        // Sales users and admins can view active items for quotes/invoices
        if (!user || !(hasPermission(user.role, 'manageFinancial') || hasPermission(user.role, 'manageSettings'))) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const items = await storage.getPriceMatrixItems(false); // Only active items
        res.json(items);
      } catch (error) {
        console.error("Error fetching active price matrix items:", error);
        res.status(500).json({ message: "Failed to fetch active price matrix items" });
      }
    }
  );

  app.post("/api/price-matrix",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validated = insertPriceMatrixSchema.parse(req.body);
        const newItem = await storage.createPriceMatrixItem(validated);
        
        await logActivity(
          userId,
          'create',
          'price_matrix',
          newItem.id,
          newItem.item,
          undefined,
          req
        );
        
        res.status(201).json(newItem);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid price matrix data", errors: error.errors });
        }
        console.error("Error creating price matrix item:", error);
        res.status(500).json({ message: "Failed to create price matrix item" });
      }
    }
  );

  app.put("/api/price-matrix/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validated = updatePriceMatrixSchema.parse(req.body);
        const updatedItem = await storage.updatePriceMatrixItem(req.params.id, validated);
        
        if (!updatedItem) {
          return res.status(404).json({ message: "Price matrix item not found" });
        }
        
        await logActivity(
          userId,
          'update',
          'price_matrix',
          updatedItem.id,
          updatedItem.item,
          undefined,
          req
        );
        
        res.json(updatedItem);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid update data", errors: error.errors });
        }
        console.error("Error updating price matrix item:", error);
        res.status(500).json({ message: "Failed to update price matrix item" });
      }
    }
  );

  app.delete("/api/price-matrix/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        await storage.deletePriceMatrixItem(req.params.id);
        
        await logActivity(
          userId,
          'delete',
          'price_matrix',
          req.params.id,
          null,
          undefined,
          req
        );
        
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting price matrix item:", error);
        res.status(500).json({ message: "Failed to delete price matrix item" });
      }
    }
  );

  // Quotes routes
  app.get("/api/quotes",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !userId) {
          return res.status(401).json({ message: "User not found" });
        }
        
        // Client users can view their own quotes
        if (user.role === 'client') {
          // Find client/lead records for this user and filter quotes
          const { clientIds, leadIds } = await getUserClientLeadIds(userId);
          const allQuotes = await storage.getQuotes();
          
          // Filter quotes where clientId or leadId matches any of the user's IDs
          const userQuotes = allQuotes.filter(quote => 
            (quote.clientId && clientIds.includes(quote.clientId)) ||
            (quote.leadId && leadIds.includes(quote.leadId))
          );
          
          return res.json(userQuotes);
        }
        
        // Other roles need viewLeads permission to see all quotes
        if (!hasPermission(user.role, 'viewLeads')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const quotes = await storage.getQuotes();
        res.json(quotes);
      } catch (error) {
        console.error("Error fetching quotes:", error);
        res.status(500).json({ message: "Failed to fetch quotes" });
      }
    }
  );

  app.get("/api/quotes/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
        
        const quote = await storage.getQuote(req.params.id);
        if (!quote) {
          return res.status(404).json({ message: "Quote not found" });
        }
        
        // Permission check: manageSettings OR createdById matches current user
        const hasAccess = hasPermission(user.role, 'manageSettings') || quote.createdById === userId;
        if (!hasAccess) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        res.json(quote);
      } catch (error) {
        console.error("Error fetching quote:", error);
        res.status(500).json({ message: "Failed to fetch quote" });
      }
    }
  );

  app.post("/api/quotes",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageLeads')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validated = insertQuoteSchema.parse({
          ...req.body,
          createdById: userId
        });

        // Convert validUntil from string to Date if present
        const quoteData: any = {
          ...validated,
        };
        if (validated.validUntil) {
          quoteData.validUntil = new Date(validated.validUntil);
        }
        
        const newQuote = await storage.createQuote(quoteData);
        
        await logActivity(
          userId,
          'create',
          'quote',
          newQuote.id,
          newQuote.quoteNumber,
          undefined,
          req
        );
        
        res.status(201).json(newQuote);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid quote data", errors: error.errors });
        }
        console.error("Error creating quote:", error);
        res.status(500).json({ message: "Failed to create quote" });
      }
    }
  );

  app.put("/api/quotes/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageLeads')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validated = updateQuoteSchema.parse(req.body);
        const updatedQuote = await storage.updateQuote(req.params.id, validated);
        
        if (!updatedQuote) {
          return res.status(404).json({ message: "Quote not found" });
        }
        
        await logActivity(
          userId,
          'update',
          'quote',
          updatedQuote.id,
          updatedQuote.quoteNumber,
          undefined,
          req
        );
        
        res.json(updatedQuote);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid update data", errors: error.errors });
        }
        console.error("Error updating quote:", error);
        res.status(500).json({ message: "Failed to update quote" });
      }
    }
  );

  app.patch("/api/quotes/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
        
        const quote = await storage.getQuote(req.params.id);
        if (!quote) {
          return res.status(404).json({ message: "Quote not found" });
        }
        
        // Permission check: manageSettings OR createdById matches current user
        const hasAccess = hasPermission(user.role, 'manageSettings') || quote.createdById === userId;
        if (!hasAccess) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validated = updateQuoteSchema.parse(req.body);
        const updatedQuote = await storage.updateQuote(req.params.id, validated);
        
        if (!updatedQuote) {
          return res.status(404).json({ message: "Quote not found" });
        }
        
        await logActivity(
          userId,
          'update',
          'quote',
          updatedQuote.id,
          updatedQuote.quoteNumber,
          undefined,
          req
        );
        
        res.json(updatedQuote);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid update data", errors: error.errors });
        }
        console.error("Error updating quote:", error);
        res.status(500).json({ message: "Failed to update quote" });
      }
    }
  );

  app.delete("/api/quotes/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageLeads')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        await storage.deleteQuote(req.params.id);
        
        await logActivity(
          userId,
          'delete',
          'quote',
          req.params.id,
          null,
          undefined,
          req
        );
        
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting quote:", error);
        res.status(500).json({ message: "Failed to delete quote" });
      }
    }
  );

  app.post("/api/quotes/:id/share",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
        
        const quote = await storage.getQuote(req.params.id);
        if (!quote) {
          return res.status(404).json({ message: "Quote not found" });
        }
        
        // Permission check: manageSettings OR createdById matches current user
        const hasAccess = hasPermission(user.role, 'manageSettings') || quote.createdById === userId;
        if (!hasAccess) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        // Generate crypto-random UUID for shareToken
        const crypto = await import('crypto');
        const shareToken = crypto.randomUUID();
        
        // Update quote with shareToken and shareTokenCreatedAt
        const updatedQuote = await storage.updateQuote(req.params.id, {
          shareToken,
          shareTokenCreatedAt: new Date(),
        });
        
        if (!updatedQuote) {
          return res.status(404).json({ message: "Quote not found" });
        }
        
        await logActivity(
          userId,
          'share',
          'quote',
          updatedQuote.id,
          updatedQuote.quoteNumber,
          'Generated share token',
          req
        );
        
        // Build shareable URL
        const domain = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',')[0] : 'localhost:5000';
        const protocol = process.env.REPLIT_DOMAINS ? 'https' : 'http';
        const shareUrl = `${protocol}://${domain}/quote/${updatedQuote.quoteNumber}/${shareToken}`;
        
        res.json({
          token: shareToken,
          quoteNumber: updatedQuote.quoteNumber,
          shareUrl,
          shareTokenCreatedAt: updatedQuote.shareTokenCreatedAt,
        });
      } catch (error) {
        console.error("Error generating share token for quote:", error);
        res.status(500).json({ message: "Failed to generate share token" });
      }
    }
  );

  // Quote approval endpoint (client action)
  app.post("/api/quotes/:id/approve",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !userId) {
          return res.status(401).json({ message: "User not found" });
        }
        
        // Only clients can approve quotes
        if (user.role !== 'client') {
          return res.status(403).json({ message: "Only clients can approve quotes" });
        }
        
        const quote = await storage.getQuote(req.params.id);
        if (!quote) {
          return res.status(404).json({ message: "Quote not found" });
        }
        
        // Verify client owns this quote
        const { clientIds, leadIds } = await getUserClientLeadIds(userId);
        const isOwner = (quote.clientId && clientIds.includes(quote.clientId)) ||
                        (quote.leadId && leadIds.includes(quote.leadId));
        
        if (!isOwner) {
          return res.status(403).json({ message: "You can only approve your own quotes" });
        }
        
        // Update quote status to accepted
        const updatedQuote = await storage.updateQuote(req.params.id, {
          status: 'accepted',
        });
        
        await logActivity(
          userId,
          'approve',
          'quote',
          quote.id,
          quote.quoteNumber,
          'Client approved quote',
          req
        );
        
        res.json(updatedQuote);
      } catch (error) {
        console.error("Error approving quote:", error);
        res.status(500).json({ message: "Failed to approve quote" });
      }
    }
  );

  // Quote rejection endpoint (client action)
  app.post("/api/quotes/:id/reject",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !userId) {
          return res.status(401).json({ message: "User not found" });
        }
        
        // Only clients can reject quotes
        if (user.role !== 'client') {
          return res.status(403).json({ message: "Only clients can reject quotes" });
        }
        
        const quote = await storage.getQuote(req.params.id);
        if (!quote) {
          return res.status(404).json({ message: "Quote not found" });
        }
        
        // Verify client owns this quote
        const { clientIds, leadIds } = await getUserClientLeadIds(userId);
        const isOwner = (quote.clientId && clientIds.includes(quote.clientId)) ||
                        (quote.leadId && leadIds.includes(quote.leadId));
        
        if (!isOwner) {
          return res.status(403).json({ message: "You can only reject your own quotes" });
        }
        
        // Update quote status to rejected
        const updatedQuote = await storage.updateQuote(req.params.id, {
          status: 'rejected',
        });
        
        await logActivity(
          userId,
          'reject',
          'quote',
          quote.id,
          quote.quoteNumber,
          'Client rejected quote',
          req
        );
        
        res.json(updatedQuote);
      } catch (error) {
        console.error("Error rejecting quote:", error);
        res.status(500).json({ message: "Failed to reject quote" });
      }
    }
  );

  // Invoice routes
  app.get("/api/invoices",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !userId) {
          return res.status(401).json({ message: "User not found" });
        }
        
        // Client users can view their own invoices
        if (user.role === 'client') {
          // Find client/lead records for this user and filter invoices
          const { clientIds, leadIds } = await getUserClientLeadIds(userId);
          const allInvoices = await storage.getInvoices();
          
          // Filter invoices where clientId or leadId matches any of the user's IDs
          const userInvoices = allInvoices.filter(invoice => 
            (invoice.clientId && clientIds.includes(invoice.clientId)) ||
            (invoice.leadId && leadIds.includes(invoice.leadId))
          );
          
          return res.json(userInvoices);
        }
        
        // Other roles need viewFinancial permission to see all invoices
        if (!hasPermission(user.role, 'viewFinancial')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const invoices = await storage.getInvoices();
        res.json(invoices);
      } catch (error) {
        console.error("Error fetching invoices:", error);
        res.status(500).json({ message: "Failed to fetch invoices" });
      }
    }
  );

  app.get("/api/invoices/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
        
        const invoice = await storage.getInvoice(req.params.id);
        if (!invoice) {
          return res.status(404).json({ message: "Invoice not found" });
        }
        
        // Permission check: manageSettings OR createdById matches current user
        const hasAccess = hasPermission(user.role, 'manageSettings') || invoice.createdById === userId;
        if (!hasAccess) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        res.json(invoice);
      } catch (error) {
        console.error("Error fetching invoice:", error);
        res.status(500).json({ message: "Failed to fetch invoice" });
      }
    }
  );

  app.post("/api/invoices",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageFinancial')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validated = insertInvoiceSchema.parse({
          ...req.body,
          createdById: userId
        });

        // Convert dueDate from string to Date if present
        const invoiceData: any = {
          ...validated,
        };
        if (validated.dueDate) {
          invoiceData.dueDate = new Date(validated.dueDate);
        }
        
        const newInvoice = await storage.createInvoice(invoiceData);
        
        await logActivity(
          userId,
          'create',
          'invoice',
          newInvoice.id,
          newInvoice.invoiceNumber,
          undefined,
          req
        );
        
        res.status(201).json(newInvoice);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
        }
        console.error("Error creating invoice:", error);
        res.status(500).json({ message: "Failed to create invoice" });
      }
    }
  );

  app.put("/api/invoices/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageFinancial')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validated = updateInvoiceSchema.parse(req.body);
        const updatedInvoice = await storage.updateInvoice(req.params.id, validated);
        
        if (!updatedInvoice) {
          return res.status(404).json({ message: "Invoice not found" });
        }
        
        await logActivity(
          userId,
          'update',
          'invoice',
          updatedInvoice.id,
          updatedInvoice.invoiceNumber,
          undefined,
          req
        );
        
        res.json(updatedInvoice);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid update data", errors: error.errors });
        }
        console.error("Error updating invoice:", error);
        res.status(500).json({ message: "Failed to update invoice" });
      }
    }
  );

  app.patch("/api/invoices/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
        
        const invoice = await storage.getInvoice(req.params.id);
        if (!invoice) {
          return res.status(404).json({ message: "Invoice not found" });
        }
        
        // Permission check: manageSettings OR createdById matches current user
        const hasAccess = hasPermission(user.role, 'manageSettings') || invoice.createdById === userId;
        if (!hasAccess) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const validated = updateInvoiceSchema.parse(req.body);
        const updatedInvoice = await storage.updateInvoice(req.params.id, validated);
        
        if (!updatedInvoice) {
          return res.status(404).json({ message: "Invoice not found" });
        }
        
        await logActivity(
          userId,
          'update',
          'invoice',
          updatedInvoice.id,
          updatedInvoice.invoiceNumber,
          undefined,
          req
        );
        
        res.json(updatedInvoice);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: "Invalid update data", errors: error.errors });
        }
        console.error("Error updating invoice:", error);
        res.status(500).json({ message: "Failed to update invoice" });
      }
    }
  );

  app.delete("/api/invoices/:id",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageFinancial')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        await storage.deleteInvoice(req.params.id);
        
        await logActivity(
          userId,
          'delete',
          'invoice',
          req.params.id,
          null,
          undefined,
          req
        );
        
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting invoice:", error);
        res.status(500).json({ message: "Failed to delete invoice" });
      }
    }
  );

  app.post("/api/invoices/:id/share",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
        
        const invoice = await storage.getInvoice(req.params.id);
        if (!invoice) {
          return res.status(404).json({ message: "Invoice not found" });
        }
        
        // Permission check: manageSettings OR createdById matches current user
        const hasAccess = hasPermission(user.role, 'manageSettings') || invoice.createdById === userId;
        if (!hasAccess) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        // Generate crypto-random UUID for shareToken
        const crypto = await import('crypto');
        const shareToken = crypto.randomUUID();
        
        // Update invoice with shareToken and shareTokenCreatedAt
        const updatedInvoice = await storage.updateInvoice(req.params.id, {
          shareToken,
          shareTokenCreatedAt: new Date(),
        });
        
        if (!updatedInvoice) {
          return res.status(404).json({ message: "Invoice not found" });
        }
        
        await logActivity(
          userId,
          'share',
          'invoice',
          updatedInvoice.id,
          updatedInvoice.invoiceNumber,
          'Generated share token',
          req
        );
        
        // Build shareable URL
        const domain = process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(',')[0] : 'localhost:5000';
        const protocol = process.env.REPLIT_DOMAINS ? 'https' : 'http';
        const shareUrl = `${protocol}://${domain}/invoice/${updatedInvoice.invoiceNumber}/${shareToken}`;
        
        res.json({
          token: shareToken,
          invoiceNumber: updatedInvoice.invoiceNumber,
          shareUrl,
          shareTokenCreatedAt: updatedInvoice.shareTokenCreatedAt,
        });
      } catch (error) {
        console.error("Error generating share token for invoice:", error);
        res.status(500).json({ message: "Failed to generate share token" });
      }
    }
  );

  // Object Storage routes for logo uploads
  app.post("/api/objects/upload",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        const uploadURL = await objectStorageService.getObjectEntityUploadURL();
        res.json({ uploadURL });
      } catch (error) {
        console.error("Error getting upload URL:", error);
        res.status(500).json({ message: "Failed to get upload URL" });
      }
    }
  );

  app.post("/api/logos/upload",
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user || !hasPermission(user.role, 'manageSettings')) {
          return res.status(403).json({ message: "Permission denied" });
        }

        if (!req.body.logoURL) {
          return res.status(400).json({ error: "logoURL is required" });
        }

        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
          req.body.logoURL,
          {
            owner: userId,
            visibility: "public",
          },
        );

        res.status(200).json({
          objectPath: objectPath,
        });
      } catch (error) {
        console.error("Error setting logo ACL:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  app.get("/objects/:objectPath(*)",
    async (req, res) => {
      try {
        const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        const objectFile = await objectStorageService.getObjectEntityFile(req.path);
        objectStorageService.downloadObject(objectFile, res);
      } catch (error: any) {
        console.error("Error serving object:", error);
        if (error.name === 'ObjectNotFoundError') {
          return res.sendStatus(404);
        }
        return res.sendStatus(500);
      }
    }
  );

  // Favicon route - serves the logo from system config
  app.get("/favicon.ico", async (req, res) => {
    try {
      const config = await storage.getSystemConfig();
      
      if (config?.logoUrl) {
        // Redirect to the logo URL
        return res.redirect(config.logoUrl);
      }
      
      // If no logo configured, return 404
      return res.sendStatus(404);
    } catch (error) {
      console.error("Error serving favicon:", error);
      return res.sendStatus(500);
    }
  });

  // Referral system routes

  // Generate unique referral code helper
  const generateUniqueReferralCode = async (): Promise<string> => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const maxRetries = 5;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      const existingCode = await storage.getReferralCodeByCode(code);
      if (!existingCode) {
        return code;
      }
    }
    
    throw new Error('Failed to generate unique referral code after maximum retries');
  };

  // POST /api/referral-codes - Generate new referral code (authenticated)
  app.post('/api/referral-codes', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const code = await generateUniqueReferralCode();
      
      const referralCode = await storage.createReferralCode({
        userId,
        code,
        isActive: true,
      });

      await logActivity(
        userId,
        'created',
        'referral_code',
        referralCode.id,
        code,
        `Created referral code: ${code}`,
        req
      );

      res.status(201).json(referralCode);
    } catch (error) {
      console.error('Error creating referral code:', error);
      res.status(500).json({ message: 'Failed to create referral code' });
    }
  });

  // GET /api/referral-codes - Get current user's referral codes (authenticated)
  app.get('/api/referral-codes', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const referralCodes = await storage.getReferralCodesByUserId(userId);
      res.json(referralCodes);
    } catch (error) {
      console.error('Error fetching referral codes:', error);
      res.status(500).json({ message: 'Failed to fetch referral codes' });
    }
  });

  // PATCH /api/referral-codes/:id - Toggle code active status (authenticated)
  app.patch('/api/referral-codes/:id', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const { id } = req.params;
      
      const validatedData = updateReferralCodeSchema.parse(req.body);
      
      const existingCodes = await storage.getReferralCodesByUserId(userId);
      const codeToUpdate = existingCodes.find(code => code.id === id);
      
      if (!codeToUpdate) {
        return res.status(404).json({ message: 'Referral code not found or unauthorized' });
      }

      const updatedCode = await storage.updateReferralCode(id, validatedData);

      await logActivity(
        userId,
        'updated',
        'referral_code',
        id,
        updatedCode.code,
        `Updated referral code: ${updatedCode.code}`,
        req
      );

      res.json(updatedCode);
    } catch (error) {
      console.error('Error updating referral code:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update referral code' });
    }
  });

  // POST /api/referrals - Create new referral (public route, validates referral code)
  app.post('/api/referrals', async (req: any, res) => {
    try {
      const validatedData = insertReferralSchema.parse(req.body);
      
      const referralCode = await storage.getReferralCodeByCode(
        req.body.referralCode || ''
      );
      
      if (!referralCode) {
        return res.status(404).json({ message: 'Invalid referral code' });
      }
      
      if (!referralCode.isActive) {
        return res.status(400).json({ message: 'Referral code is not active' });
      }

      const referral = await storage.createReferral({
        ...validatedData,
        referralCodeId: referralCode.id,
      });

      await logActivity(
        referralCode.userId,
        'created',
        'referral',
        referral.id,
        validatedData.referredName,
        `New referral: ${validatedData.referredName}`,
        req
      );

      res.status(201).json(referral);
    } catch (error) {
      console.error('Error creating referral:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create referral' });
    }
  });

  // GET /api/referrals - Get referrals for current user's codes (authenticated)
  app.get('/api/referrals', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const referrals = await storage.getReferralsByUserId(userId);
      res.json(referrals);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      res.status(500).json({ message: 'Failed to fetch referrals' });
    }
  });

  // GET /api/referrals/all - Get all referrals (manageLeads permission)
  app.get('/api/referrals/all', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !hasPermission(user.role, 'manageLeads')) {
        return res.status(403).json({ message: 'Permission denied' });
      }
      
      const referrals = await storage.getAllReferrals();
      res.json(referrals);
    } catch (error) {
      console.error('Error fetching all referrals:', error);
      res.status(500).json({ message: 'Failed to fetch referrals' });
    }
  });

  // GET /api/referrals/metrics - Get referral metrics (admin only)
  app.get('/api/referrals/metrics', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const metrics = await storage.getReferralMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching referral metrics:', error);
      res.status(500).json({ message: 'Failed to fetch referral metrics' });
    }
  });

  // PATCH /api/referrals/:id - Update referral status/reward (manageLeads permission)
  app.patch('/api/referrals/:id', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!hasPermission(user.role, 'manageLeads')) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      const { id } = req.params;
      const validatedData = updateReferralSchema.parse(req.body);

      const updatedReferral = await storage.updateReferral(id, validatedData);

      await logActivity(
        userId,
        'updated',
        'referral',
        id,
        updatedReferral.referredName,
        `Updated referral: ${updatedReferral.referredName}`,
        req
      );

      res.json(updatedReferral);
    } catch (error) {
      console.error('Error updating referral:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update referral' });
    }
  });

  // GET /api/referral-stats - Get referral statistics for current user (authenticated)
  app.get('/api/referral-stats', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const stats = await storage.getReferralStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      res.status(500).json({ message: 'Failed to fetch referral statistics' });
    }
  });

  // ==============================
  // FINANCIAL ROUTES (Expenses & Revenue)
  // ==============================

  // GET /api/financial/metrics - Get financial metrics (viewFinancial permission)
  app.get('/api/financial/metrics', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !hasPermission(user.role, 'viewFinancial')) {
        return res.status(403).json({ message: 'Permission denied' });
      }
      
      const metrics = await storage.getFinancialMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching financial metrics:', error);
      res.status(500).json({ message: 'Failed to fetch financial metrics' });
    }
  });

  // GET /api/expenses - Get all expenses (viewFinancial permission)
  app.get('/api/expenses', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !hasPermission(user.role, 'viewFinancial')) {
        return res.status(403).json({ message: 'Permission denied' });
      }
      
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({ message: 'Failed to fetch expenses' });
    }
  });

  // POST /api/expenses - Create expense (manageFinancial permission)
  app.post('/api/expenses', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !hasPermission(user.role, 'manageFinancial')) {
        return res.status(403).json({ message: 'Permission denied' });
      }
      
      const validatedData = insertExpenseSchema.parse(req.body);
      
      const expense = await storage.createExpense({
        ...validatedData,
        createdById: userId,
      });
      
      await logActivity(
        userId,
        'created',
        'expense',
        expense.id,
        expense.description,
        `Created expense: ${expense.description} - $${expense.amount}`,
        req
      );
      
      res.status(201).json(expense);
    } catch (error) {
      console.error('Error creating expense:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create expense' });
    }
  });

  // PUT /api/expenses/:id - Update expense (manageFinancial permission)
  app.put('/api/expenses/:id', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !hasPermission(user.role, 'manageFinancial')) {
        return res.status(403).json({ message: 'Permission denied' });
      }
      
      const { id } = req.params;
      const validatedData = updateExpenseSchema.parse(req.body);
      
      const expense = await storage.updateExpense(id, validatedData);
      
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }
      
      await logActivity(
        userId,
        'updated',
        'expense',
        expense.id,
        expense.description,
        `Updated expense: ${expense.description}`,
        req
      );
      
      res.json(expense);
    } catch (error) {
      console.error('Error updating expense:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update expense' });
    }
  });

  // DELETE /api/expenses/:id - Delete expense (manageFinancial permission)
  app.delete('/api/expenses/:id', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !hasPermission(user.role, 'manageFinancial')) {
        return res.status(403).json({ message: 'Permission denied' });
      }
      
      const { id } = req.params;
      const expense = await storage.getExpense(id);
      
      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }
      
      await storage.deleteExpense(id);
      
      await logActivity(
        userId,
        'deleted',
        'expense',
        id,
        expense.description,
        `Deleted expense: ${expense.description}`,
        req
      );
      
      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({ message: 'Failed to delete expense' });
    }
  });

  // GET /api/revenue - Get all revenue (viewFinancial permission)
  app.get('/api/revenue', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !hasPermission(user.role, 'viewFinancial')) {
        return res.status(403).json({ message: 'Permission denied' });
      }
      
      const revenue = await storage.getRevenue();
      res.json(revenue);
    } catch (error) {
      console.error('Error fetching revenue:', error);
      res.status(500).json({ message: 'Failed to fetch revenue' });
    }
  });

  // POST /api/revenue - Create revenue (manageFinancial permission)
  app.post('/api/revenue', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !hasPermission(user.role, 'manageFinancial')) {
        return res.status(403).json({ message: 'Permission denied' });
      }
      
      const validatedData = insertRevenueSchema.parse(req.body);
      
      const rev = await storage.createRevenue({
        ...validatedData,
        createdById: userId,
      });
      
      await logActivity(
        userId,
        'created',
        'revenue',
        rev.id,
        rev.description,
        `Created revenue: ${rev.description} - $${rev.amount}`,
        req
      );
      
      res.status(201).json(rev);
    } catch (error) {
      console.error('Error creating revenue:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create revenue' });
    }
  });

  // PUT /api/revenue/:id - Update revenue (manageFinancial permission)
  app.put('/api/revenue/:id', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !hasPermission(user.role, 'manageFinancial')) {
        return res.status(403).json({ message: 'Permission denied' });
      }
      
      const { id } = req.params;
      const validatedData = updateRevenueSchema.parse(req.body);
      
      const rev = await storage.updateRevenue(id, validatedData);
      
      if (!rev) {
        return res.status(404).json({ message: 'Revenue not found' });
      }
      
      await logActivity(
        userId,
        'updated',
        'revenue',
        rev.id,
        rev.description,
        `Updated revenue: ${rev.description}`,
        req
      );
      
      res.json(rev);
    } catch (error) {
      console.error('Error updating revenue:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update revenue' });
    }
  });

  // DELETE /api/revenue/:id - Delete revenue (manageFinancial permission)
  app.delete('/api/revenue/:id', isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user || !hasPermission(user.role, 'manageFinancial')) {
        return res.status(403).json({ message: 'Permission denied' });
      }
      
      const { id } = req.params;
      const rev = await storage.getRevenueById(id);
      
      if (!rev) {
        return res.status(404).json({ message: 'Revenue not found' });
      }
      
      await storage.deleteRevenue(id);
      
      await logActivity(
        userId,
        'deleted',
        'revenue',
        id,
        rev.description,
        `Deleted revenue: ${rev.description}`,
        req
      );
      
      res.json({ message: 'Revenue deleted successfully' });
    } catch (error) {
      console.error('Error deleting revenue:', error);
      res.status(500).json({ message: 'Failed to delete revenue' });
    }
  });

  // ===========================
  // PUBLIC API ENDPOINTS (No Authentication Required)
  // ===========================

  // GET /api/public/quote/:quoteNumber/:token - Fetch quote by number and shareToken
  // NOTE: This MUST come before the legacy route to match correctly
  app.get('/api/public/quote/:quoteNumber/:token', async (req: any, res) => {
    try {
      const { quoteNumber, token } = req.params;
      
      const quote = await storage.getQuoteByShareToken(token);
      
      if (!quote) {
        return res.status(404).json({ message: 'Quote not found' });
      }
      
      // Verify quote number matches (security check)
      if (quote.quoteNumber !== quoteNumber) {
        return res.status(404).json({ message: 'Quote not found' });
      }
      
      // Check if token is expired (30 days from creation)
      if (quote.shareTokenCreatedAt) {
        const tokenAge = Date.now() - new Date(quote.shareTokenCreatedAt).getTime();
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        
        if (tokenAge > thirtyDaysInMs) {
          return res.status(404).json({ message: 'Quote link has expired' });
        }
      }
      
      // Fetch related data
      const systemConfig = await storage.getSystemConfig();
      let clientInfo = null;
      let leadInfo = null;
      
      if (quote.clientId) {
        clientInfo = await storage.getClient(quote.clientId);
      }
      
      if (quote.leadId) {
        leadInfo = await storage.getLead(quote.leadId);
      }
      
      res.json({
        quote,
        clientInfo,
        leadInfo,
        systemConfig,
      });
    } catch (error) {
      console.error('Error fetching public quote:', error);
      res.status(500).json({ message: 'Failed to fetch quote' });
    }
  });

  // POST /api/public/quote/:quoteNumber/:token/approve - Approve quote
  app.post('/api/public/quote/:quoteNumber/:token/approve', async (req: any, res) => {
    try {
      const { quoteNumber, token } = req.params;
      const { comments } = req.body;
      
      const quote = await storage.getQuoteByShareToken(token);
      
      if (!quote) {
        return res.status(404).json({ message: 'Quote not found' });
      }
      
      // Verify quote number matches (security check)
      if (quote.quoteNumber !== quoteNumber) {
        return res.status(404).json({ message: 'Quote not found' });
      }
      
      // Check if token is expired (30 days from creation)
      if (quote.shareTokenCreatedAt) {
        const tokenAge = Date.now() - new Date(quote.shareTokenCreatedAt).getTime();
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        
        if (tokenAge > thirtyDaysInMs) {
          return res.status(404).json({ message: 'Quote link has expired' });
        }
      }
      
      // Update quote status to accepted
      const updatedQuote = await storage.updateQuote(quote.id, {
        status: 'accepted',
        notes: comments ? `${quote.notes || ''}\n\nClient Comments: ${comments}`.trim() : quote.notes,
      });
      
      // Log activity
      await logActivity(
        null,
        'quote_approved_via_link',
        'quote',
        quote.id,
        quote.quoteNumber,
        `Quote ${quote.quoteNumber} approved via public link${comments ? ` with comments: ${comments}` : ''}`,
        req
      );
      
      res.json(updatedQuote);
    } catch (error) {
      console.error('Error approving quote:', error);
      res.status(500).json({ message: 'Failed to approve quote' });
    }
  });

  // POST /api/public/quote/:quoteNumber/:token/reject - Reject quote
  app.post('/api/public/quote/:quoteNumber/:token/reject', async (req: any, res) => {
    try {
      const { quoteNumber, token } = req.params;
      const { reason } = req.body;
      
      const quote = await storage.getQuoteByShareToken(token);
      
      if (!quote) {
        return res.status(404).json({ message: 'Quote not found' });
      }
      
      // Verify quote number matches (security check)
      if (quote.quoteNumber !== quoteNumber) {
        return res.status(404).json({ message: 'Quote not found' });
      }
      
      // Check if token is expired (30 days from creation)
      if (quote.shareTokenCreatedAt) {
        const tokenAge = Date.now() - new Date(quote.shareTokenCreatedAt).getTime();
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        
        if (tokenAge > thirtyDaysInMs) {
          return res.status(404).json({ message: 'Quote link has expired' });
        }
      }
      
      // Update quote status to rejected
      const updatedQuote = await storage.updateQuote(quote.id, {
        status: 'rejected',
        notes: reason ? `${quote.notes || ''}\n\nRejection Reason: ${reason}`.trim() : quote.notes,
      });
      
      // Log activity
      await logActivity(
        null,
        'quote_rejected_via_link',
        'quote',
        quote.id,
        quote.quoteNumber,
        `Quote ${quote.quoteNumber} rejected via public link${reason ? ` with reason: ${reason}` : ''}`,
        req
      );
      
      res.json(updatedQuote);
    } catch (error) {
      console.error('Error rejecting quote:', error);
      res.status(500).json({ message: 'Failed to reject quote' });
    }
  });

  // Legacy redirect: GET /api/public/quote/:token - Redirect to new format
  // NOTE: This MUST come after the specific routes to avoid matching them
  app.get('/api/public/quote/:token', async (req: any, res) => {
    try {
      const { token } = req.params;
      
      const quote = await storage.getQuoteByShareToken(token);
      
      if (!quote) {
        return res.status(404).json({ message: 'Quote not found' });
      }
      
      // Redirect to new URL format with quote number
      res.json({
        redirectTo: `/quote/${quote.quoteNumber}/${token}`,
        quote,
      });
    } catch (error) {
      console.error('Error handling legacy quote link:', error);
      res.status(500).json({ message: 'Failed to fetch quote' });
    }
  });

  // GET /api/public/invoice/:invoiceNumber/:token - Fetch invoice by number and shareToken
  // NOTE: This MUST come before the legacy route to match correctly
  app.get('/api/public/invoice/:invoiceNumber/:token', async (req: any, res) => {
    try {
      const { invoiceNumber, token } = req.params;
      
      const invoice = await storage.getInvoiceByShareToken(token);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Verify invoice number matches (security check)
      if (invoice.invoiceNumber !== invoiceNumber) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Check if token is expired (30 days from creation)
      if (invoice.shareTokenCreatedAt) {
        const tokenAge = Date.now() - new Date(invoice.shareTokenCreatedAt).getTime();
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        
        if (tokenAge > thirtyDaysInMs) {
          return res.status(404).json({ message: 'Invoice link has expired' });
        }
      }
      
      // Fetch related data
      const systemConfig = await storage.getSystemConfig();
      let clientInfo = null;
      let leadInfo = null;
      
      if (invoice.clientId) {
        clientInfo = await storage.getClient(invoice.clientId);
      }
      
      if (invoice.leadId) {
        leadInfo = await storage.getLead(invoice.leadId);
      }
      
      res.json({
        invoice,
        clientInfo,
        leadInfo,
        systemConfig,
      });
    } catch (error) {
      console.error('Error fetching public invoice:', error);
      res.status(500).json({ message: 'Failed to fetch invoice' });
    }
  });

  // Legacy redirect: GET /api/public/invoice/:token - Redirect to new format
  // NOTE: This MUST come after the specific routes to avoid matching them
  app.get('/api/public/invoice/:token', async (req: any, res) => {
    try {
      const { token } = req.params;
      
      const invoice = await storage.getInvoiceByShareToken(token);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Redirect to new URL format with invoice number
      res.json({
        redirectTo: `/invoice/${invoice.invoiceNumber}/${token}`,
        invoice,
      });
    } catch (error) {
      console.error('Error handling legacy invoice link:', error);
      res.status(500).json({ message: 'Failed to fetch invoice' });
    }
  });

  // GET /api/public/project/:projectNumber/:token - Fetch project by number and shareToken
  app.get('/api/public/project/:projectNumber/:token', async (req: any, res) => {
    try {
      const { projectNumber, token } = req.params;
      
      const project = await storage.getProjectByShareToken(token);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Verify project number matches (security check)
      if (project.projectNumber !== projectNumber) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if token is expired (30 days from creation)
      if (project.shareTokenCreatedAt) {
        const tokenAge = Date.now() - new Date(project.shareTokenCreatedAt).getTime();
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        
        if (tokenAge > thirtyDaysInMs) {
          return res.status(404).json({ message: 'Project link has expired' });
        }
      }
      
      // Fetch related data
      const systemConfig = await storage.getSystemConfig();
      const tickets = await storage.getTicketsByProject(project.id);
      
      let clientName: string | undefined;
      let technicianName: string | undefined;
      
      if (project.clientId) {
        const client = await storage.getClient(project.clientId);
        if (client) {
          clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim();
        }
      }
      
      if (project.leadId) {
        const lead = await storage.getLead(project.leadId);
        if (lead) {
          clientName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
        }
      }
      
      if (project.assignedTechnicianId) {
        const tech = await storage.getUser(project.assignedTechnicianId);
        if (tech) {
          technicianName = `${tech.firstName || ''} ${tech.lastName || ''}`.trim();
        }
      }
      
      res.json({
        project,
        clientName,
        technicianName,
        systemConfig,
        tickets,
      });
    } catch (error) {
      console.error('Error fetching public project:', error);
      res.status(500).json({ message: 'Failed to fetch project' });
    }
  });

  // GET /api/public/ticket/:ticketNumber/:token - Fetch ticket by number and shareToken
  app.get('/api/public/ticket/:ticketNumber/:token', async (req: any, res) => {
    try {
      const { ticketNumber, token } = req.params;
      
      const ticket = await storage.getTicketByShareToken(token);
      
      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      // Verify ticket number matches (security check)
      if (ticket.ticketNumber !== ticketNumber) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      
      // Check if token is expired (30 days from creation)
      if (ticket.shareTokenCreatedAt) {
        const tokenAge = Date.now() - new Date(ticket.shareTokenCreatedAt).getTime();
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        
        if (tokenAge > thirtyDaysInMs) {
          return res.status(404).json({ message: 'Ticket link has expired' });
        }
      }
      
      // Fetch related data
      const systemConfig = await storage.getSystemConfig();
      const comments = await storage.getTicketComments(ticket.id);
      
      let projectName: string | undefined;
      if (ticket.projectId) {
        const project = await storage.getProject(ticket.projectId);
        if (project) {
          projectName = project.projectName || undefined;
        }
      }
      
      res.json({
        ticket,
        comments,
        projectName,
        systemConfig,
      });
    } catch (error) {
      console.error('Error fetching public ticket:', error);
      res.status(500).json({ message: 'Failed to fetch ticket' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
