// From javascript_log_in_with_replit integration + business logic
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertServiceRequestSchema } from "@shared/schema";
import { z } from "zod";

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
      const requestData = insertServiceRequestSchema.parse({
        ...req.body,
        clientId: userId,
      });
      
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
      res.json(requests);
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
      
      res.json(request);
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
      const updates = req.body;
      
      const updatedRequest = await storage.updateServiceRequest(id, updates);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating service request:", error);
      res.status(500).json({ message: "Failed to update service request" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/client", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dashboard = await storage.getClientDashboard(userId);
      res.json(dashboard);
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
      res.json(dashboard);
    } catch (error) {
      console.error("Error fetching admin dashboard:", error);
      res.status(500).json({ message: "Failed to fetch admin dashboard" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
