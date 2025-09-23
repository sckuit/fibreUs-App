import { Request, Response, NextFunction } from "express";
import { hasPermission, canAccessRoute, UserRole, rolePermissions } from "@shared/permissions";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// Extend Request type to include authenticated user with claims
interface AuthenticatedRequest extends Request {
  user?: {
    claims: {
      sub: string;
    };
  };
  dbUser?: User;
}

// Middleware to load user data from database
export async function loadUserData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (req.user?.claims?.sub) {
      const user = await storage.getUser(req.user.claims.sub);
      req.dbUser = user || undefined;
    }
    next();
  } catch (error) {
    console.error("Error loading user data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Check if user has specific permission
export function requirePermission(permission: keyof typeof rolePermissions.admin) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.dbUser;
    
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (!hasPermission(user.role as UserRole, permission)) {
      return res.status(403).json({ 
        message: `Access denied. Required permission: ${permission}` 
      });
    }
    
    next();
  };
}

// Check if user has minimum role level
export function requireRole(minimumRole: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.dbUser;
    
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const roleHierarchy: Record<UserRole, number> = {
      client: 1,
      employee: 2,
      manager: 3,
      admin: 4,
    };
    
    const userLevel = roleHierarchy[user.role as UserRole] || 0;
    const requiredLevel = roleHierarchy[minimumRole];
    
    if (userLevel < requiredLevel) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${minimumRole} or higher` 
      });
    }
    
    next();
  };
}

// Check ownership - user can only access their own data
export function requireOwnership(getResourceUserId: (req: AuthenticatedRequest) => string | undefined) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.dbUser;
    
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Admins can access everything
    if (user.role === 'admin') {
      return next();
    }
    
    // Managers can access employee data
    if (user.role === 'manager' && hasPermission(user.role as UserRole, 'viewUsers')) {
      return next();
    }
    
    const resourceUserId = getResourceUserId(req);
    
    if (!resourceUserId) {
      return res.status(400).json({ message: "Resource owner not found" });
    }
    
    if (user.id !== resourceUserId) {
      return res.status(403).json({ message: "Access denied. You can only access your own data" });
    }
    
    next();
  };
}

// Filter data based on user permissions
export function filterByRole<T extends Record<string, any>>(
  data: T[],
  userRole: UserRole,
  filterFn: (item: T, role: UserRole) => T | null
): T[] {
  return data
    .map(item => filterFn(item, userRole))
    .filter((item): item is T => item !== null);
}

// Get accessible service requests based on role
export function getAccessibleRequests(userId: string, userRole: UserRole) {
  switch (userRole) {
    case 'client':
      // Clients can only see their own requests
      return { clientId: userId };
    case 'employee':
      // Employees can see requests assigned to their projects
      return { assignedTo: userId };
    case 'manager':
    case 'admin':
      // Managers and admins can see all requests
      return {};
    default:
      return { clientId: userId };
  }
}

// Get accessible projects based on role
export function getAccessibleProjects(userId: string, userRole: UserRole) {
  switch (userRole) {
    case 'client':
      // Clients can see projects for their requests
      return { clientId: userId };
    case 'employee':
      // Employees can see their assigned projects
      return { assignedTechnicianId: userId };
    case 'manager':
    case 'admin':
      // Managers and admins can see all projects
      return {};
    default:
      return { clientId: userId };
  }
}