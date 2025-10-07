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
  
  // Tasks
  viewOwnTasks: boolean;
  viewAllTasks: boolean;
  manageOwnTasks: boolean;
  manageAllTasks: boolean;
  
  // Reports
  viewOwnReports: boolean;
  viewAllReports: boolean;
  manageOwnReports: boolean;
  manageAllReports: boolean;
  approveReports: boolean;
  
  // Inventory
  viewInventory: boolean;
  manageInventory: boolean;
  
  // Suppliers
  viewSuppliers: boolean;
  manageSuppliers: boolean;
  
  // Messages/Communications
  viewOwnMessages: boolean;
  viewAllMessages: boolean;
  manageMessages: boolean;
  
  // Clients
  viewClients: boolean;
  manageClients: boolean;
  
  // Leads
  viewLeads: boolean;
  manageLeads: boolean;
  
  // Visitors
  viewVisitors: boolean;
  
  // Financial
  viewFinancial: boolean;
  manageFinancial: boolean;
  
  // Users/Employees
  viewUsers: boolean;
  manageUsers: boolean;
  viewUserDetails: boolean;
  
  // Admin functions
  manageSystem: boolean;
  viewSystemReports: boolean;
  manageSettings: boolean;
  viewActivities: boolean;
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
    
    // Projects - clients can view their own projects
    viewOwnProjects: true,
    viewAllProjects: false,
    manageOwnProjects: false,
    manageAllProjects: false,
    assignProjects: false,
    
    // Tasks - no access
    viewOwnTasks: false,
    viewAllTasks: false,
    manageOwnTasks: false,
    manageAllTasks: false,
    
    // Reports - no access
    viewOwnReports: false,
    viewAllReports: false,
    manageOwnReports: false,
    manageAllReports: false,
    approveReports: false,
    
    // Inventory - no access
    viewInventory: false,
    manageInventory: false,
    
    // Suppliers - no access
    viewSuppliers: false,
    manageSuppliers: false,
    
    // Messages - clients can view own messages
    viewOwnMessages: true,
    viewAllMessages: false,
    manageMessages: false,
    
    // Clients - no access
    viewClients: false,
    manageClients: false,
    
    // Leads - no access
    viewLeads: false,
    manageLeads: false,
    
    // Visitors - no access
    viewVisitors: false,
    
    // Financial - no access
    viewFinancial: false,
    manageFinancial: false,
    
    // Users - no access
    viewUsers: false,
    manageUsers: false,
    viewUserDetails: false,
    
    // Admin - no admin access
    manageSystem: false,
    viewSystemReports: false,
    manageSettings: false,
    viewActivities: false,
  },
  
  employee: {
    // Service requests - no access
    viewOwnRequests: false,
    viewAllRequests: false,
    createRequests: false,
    editOwnRequests: false,
    editAllRequests: false,
    deleteRequests: false,
    
    // Projects - linked access only
    viewOwnProjects: true,
    viewAllProjects: false,
    manageOwnProjects: true,
    manageAllProjects: false,
    assignProjects: false,
    
    // Tasks - linked access only
    viewOwnTasks: true,
    viewAllTasks: false,
    manageOwnTasks: true,
    manageAllTasks: false,
    
    // Reports - linked access only
    viewOwnReports: true,
    viewAllReports: false,
    manageOwnReports: true,
    manageAllReports: false,
    approveReports: false,
    
    // Inventory - no access
    viewInventory: false,
    manageInventory: false,
    
    // Suppliers - no access
    viewSuppliers: false,
    manageSuppliers: false,
    
    // Messages - no access
    viewOwnMessages: false,
    viewAllMessages: false,
    manageMessages: false,
    
    // Clients - no access
    viewClients: false,
    manageClients: false,
    
    // Leads - no access
    viewLeads: false,
    manageLeads: false,
    
    // Visitors - no access
    viewVisitors: false,
    
    // Financial - no access
    viewFinancial: false,
    manageFinancial: false,
    
    // Users - no access
    viewUsers: false,
    manageUsers: false,
    viewUserDetails: false,
    
    // Admin - no admin access
    manageSystem: false,
    viewSystemReports: false,
    manageSettings: false,
    viewActivities: false,
  },
  
  sales: {
    // Service requests - no access
    viewOwnRequests: false,
    viewAllRequests: false,
    createRequests: false,
    editOwnRequests: false,
    editAllRequests: false,
    deleteRequests: false,
    
    // Projects - full access
    viewOwnProjects: true,
    viewAllProjects: true,
    manageOwnProjects: true,
    manageAllProjects: true,
    assignProjects: true,
    
    // Tasks - full access
    viewOwnTasks: true,
    viewAllTasks: true,
    manageOwnTasks: true,
    manageAllTasks: true,
    
    // Reports - full access
    viewOwnReports: true,
    viewAllReports: true,
    manageOwnReports: true,
    manageAllReports: true,
    approveReports: false,
    
    // Inventory - no access
    viewInventory: false,
    manageInventory: false,
    
    // Suppliers - full access
    viewSuppliers: true,
    manageSuppliers: true,
    
    // Messages - full access
    viewOwnMessages: true,
    viewAllMessages: true,
    manageMessages: true,
    
    // Clients - full access
    viewClients: true,
    manageClients: true,
    
    // Leads - full access
    viewLeads: true,
    manageLeads: true,
    
    // Visitors - full access
    viewVisitors: true,
    
    // Financial - no access
    viewFinancial: false,
    manageFinancial: false,
    
    // Users - NO access
    viewUsers: false,
    manageUsers: false,
    viewUserDetails: false,
    
    // Admin - no admin access
    manageSystem: false,
    viewSystemReports: false,
    manageSettings: false,
    viewActivities: false,
  },
  
  project_manager: {
    // Service requests - no access
    viewOwnRequests: false,
    viewAllRequests: false,
    createRequests: false,
    editOwnRequests: false,
    editAllRequests: false,
    deleteRequests: false,
    
    // Projects - full access
    viewOwnProjects: true,
    viewAllProjects: true,
    manageOwnProjects: true,
    manageAllProjects: true,
    assignProjects: true,
    
    // Tasks - full access
    viewOwnTasks: true,
    viewAllTasks: true,
    manageOwnTasks: true,
    manageAllTasks: true,
    
    // Reports - full access
    viewOwnReports: true,
    viewAllReports: true,
    manageOwnReports: true,
    manageAllReports: true,
    approveReports: true,
    
    // Inventory - full access
    viewInventory: true,
    manageInventory: true,
    
    // Suppliers - full access
    viewSuppliers: true,
    manageSuppliers: true,
    
    // Messages - no access
    viewOwnMessages: false,
    viewAllMessages: false,
    manageMessages: false,
    
    // Clients - full access
    viewClients: true,
    manageClients: true,
    
    // Leads - no access
    viewLeads: false,
    manageLeads: false,
    
    // Visitors - no access
    viewVisitors: false,
    
    // Financial - no access
    viewFinancial: false,
    manageFinancial: false,
    
    // Users - NO access
    viewUsers: false,
    manageUsers: false,
    viewUserDetails: false,
    
    // Admin - no admin access
    manageSystem: false,
    viewSystemReports: false,
    manageSettings: false,
    viewActivities: false,
  },
  
  manager: {
    // Service requests - full access
    viewOwnRequests: true,
    viewAllRequests: true,
    createRequests: true,
    editOwnRequests: true,
    editAllRequests: true,
    deleteRequests: true,
    
    // Projects - full access
    viewOwnProjects: true,
    viewAllProjects: true,
    manageOwnProjects: true,
    manageAllProjects: true,
    assignProjects: true,
    
    // Tasks - full access
    viewOwnTasks: true,
    viewAllTasks: true,
    manageOwnTasks: true,
    manageAllTasks: true,
    
    // Reports - full access
    viewOwnReports: true,
    viewAllReports: true,
    manageOwnReports: true,
    manageAllReports: true,
    approveReports: true,
    
    // Inventory - full access
    viewInventory: true,
    manageInventory: true,
    
    // Suppliers - full access
    viewSuppliers: true,
    manageSuppliers: true,
    
    // Messages - full access
    viewOwnMessages: true,
    viewAllMessages: true,
    manageMessages: true,
    
    // Clients - full access
    viewClients: true,
    manageClients: true,
    
    // Leads - full access
    viewLeads: true,
    manageLeads: true,
    
    // Visitors - full access
    viewVisitors: true,
    
    // Financial - full access
    viewFinancial: true,
    manageFinancial: true,
    
    // Users - full access
    viewUsers: true,
    manageUsers: true,
    viewUserDetails: true,
    
    // Admin - limited admin access
    manageSystem: false,
    viewSystemReports: true,
    manageSettings: true,
    viewActivities: true,
  },
  
  admin: {
    // Service requests - full access
    viewOwnRequests: true,
    viewAllRequests: true,
    createRequests: true,
    editOwnRequests: true,
    editAllRequests: true,
    deleteRequests: true,
    
    // Projects - full access
    viewOwnProjects: true,
    viewAllProjects: true,
    manageOwnProjects: true,
    manageAllProjects: true,
    assignProjects: true,
    
    // Tasks - full access
    viewOwnTasks: true,
    viewAllTasks: true,
    manageOwnTasks: true,
    manageAllTasks: true,
    
    // Reports - full access
    viewOwnReports: true,
    viewAllReports: true,
    manageOwnReports: true,
    manageAllReports: true,
    approveReports: true,
    
    // Inventory - full access
    viewInventory: true,
    manageInventory: true,
    
    // Suppliers - full access
    viewSuppliers: true,
    manageSuppliers: true,
    
    // Messages - full access
    viewOwnMessages: true,
    viewAllMessages: true,
    manageMessages: true,
    
    // Clients - full access
    viewClients: true,
    manageClients: true,
    
    // Leads - full access
    viewLeads: true,
    manageLeads: true,
    
    // Visitors - full access
    viewVisitors: true,
    
    // Financial - full access
    viewFinancial: true,
    manageFinancial: true,
    
    // Users - full access
    viewUsers: true,
    manageUsers: true,
    viewUserDetails: true,
    
    // Admin - full admin access
    manageSystem: true,
    viewSystemReports: true,
    manageSettings: true,
    viewActivities: true,
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
      return true; // All authenticated users can access dashboard
      
    case '/requests':
    case '/service-requests':
      return hasPermission(role, 'viewOwnRequests');
      
    case '/projects':
      return hasPermission(role, 'viewOwnProjects');
      
    case '/tasks':
      return hasPermission(role, 'viewOwnTasks');
      
    case '/reports':
      return hasPermission(role, 'viewOwnReports');
      
    case '/users':
    case '/employees':
      return hasPermission(role, 'viewUsers');
      
    case '/settings':
    case '/admin':
      return hasPermission(role, 'manageSystem');
      
    default:
      return false;
  }
}

export function getDefaultRoute(role: UserRole): string {
  // All authenticated users go to dashboard
  return '/dashboard';
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
