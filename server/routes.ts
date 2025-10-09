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

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware must be configured before any routes that use sessions
  app.use(getSession());

  // Visitor tracking middleware (should be early in the chain)
  app.use(trackVisitor);

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
      } else {
        // For employees, filter by assignedTechnicianId. For clients, filter by clientId
        const filters = user.role === 'employee' 
          ? { assignedTechnicianId: userId }
          : { clientId: userId };
        const projects = await storage.getProjects(filters);
        res.json(projects);
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

  app.put("/api/projects/:id", isSessionAuthenticated, async (req: any, res) => {
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
      if (updates.status && !['scheduled', 'in_progress', 'completed', 'on_hold'].includes(updates.status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedProject = await storage.updateProject(projectId, updates);
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

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
  app.get("/api/system-config",
    isSessionAuthenticated,
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

  const httpServer = createServer(app);
  return httpServer;
}
