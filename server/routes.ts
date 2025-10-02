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
        req.session.save((saveErr: any) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Session creation failed" });
          }
          
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

  app.post('/api/auth/logout', isSessionAuthenticated, (req: any, res) => {
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
        
        if (!user) {
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
        
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
        
        let requests;
        
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
          sanitizeServiceRequest(request, user.role || 'client')
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
        
        if (!user) {
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
        const sanitizedRequest = sanitizeServiceRequest(request, user.role || 'client');
        
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
        
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
        
        // Check permission
        if (!hasPermission(user.role, 'editAllRequests')) {
          return res.status(403).json({ message: "Permission denied" });
        }
        
        // Validate and whitelist allowed fields
        const validatedUpdates = updateServiceRequestSchema.parse(req.body);
        
        const updatedRequest = await storage.updateServiceRequest(id, validatedUpdates);
        
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
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const dashboard = await storage.getClientDashboard(userId);
      
      // Sanitize all nested objects to prevent information disclosure
      const sanitizedDashboard = {
        activeRequests: dashboard.activeRequests?.map(request => 
          sanitizeServiceRequest(request, user.role || 'client')
        ) || [],
        activeProjects: dashboard.activeProjects || [],
        recentCommunications: sanitizeCommunications(
          dashboard.recentCommunications || [], 
          user.role || 'client'
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
      
      if (!user) {
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
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // If admin, get all projects. If client, get only their projects
      const clientId = user.role === 'admin' ? undefined : userId;
      const projects = await storage.getProjects(clientId);
      
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.put("/api/projects/:id", isSessionAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
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
      
      if (!user) {
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

  // Visitor analytics routes (admin and manager only)
  app.get("/api/analytics/visitors", 
    isSessionAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUser(userId);
        
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
        
        // Check permission
        if (!hasPermission(user.role, 'viewReports')) {
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
        
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
        
        // Check permission
        if (!hasPermission(user.role, 'viewReports')) {
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

  const httpServer = createServer(app);
  return httpServer;
}
