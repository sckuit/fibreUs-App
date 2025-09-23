// From javascript_log_in_with_replit integration + business logic
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { clientInsertServiceRequestSchema, updateServiceRequestSchema, type ServiceRequest, type Communication } from "@shared/schema";
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
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Service request routes
  app.post("/api/service-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
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
  });

  app.get("/api/service-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // If admin, get all requests. If client, get only their requests
      const clientId = user?.role === 'admin' ? undefined : userId;
      const requests = await storage.getServiceRequests(clientId);
      
      // Sanitize requests for non-admin users
      const sanitizedRequests = requests.map(request => 
        sanitizeServiceRequest(request, user?.role || 'client')
      );
      
      res.json(sanitizedRequests);
    } catch (error) {
      console.error("Error fetching service requests:", error);
      res.status(500).json({ message: "Failed to fetch service requests" });
    }
  });

  app.get("/api/service-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const request = await storage.getServiceRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Service request not found" });
      }
      
      // Check permissions: admins can see all, clients can only see their own
      if (user?.role !== 'admin' && request.clientId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Sanitize request for non-admin users
      const sanitizedRequest = sanitizeServiceRequest(request, user?.role || 'client');
      
      res.json(sanitizedRequest);
    } catch (error) {
      console.error("Error fetching service request:", error);
      res.status(500).json({ message: "Failed to fetch service request" });
    }
  });

  // Admin-only route to update service requests
  app.put("/api/service-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      
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
  });

  // Dashboard routes
  app.get("/api/dashboard/client", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const dashboard = await storage.getClientDashboard(userId);
      
      // Sanitize all nested objects to prevent information disclosure
      const sanitizedDashboard = {
        activeRequests: dashboard.activeRequests?.map(request => 
          sanitizeServiceRequest(request, user?.role || 'client')
        ) || [],
        activeProjects: dashboard.activeProjects || [],
        recentCommunications: sanitizeCommunications(
          dashboard.recentCommunications || [], 
          user?.role || 'client'
        ),
      };
      
      res.json(sanitizedDashboard);
    } catch (error) {
      console.error("Error fetching client dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard" });
    }
  });

  app.get("/api/dashboard/admin", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
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
  app.get("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // If admin, get all projects. If client, get only their projects
      const clientId = user?.role === 'admin' ? undefined : userId;
      const projects = await storage.getProjects(clientId);
      
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
