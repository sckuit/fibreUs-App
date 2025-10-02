// Role-based access control definitions
export type UserRole = 'client' | 'employee' | 'manager' | 'admin' | 'sales' | 'project_manager';

export interface Permission {
  // Service requests
  viewOwnRequests: boolean;
  viewAllRequests: boolean;
  createRequests: boolean;
  editOwnRequests: boolean;
  editAllRequests: boolean;
  deleteRequests: boolean;
  
  // Projects
  viewOwnProjects: boolean;
  viewAllProjects: boolean;
  manageOwnProjects: boolean;
  manageAllProjects: boolean;
  assignProjects: boolean;
  
  // Users/Employees
  viewUsers: boolean;
  manageEmployees: boolean;
  viewUserDetails: boolean;
  
  // Communications
  viewOwnCommunications: boolean;
  viewAllCommunications: boolean;
  createCommunications: boolean;
  viewInternalNotes: boolean;
  
  // Admin functions
  manageSystem: boolean;
  viewReports: boolean;
  manageSettings: boolean;
}

// Permission definitions for each role
export const rolePermissions: Record<UserRole, Permission> = {
  client: {
    // Service requests - clients can view/manage their own requests
    viewOwnRequests: true,
    viewAllRequests: false,
    createRequests: true,
    editOwnRequests: true,
    editAllRequests: false,
    deleteRequests: false,
    
    // Projects - clients can view their own projects but not manage
    viewOwnProjects: true,
    viewAllProjects: false,
    manageOwnProjects: false,
    manageAllProjects: false,
    assignProjects: false,
    
    // Users - clients cannot view other users
    viewUsers: false,
    manageEmployees: false,
    viewUserDetails: false,
    
    // Communications - clients can view/create communications for their requests
    viewOwnCommunications: true,
    viewAllCommunications: false,
    createCommunications: true,
    viewInternalNotes: false,
    
    // Admin - no admin access
    manageSystem: false,
    viewReports: false,
    manageSettings: false,
  },
  
  employee: {
    // Service requests - employees can view assigned requests
    viewOwnRequests: true,
    viewAllRequests: false,
    createRequests: false,
    editOwnRequests: false,
    editAllRequests: false,
    deleteRequests: false,
    
    // Projects - employees can view and manage their assigned projects
    viewOwnProjects: true,
    viewAllProjects: false,
    manageOwnProjects: true,
    manageAllProjects: false,
    assignProjects: false,
    
    // Users - employees cannot manage other users
    viewUsers: false,
    manageEmployees: false,
    viewUserDetails: false,
    
    // Communications - employees can view/create for their projects
    viewOwnCommunications: true,
    viewAllCommunications: false,
    createCommunications: true,
    viewInternalNotes: true,
    
    // Admin - no admin access
    manageSystem: false,
    viewReports: false,
    manageSettings: false,
  },
  
  manager: {
    // Service requests - managers can view and manage all requests
    viewOwnRequests: true,
    viewAllRequests: true,
    createRequests: true,
    editOwnRequests: true,
    editAllRequests: true,
    deleteRequests: false,
    
    // Projects - managers can view and manage all projects
    viewOwnProjects: true,
    viewAllProjects: true,
    manageOwnProjects: true,
    manageAllProjects: true,
    assignProjects: true,
    
    // Users - managers can view and manage employees
    viewUsers: true,
    manageEmployees: true,
    viewUserDetails: true,
    
    // Communications - managers can view all communications
    viewOwnCommunications: true,
    viewAllCommunications: true,
    createCommunications: true,
    viewInternalNotes: true,
    
    // Admin - limited admin access
    manageSystem: false,
    viewReports: true,
    manageSettings: false,
  },
  
  admin: {
    // Service requests - admins have full access
    viewOwnRequests: true,
    viewAllRequests: true,
    createRequests: true,
    editOwnRequests: true,
    editAllRequests: true,
    deleteRequests: true,
    
    // Projects - admins have full access
    viewOwnProjects: true,
    viewAllProjects: true,
    manageOwnProjects: true,
    manageAllProjects: true,
    assignProjects: true,
    
    // Users - admins can manage all users
    viewUsers: true,
    manageEmployees: true,
    viewUserDetails: true,
    
    // Communications - admins have full access
    viewOwnCommunications: true,
    viewAllCommunications: true,
    createCommunications: true,
    viewInternalNotes: true,
    
    // Admin - full admin access
    manageSystem: true,
    viewReports: true,
    manageSettings: true,
  },
  
  sales: {
    // Service requests - sales can view requests to identify leads
    viewOwnRequests: true,
    viewAllRequests: true,
    createRequests: false,
    editOwnRequests: false,
    editAllRequests: false,
    deleteRequests: false,
    
    // Projects - sales can view all projects for deal tracking
    viewOwnProjects: true,
    viewAllProjects: true,
    manageOwnProjects: false,
    manageAllProjects: false,
    assignProjects: false,
    
    // Users - sales can view clients and users
    viewUsers: true,
    manageEmployees: false,
    viewUserDetails: true,
    
    // Communications - sales can view communications for customer relations
    viewOwnCommunications: true,
    viewAllCommunications: false,
    createCommunications: true,
    viewInternalNotes: false,
    
    // Admin - limited access, can view reports for metrics
    manageSystem: false,
    viewReports: true,
    manageSettings: false,
  },
  
  project_manager: {
    // Service requests - project managers can view and manage all requests
    viewOwnRequests: true,
    viewAllRequests: true,
    createRequests: true,
    editOwnRequests: true,
    editAllRequests: true,
    deleteRequests: false,
    
    // Projects - project managers have full control over projects
    viewOwnProjects: true,
    viewAllProjects: true,
    manageOwnProjects: true,
    manageAllProjects: true,
    assignProjects: true,
    
    // Users - project managers can view and manage employees
    viewUsers: true,
    manageEmployees: true,
    viewUserDetails: true,
    
    // Communications - project managers can view all communications
    viewOwnCommunications: true,
    viewAllCommunications: true,
    createCommunications: true,
    viewInternalNotes: true,
    
    // Admin - project managers can view reports and manage settings
    manageSystem: false,
    viewReports: true,
    manageSettings: true,
  },
};

// Utility functions for permission checking
export function hasPermission(role: UserRole, permission: keyof Permission): boolean {
  return rolePermissions[role][permission];
}

export function canAccessRoute(role: UserRole, route: string): boolean {
  // Define route access rules
  switch (route) {
    case '/':
    case '/home':
      return true; // Public routes
      
    case '/dashboard':
      return ['client', 'employee', 'manager', 'admin', 'project_manager'].includes(role);
      
    case '/portal/sales':
      return role === 'sales';
      
    case '/requests':
    case '/service-requests':
      return hasPermission(role, 'viewOwnRequests');
      
    case '/projects':
      return hasPermission(role, 'viewOwnProjects');
      
    case '/users':
    case '/employees':
      return hasPermission(role, 'viewUsers');
      
    case '/reports':
      return hasPermission(role, 'viewReports');
      
    case '/settings':
    case '/admin':
      return hasPermission(role, 'manageSystem');
      
    default:
      return false;
  }
}

export function getDefaultRoute(role: UserRole): string {
  // Return the default route for each role after login
  switch (role) {
    case 'client':
      return '/dashboard';
    case 'employee':
      return '/projects';
    case 'sales':
      return '/portal/sales';
    case 'project_manager':
      return '/dashboard';
    case 'manager':
      return '/dashboard';
    case 'admin':
      return '/dashboard';
    default:
      return '/';
  }
}

// Role hierarchy for permission inheritance
export const roleHierarchy: Record<UserRole, number> = {
  client: 1,
  employee: 2,
  sales: 2,
  project_manager: 3,
  manager: 3,
  admin: 4,
};

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}