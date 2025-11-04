import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocation } from "wouter";
import { 
  Plus, FileText, Wrench, Clock, Users, ClipboardList, 
  DollarSign, MessageSquare, BarChart, Package, Truck,
  Home, UserCircle, Eye, Activity, Settings, Edit, Trash2,
  UserPlus, Download, AlertTriangle, FileDown, Upload, TrendingUp, TrendingDown, Gift,
  Server, Database, Users2, Gauge
} from "lucide-react";
import type { User, ServiceRequest, Project, Communication, Visitor, InventoryItem, FinancialLog, Activity as ActivityLog } from "@shared/schema";
import { hasPermission } from "@shared/permissions";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV, downloadInventoryTemplate, parseCSV } from "@/lib/exportUtils";
import { cn } from "@/lib/utils";
import { UserDialog } from "@/components/UserDialog";
import { InventoryDialog } from "@/components/InventoryDialog";
import { ProjectDialog } from "@/components/ProjectDialog";
import { ClientDialog } from "@/components/ClientDialog";
import ReportsManager from "@/components/ReportsManager";
import { TasksManager } from "@/components/TasksManager";
import MessagesManager from "@/components/MessagesManager";
import LeadsManager from "@/components/LeadsManager";
import ClientsManager from "@/components/ClientsManager";
import UsersManager from "@/components/UsersManager";
import SuppliersManager from "@/components/SuppliersManager";
import ActivitiesManager from "@/components/ActivitiesManager";
import VisitorsManager from "@/components/VisitorsManager";
import { ServiceTypesManager } from "@/components/ServiceTypesManager";
import { AppConfigDialog } from "@/components/AppConfigDialog";
import { LogoUploadDialog } from "@/components/LogoUploadDialog";
import { LogoUploadManager } from "@/components/LogoUploadManager";
import { CertificationsManager } from "@/components/CertificationsManager";
import { TeamMembersManager } from "@/components/TeamMembersManager";
import { PriceMatrixManager } from "@/components/PriceMatrixManager";
import { LegalManager } from "@/components/LegalManager";
import QuoteBuilder from "@/components/QuoteBuilder";
import PromoQuoteBuilder from "@/components/PromoQuoteBuilder";
import QuotesManager from "@/components/QuotesManager";
import InvoiceBuilder from "@/components/InvoiceBuilder";
import InvoicesManager from "@/components/InvoicesManager";
import ReferralTracker from "@/components/ReferralTracker";
import ReferralProgramManager from "@/components/ReferralProgramManager";
import ReferreesManager from "@/components/ReferreesManager";
import ExpensesManager from "@/components/ExpensesManager";
import RevenueManager from "@/components/RevenueManager";
import FinancialLogs from "@/components/FinancialLogs";

interface DashboardData {
  pendingRequests?: ServiceRequest[];
  activeRequests?: ServiceRequest[];
  activeProjects?: Project[];
  recentCommunications?: Communication[];
}

interface SystemMetrics {
  totalUsers: number;
  usersThisMonth: number;
  databaseSizeGB: number;
  activeSessions: number;
  systemHealthPercent: number;
}

interface ReferralMetrics {
  totalReferrals: number;
  pendingReferrals: number;
  convertedReferrals: number;
  conversionRate: number;
}

interface FinancialMetrics {
  totalExpenses: number;
  totalRevenue: number;
  netProfit: number;
  monthlyTrend: number;
  expensesByCategory: { category: string; amount: number }[];
  revenueBySource: { source: string; amount: number }[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const typedUser = user as User | undefined;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Dialog states
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | undefined>();
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isAppConfigDialogOpen, setIsAppConfigDialogOpen] = useState(false);
  const [isLogoUploadDialogOpen, setIsLogoUploadDialogOpen] = useState(false);
  
  // Fetch dashboard data based on user role
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: [typedUser?.role === 'admin' ? '/api/dashboard/admin' : '/api/dashboard/client'],
    enabled: !!typedUser,
  });

  // Fetch all data for tabs
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!typedUser?.role && hasPermission(typedUser.role, 'viewUsers'),
  });

  const { data: visitors = [], isLoading: visitorsLoading } = useQuery<Visitor[]>({
    queryKey: ["/api/analytics/recent-visitors"],
    enabled: !!typedUser?.role && hasPermission(typedUser.role, 'viewVisitors'),
  });

  const { data: inventoryItems = [], isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory/items"],
    enabled: !!typedUser?.role && hasPermission(typedUser.role, 'viewInventory'),
  });

  const { data: lowStockItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory/low-stock"],
    enabled: !!typedUser?.role && hasPermission(typedUser.role, 'viewInventory'),
  });

  const { data: financialLogs = [], isLoading: financialLogsLoading } = useQuery<FinancialLog[]>({
    queryKey: ["/api/financial-logs"],
    enabled: !!typedUser?.role && hasPermission(typedUser.role, 'viewFinancial'),
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: !!typedUser?.role && (hasPermission(typedUser.role, 'viewOwnProjects') || hasPermission(typedUser.role, 'viewAllProjects')),
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activities"],
    enabled: !!typedUser?.role && hasPermission(typedUser.role, 'viewActivities'),
  });

  // Fetch system metrics (admin only)
  const { data: systemMetrics, isLoading: systemMetricsLoading } = useQuery<SystemMetrics>({
    queryKey: ["/api/system/metrics"],
    enabled: typedUser?.role === 'admin',
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch referral metrics (admin only)
  const { data: referralMetrics, isLoading: referralMetricsLoading } = useQuery<ReferralMetrics>({
    queryKey: ["/api/referrals/metrics"],
    enabled: typedUser?.role === 'admin',
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch financial metrics
  const { data: financialMetrics, isLoading: financialMetricsLoading } = useQuery<FinancialMetrics>({
    queryKey: ["/api/financial/metrics"],
    enabled: !!typedUser?.role && hasPermission(typedUser.role, 'viewFinancial'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: (userData: any) => apiRequest("POST", "/api/users", userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsUserDialogOpen(false);
      setEditingUser(undefined);
      toast({ title: "User created", description: "New user has been successfully added" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create user", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsUserDialogOpen(false);
      setEditingUser(undefined);
      toast({ title: "User updated", description: "User has been successfully updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update user", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("DELETE", `/api/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User deleted", description: "User has been successfully removed" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete user", variant: "destructive" });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("PATCH", `/api/users/${userId}/toggle-status`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User status updated", description: "User status has been successfully toggled" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update user status", variant: "destructive" });
    },
  });

  // Inventory mutations
  const createInventoryMutation = useMutation({
    mutationFn: (itemData: any) => apiRequest("POST", "/api/inventory/items", itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      setIsInventoryDialogOpen(false);
      setEditingInventoryItem(undefined);
      toast({ title: "Item created", description: "Inventory item has been successfully added" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create inventory item", variant: "destructive" });
    },
  });

  const updateInventoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/inventory/items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      setIsInventoryDialogOpen(false);
      setEditingInventoryItem(undefined);
      toast({ title: "Item updated", description: "Inventory item has been successfully updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update inventory item", variant: "destructive" });
    },
  });

  const deleteInventoryMutation = useMutation({
    mutationFn: (itemId: string) => apiRequest("DELETE", `/api/inventory/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      toast({ title: "Item deleted", description: "Inventory item has been successfully deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete inventory item", variant: "destructive" });
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: (projectData: any) => apiRequest("POST", "/api/projects", projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsProjectDialogOpen(false);
      setEditingProject(undefined);
      toast({ title: "Project created", description: "New project has been successfully created" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create project", variant: "destructive" });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, ...projectData }: any) => apiRequest("PATCH", `/api/projects/${id}`, projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsProjectDialogOpen(false);
      setEditingProject(undefined);
      toast({ title: "Project updated", description: "Project has been successfully updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update project", variant: "destructive" });
    },
  });

  const createClientMutation = useMutation({
    mutationFn: (clientData: any) => apiRequest("POST", "/api/clients", clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsClientDialogOpen(false);
      toast({ title: "Client created", description: "New client has been successfully added" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create client", variant: "destructive" });
    },
  });

  // Handlers
  const handleUserSubmit = (userData: any) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: userData });
    } else {
      createUserMutation.mutate(userData);
    }
  };

  const handleInventorySubmit = (itemData: any) => {
    if (editingInventoryItem) {
      updateInventoryMutation.mutate({ id: editingInventoryItem.id, data: itemData });
    } else {
      createInventoryMutation.mutate(itemData);
    }
  };

  const handleProjectSubmit = (projectData: any) => {
    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, ...projectData });
    } else {
      createProjectMutation.mutate(projectData);
    }
  };

  const handleImportInventory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsedData = parseCSV(text);
        
        if (parsedData.length === 0) {
          toast({ title: "Error", description: "No data found in CSV file", variant: "destructive" });
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const item of parsedData) {
          try {
            await apiRequest("POST", "/api/inventory/items", {
              sku: item.sku,
              name: item.name,
              description: item.description || null,
              category: item.category,
              quantityInStock: parseInt(item.quantityInStock) || 0,
              minimumStockLevel: parseInt(item.minimumStockLevel) || 0,
              unitOfMeasure: item.unitOfMeasure || 'piece',
              unitCost: item.unitCost ? parseFloat(item.unitCost) : null,
              supplier: item.supplier || null,
              location: item.location || null,
              notes: item.notes || null,
            });
            successCount++;
          } catch (error) {
            errorCount++;
          }
        }

        queryClient.invalidateQueries({ queryKey: ["/api/inventory/items"] });
        queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });

        toast({
          title: "Import complete",
          description: `Successfully imported ${successCount} items${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        });
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to import inventory", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Get portal name based on role
  const getPortalName = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin Portal';
      case 'manager': return 'Manager Portal';
      case 'employee': return 'Employee Portal';
      case 'sales': return 'Sales Portal';
      case 'project_manager': return 'Project Manager Portal';
      case 'client': return 'Client Portal';
      default: return 'Dashboard';
    }
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'project_manager': return 'Project Manager';
      default: return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const userRole = (typedUser?.role || 'client') as 'client' | 'employee' | 'manager' | 'admin' | 'sales' | 'project_manager';
  const portalName = getPortalName(userRole);
  const roleDisplayName = getRoleDisplayName(userRole);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Main Navigation - Single Row with Hierarchical Structure */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full h-auto p-1 grid gap-1" style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(100px, 1fr))`
          }}>
            <TabsTrigger value="overview" data-testid="tab-overview">
              <Home className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            {hasPermission(userRole, 'viewUsers') && userRole !== 'project_manager' && (
              <TabsTrigger value="users" data-testid="tab-users">
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
            )}
            {(hasPermission(userRole, 'viewClients') || hasPermission(userRole, 'viewLeads') || hasPermission(userRole, 'viewOwnMessages')) && (
              <TabsTrigger value="sales" data-testid="tab-sales">
                <TrendingUp className="w-4 h-4 mr-2" />
                Sales
              </TabsTrigger>
            )}
            {hasPermission(userRole, 'viewOwnProjects') && (
              <TabsTrigger value="projects" data-testid="tab-projects">
                <Wrench className="w-4 h-4 mr-2" />
                Projects
              </TabsTrigger>
            )}
            {hasPermission(userRole, 'viewActivities') && (
              <TabsTrigger value="activities" data-testid="tab-activities">
                <Activity className="w-4 h-4 mr-2" />
                Activities
              </TabsTrigger>
            )}
            {hasPermission(userRole, 'viewInventory') && (
              <TabsTrigger value="inventory" data-testid="tab-inventory">
                <Package className="w-4 h-4 mr-2" />
                Inventory
              </TabsTrigger>
            )}
            {hasPermission(userRole, 'viewSuppliers') && (
              <TabsTrigger value="suppliers" data-testid="tab-suppliers">
                <Truck className="w-4 h-4 mr-2" />
                Suppliers
              </TabsTrigger>
            )}
            {hasPermission(userRole, 'viewFinancial') && (
              <TabsTrigger value="financial" data-testid="tab-financial">
                <DollarSign className="w-4 h-4 mr-2" />
                Financials
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            {userRole === 'admin' && (
              <TabsTrigger value="system" data-testid="tab-system">
                <Server className="w-4 h-4 mr-2" />
                System
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hasPermission(userRole, 'createRequests') && (
                <Card className="hover-elevate" data-testid="card-new-request">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <Plus className="w-5 h-5 mr-2 text-primary" />
                      New Service Request
                    </CardTitle>
                    <CardDescription>Request a quote for security services</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" onClick={() => setLocation('/requests?action=new')} data-testid="button-new-request">
                      Create Request
                    </Button>
                  </CardContent>
                </Card>
              )}
              <Card data-testid="card-active-requests">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="w-5 h-5 mr-2 text-primary" />
                    Active Requests
                  </CardTitle>
                  <CardDescription>
                    {hasPermission(userRole, 'viewAllRequests') ? 'All pending requests' : 'Your open requests'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-active-count">
                    {dashboardData?.pendingRequests?.length || dashboardData?.activeRequests?.length || 0}
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-active-projects">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Wrench className="w-5 h-5 mr-2 text-primary" />
                    Active Projects
                  </CardTitle>
                  <CardDescription>
                    {hasPermission(userRole, 'viewAllProjects') ? 'All ongoing projects' : 'Your active projects'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-projects-count">
                    {dashboardData?.activeProjects?.length || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
            {dashboardData?.activeRequests && dashboardData.activeRequests.length > 0 && (
              <Card data-testid="card-active-requests-overview">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    {hasPermission(userRole, 'viewAllRequests') ? 'Recent Requests' : 'Your Active Requests'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4" data-testid="list-active-requests">
                    {dashboardData?.activeRequests?.slice(0, 3).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 rounded-lg border hover-elevate">
                        <div className="flex-1">
                          <h4 className="font-medium">{request.title}</h4>
                          <p className="text-sm text-muted-foreground capitalize">
                            {request.serviceType?.replace('_', ' ')} • {request.priority} priority
                          </p>
                          {request.quotedAmount && (
                            <p className="text-sm font-medium text-green-600 mt-1">Quote: ${request.quotedAmount}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary">{request.status?.replace('_', ' ')}</Badge>
                          <Button size="sm" variant="outline" onClick={() => setLocation('/requests')} data-testid={`button-view-request-${request.id}`}>
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            <Card data-testid="card-recent-activity">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardData?.recentCommunications?.length ? (
                  <div className="space-y-4" data-testid="list-recent-activity">
                    {dashboardData.recentCommunications.slice(0, 5).map((comm) => (
                      <div key={comm.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm">{comm.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {comm.createdAt ? new Date(comm.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8" data-testid="text-no-activity">No recent activity to display</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <UsersManager />
          </TabsContent>

          {/* Sales Tab - Nested structure */}
          <TabsContent value="sales" className="space-y-4">
            <Tabs defaultValue="quotes" className="w-full">
              <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                <TabsTrigger value="quotes" data-testid="tab-sales-quotes">
                  <FileText className="w-4 h-4 mr-2" />
                  Quotes
                </TabsTrigger>
                <TabsTrigger value="invoices" data-testid="tab-sales-invoices">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Invoices
                </TabsTrigger>
                <TabsTrigger value="services" data-testid="tab-sales-services">
                  <Wrench className="w-4 h-4 mr-2" />
                  Services
                </TabsTrigger>
                {hasPermission(userRole, 'viewClients') && (
                  <TabsTrigger value="clients" data-testid="tab-sales-clients">
                    <UserCircle className="w-4 h-4 mr-2" />
                    Clients
                  </TabsTrigger>
                )}
                {hasPermission(userRole, 'viewLeads') && (
                  <TabsTrigger value="leads" data-testid="tab-sales-leads">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Leads
                  </TabsTrigger>
                )}
                <TabsTrigger value="referrals" data-testid="tab-sales-referrals">
                  <Gift className="w-4 h-4 mr-2" />
                  Referrals
                </TabsTrigger>
              </TabsList>

              {/* Quotes Sub-Tab with nested Create/Manage/Promo */}
              <TabsContent value="quotes" className="mt-4">
                <Tabs defaultValue="manage-quotes" className="w-full">
                  <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                    <TabsTrigger value="create-quote" data-testid="tab-sales-quotes-create">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Quote
                    </TabsTrigger>
                    <TabsTrigger value="promo-quote" data-testid="tab-sales-quotes-promo">
                      <Gift className="w-4 h-4 mr-2" />
                      Promo Quote
                    </TabsTrigger>
                    <TabsTrigger value="manage-quotes" data-testid="tab-sales-quotes-manage">
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Manage Quotes
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="create-quote" className="mt-4">
                    <QuoteBuilder />
                  </TabsContent>

                  <TabsContent value="promo-quote" className="mt-4">
                    <PromoQuoteBuilder />
                  </TabsContent>

                  <TabsContent value="manage-quotes" className="mt-4">
                    <QuotesManager />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Invoices Sub-Tab with nested Create/Manage */}
              <TabsContent value="invoices" className="mt-4">
                <Tabs defaultValue="manage-invoices" className="w-full">
                  <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                    <TabsTrigger value="create-invoice" data-testid="tab-sales-invoices-create">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Invoice
                    </TabsTrigger>
                    <TabsTrigger value="manage-invoices" data-testid="tab-sales-invoices-manage">
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Manage Invoices
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="create-invoice" className="mt-4">
                    <InvoiceBuilder />
                  </TabsContent>

                  <TabsContent value="manage-invoices" className="mt-4">
                    <InvoicesManager />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Services Sub-Tab with nested Service Types/Price Matrix */}
              <TabsContent value="services" className="mt-4">
                <Tabs defaultValue="service-types" className="w-full">
                  <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                    <TabsTrigger value="service-types" data-testid="tab-sales-services-types">
                      <Wrench className="w-4 h-4 mr-2" />
                      Service Types
                    </TabsTrigger>
                    <TabsTrigger value="price-matrix" data-testid="tab-sales-services-matrix">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Price Matrix
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="service-types" className="mt-4">
                    <ServiceTypesManager />
                  </TabsContent>

                  <TabsContent value="price-matrix" className="mt-4">
                    <PriceMatrixManager />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Clients Sub-Tab - Direct access */}
              {hasPermission(userRole, 'viewClients') && (
                <TabsContent value="clients" className="mt-4">
                  <ClientsManager />
                </TabsContent>
              )}

              {/* Leads Sub-Tab with nested Overview/Messages */}
              {hasPermission(userRole, 'viewLeads') && (
                <TabsContent value="leads" className="mt-4">
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                      <TabsTrigger value="overview" data-testid="tab-sales-leads-overview">
                        <Eye className="w-4 h-4 mr-2" />
                        Overview
                      </TabsTrigger>
                      {hasPermission(userRole, 'viewOwnMessages') && (
                        <TabsTrigger value="messages" data-testid="tab-sales-leads-messages">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Messages
                        </TabsTrigger>
                      )}
                    </TabsList>

                    <TabsContent value="overview" className="mt-4">
                      <LeadsManager />
                    </TabsContent>

                    {hasPermission(userRole, 'viewOwnMessages') && (
                      <TabsContent value="messages" className="mt-4">
                        <MessagesManager />
                      </TabsContent>
                    )}
                  </Tabs>
                </TabsContent>
              )}

              {/* Referrals Sub-Tab with nested Track/Manage */}
              <TabsContent value="referrals" className="mt-4">
                {/* Referral Metrics Dashboard (Admin Only) */}
                {userRole === 'admin' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Total Referrals Card */}
                    <Card data-testid="card-total-referrals">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                        <Gift className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        {referralMetricsLoading ? (
                          <div className="text-2xl font-bold">...</div>
                        ) : (
                          <div className="text-2xl font-bold" data-testid="text-total-referrals">
                            {referralMetrics?.totalReferrals || 0}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Pending Referrals Card */}
                    <Card data-testid="card-pending-referrals">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        {referralMetricsLoading ? (
                          <div className="text-2xl font-bold">...</div>
                        ) : (
                          <div className="text-2xl font-bold" data-testid="text-pending-referrals">
                            {referralMetrics?.pendingReferrals || 0}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Converted Referrals Card */}
                    <Card data-testid="card-converted-referrals">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Converted</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        {referralMetricsLoading ? (
                          <div className="text-2xl font-bold">...</div>
                        ) : (
                          <div className="text-2xl font-bold" data-testid="text-converted-referrals">
                            {referralMetrics?.convertedReferrals || 0}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Conversion Rate Card */}
                    <Card data-testid="card-conversion-rate">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        {referralMetricsLoading ? (
                          <div className="text-2xl font-bold">...</div>
                        ) : (
                          <div className="text-2xl font-bold" data-testid="text-conversion-rate">
                            {referralMetrics?.conversionRate || 0}%
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Tabs defaultValue="track-referrals" className="w-full">
                  <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                    <TabsTrigger value="track-referrals" data-testid="tab-sales-referrals-track">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Track Referrals
                    </TabsTrigger>
                    {hasPermission(userRole, 'manageLeads') && (
                      <>
                        <TabsTrigger value="referrees" data-testid="tab-sales-referrals-referrees">
                          <Users className="w-4 h-4 mr-2" />
                          Referrees
                        </TabsTrigger>
                        <TabsTrigger value="manage-programs" data-testid="tab-sales-referrals-programs">
                          <Settings className="w-4 h-4 mr-2" />
                          Manage Programs
                        </TabsTrigger>
                      </>
                    )}
                  </TabsList>

                  <TabsContent value="track-referrals" className="mt-4">
                    <ReferralTracker />
                  </TabsContent>

                  {hasPermission(userRole, 'manageLeads') && (
                    <>
                      <TabsContent value="referrees" className="mt-4">
                        <ReferreesManager />
                      </TabsContent>
                      
                      <TabsContent value="manage-programs" className="mt-4">
                        <ReferralProgramManager />
                      </TabsContent>
                    </>
                  )}
                </Tabs>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Projects Tab - Nested structure */}
          <TabsContent value="projects" className="space-y-4">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                <TabsTrigger value="overview" data-testid="tab-projects-overview">
                  <Eye className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                {hasPermission(userRole, 'viewOwnTasks') && (
                  <TabsTrigger value="tasks" data-testid="tab-projects-tasks">
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Tasks
                  </TabsTrigger>
                )}
                {hasPermission(userRole, 'viewOwnReports') && (
                  <TabsTrigger value="reports" data-testid="tab-projects-reports">
                    <FileText className="w-4 h-4 mr-2" />
                    Reports
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Projects Overview Sub-Tab */}
              <TabsContent value="overview" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0 pb-4">
                    <div>
                      <CardTitle>Projects Overview</CardTitle>
                      <CardDescription>
                        {hasPermission(userRole, 'viewAllProjects') ? 'All project records' : 'Your assigned projects'}
                      </CardDescription>
                    </div>
                    {hasPermission(userRole, 'manageAllProjects') && (
                      <Button onClick={() => { setEditingProject(undefined); setIsProjectDialogOpen(true); }} data-testid="button-create-project">
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Project
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {projects.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No projects found</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ticket #</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Start Date</TableHead>
                            {hasPermission(userRole, 'manageAllProjects') && <TableHead className="text-right">Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projects.slice(0, 10).map((project) => (
                            <TableRow key={project.id}>
                              <TableCell className="font-mono">{project.ticketNumber}</TableCell>
                              <TableCell>{project.projectName || '-'}</TableCell>
                              <TableCell>{(project as any).clientName || '-'}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{project.status}</Badge>
                              </TableCell>
                              <TableCell>{project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}</TableCell>
                              {hasPermission(userRole, 'manageAllProjects') && (
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => { 
                                      setEditingProject(project); 
                                      setIsProjectDialogOpen(true); 
                                    }} 
                                    data-testid={`button-edit-project-${project.id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tasks Sub-Tab */}
              {hasPermission(userRole, 'viewOwnTasks') && (
                <TabsContent value="tasks" className="mt-4">
                  {typedUser && (
                    <TasksManager role={userRole as "manager" | "admin"} userId={typedUser.id} />
                  )}
                </TabsContent>
              )}

              {/* Reports Sub-Tab */}
              {hasPermission(userRole, 'viewOwnReports') && (
                <TabsContent value="reports" className="mt-4">
                  {typedUser && <ReportsManager role={userRole as "manager" | "admin"} userId={typedUser.id} />}
                </TabsContent>
              )}
            </Tabs>
          </TabsContent>

          {/* Activities Tab - Nested structure */}
          <TabsContent value="activities" className="space-y-4">
            <Tabs defaultValue="logs" className="w-full">
              <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                <TabsTrigger value="logs" data-testid="tab-activities-logs">
                  <Activity className="w-4 h-4 mr-2" />
                  Logs
                </TabsTrigger>
                {hasPermission(userRole, 'viewVisitors') && (
                  <TabsTrigger value="visitors" data-testid="tab-activities-visitors">
                    <BarChart className="w-4 h-4 mr-2" />
                    Visitors
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Activity Logs Sub-Tab */}
              <TabsContent value="logs" className="mt-4">
                <ActivitiesManager />
              </TabsContent>

              {/* Visitors Sub-Tab */}
              {hasPermission(userRole, 'viewVisitors') && (
                <TabsContent value="visitors" className="mt-4">
                  <VisitorsManager />
                </TabsContent>
              )}
            </Tabs>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-4">
            {lowStockItems.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Low Stock Alert
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {lowStockItems.length} items at or below minimum stock level
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            )}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0 pb-4">
                <div>
                  <CardTitle>Inventory Management</CardTitle>
                  <CardDescription>Manage equipment and parts inventory</CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => exportToCSV(inventoryItems, 'inventory')} data-testid="button-export-inventory">
                    <Download className="w-4 h-4 mr-2" />Export
                  </Button>
                  <Button variant="outline" onClick={downloadInventoryTemplate} data-testid="button-template-inventory">
                    <FileDown className="w-4 h-4 mr-2" />Template
                  </Button>
                  <Button variant="outline" onClick={() => document.getElementById('inventory-import')?.click()} data-testid="button-import-inventory">
                    <Upload className="w-4 h-4 mr-2" />Import
                  </Button>
                  <input id="inventory-import" type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImportInventory} />
                  <Button onClick={() => { setEditingInventoryItem(undefined); setIsInventoryDialogOpen(true); }} data-testid="button-add-inventory">
                    <Package className="w-4 h-4 mr-2" />Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {inventoryLoading ? (
                  <p className="text-sm text-muted-foreground">Loading inventory...</p>
                ) : inventoryItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No inventory items yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Min Stock</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryItems.map((item) => (
                        <TableRow key={item.id} data-testid={`row-inventory-${item.id}`} className={(item.quantityInStock ?? 0) <= (item.minimumStockLevel ?? 0) ? "bg-yellow-50 dark:bg-yellow-950" : ""}>
                          <TableCell className="font-mono">{item.sku}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.quantityInStock} {item.unitOfMeasure}</TableCell>
                          <TableCell>{item.minimumStockLevel}</TableCell>
                          <TableCell>{item.unitCost ? `$${Number(item.unitCost).toFixed(2)}` : '-'}</TableCell>
                          <TableCell>{item.supplier || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="sm" onClick={() => { setEditingInventoryItem(item); setIsInventoryDialogOpen(true); }} data-testid={`button-edit-inventory-${item.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteInventoryMutation.mutate(item.id)} data-testid={`button-delete-inventory-${item.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-4">
            <SuppliersManager />
          </TabsContent>

          {/* Financial Tab - Nested structure */}
          <TabsContent value="financial" className="space-y-4">
            {/* Financial Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card data-testid="card-total-expenses">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <TrendingDown className="w-4 h-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-expenses">
                    {financialMetricsLoading ? "..." : `$${(financialMetrics?.totalExpenses || 0).toFixed(2)}`}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-total-revenue">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-revenue">
                    {financialMetricsLoading ? "..." : `$${(financialMetrics?.totalRevenue || 0).toFixed(2)}`}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-net-profit">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  <DollarSign className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "text-2xl font-bold",
                    (financialMetrics?.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600"
                  )} data-testid="text-net-profit">
                    {financialMetricsLoading ? "..." : `$${(financialMetrics?.netProfit || 0).toFixed(2)}`}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-monthly-trend">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Trend</CardTitle>
                  <BarChart className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-monthly-trend">
                    {financialMetricsLoading ? "..." : `${(financialMetrics?.monthlyTrend || 0) >= 0 ? "+" : ""}${(financialMetrics?.monthlyTrend || 0).toFixed(1)}%`}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Nested Tabs for Expenses, Revenue, and Logs */}
            <Tabs defaultValue="expenses" className="w-full">
              <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                <TabsTrigger value="expenses" data-testid="tab-financial-expenses">
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Expenses
                </TabsTrigger>
                <TabsTrigger value="revenue" data-testid="tab-financial-revenue">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Revenue
                </TabsTrigger>
                <TabsTrigger value="logs" data-testid="tab-financial-logs">
                  <FileText className="w-4 h-4 mr-2" />
                  Logs
                </TabsTrigger>
              </TabsList>

              {/* Expenses Sub-Tab */}
              <TabsContent value="expenses" className="mt-4">
                <ExpensesManager />
              </TabsContent>

              {/* Revenue Sub-Tab */}
              <TabsContent value="revenue" className="mt-4">
                <RevenueManager />
              </TabsContent>

              {/* Financial Logs Sub-Tab */}
              <TabsContent value="logs" className="mt-4">
                <FinancialLogs />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
                <TabsTrigger value="profile" data-testid="subtab-profile">
                  <UserCircle className="w-4 h-4 mr-2" />
                  Profile
                </TabsTrigger>
                {typedUser?.role && hasPermission(typedUser.role, 'manageSettings') && (
                  <>
                    <TabsTrigger value="company" data-testid="subtab-company">
                      <Settings className="w-4 h-4 mr-2" />
                      Company Settings
                    </TabsTrigger>
                    <TabsTrigger value="logos" data-testid="subtab-logos">
                      <Upload className="w-4 h-4 mr-2" />
                      Logos
                    </TabsTrigger>
                    <TabsTrigger value="certifications" data-testid="subtab-certifications">
                      <FileText className="w-4 h-4 mr-2" />
                      Certifications
                    </TabsTrigger>
                    <TabsTrigger value="team" data-testid="subtab-team">
                      <Users className="w-4 h-4 mr-2" />
                      Team Members
                    </TabsTrigger>
                    <TabsTrigger value="legal" data-testid="subtab-legal">
                      <FileText className="w-4 h-4 mr-2" />
                      Legal
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>User Profile</CardTitle>
                    <CardDescription>View and update your personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {typedUser && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <p className="text-lg">{typedUser.email}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Role</label>
                            <p className="text-lg capitalize">{typedUser.role}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">First Name</label>
                            <p className="text-lg">{typedUser.firstName || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                            <p className="text-lg">{typedUser.lastName || '-'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Phone</label>
                            <p className="text-lg">{typedUser.phone || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Company</label>
                            <p className="text-lg">{typedUser.company || '-'}</p>
                          </div>
                        </div>
                        <div className="pt-4 border-t">
                          <Button 
                            onClick={() => { 
                              setEditingUser(typedUser); 
                              setIsUserDialogOpen(true); 
                            }}
                            data-testid="button-edit-profile"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Update Profile
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Company Settings Tab */}
              {typedUser?.role && hasPermission(typedUser.role, 'manageSettings') && (
                <TabsContent value="company" className="space-y-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
                      <div>
                        <CardTitle>Company Settings</CardTitle>
                        <CardDescription>
                          Manage company information and branding
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={() => setIsAppConfigDialogOpen(true)}
                        data-testid="button-edit-company-settings"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Settings
                      </Button>
                    </CardHeader>
                  </Card>
                  <AppConfigDialog 
                    open={isAppConfigDialogOpen} 
                    onOpenChange={setIsAppConfigDialogOpen}
                  />
                  <LogoUploadDialog
                    open={isLogoUploadDialogOpen}
                    onOpenChange={setIsLogoUploadDialogOpen}
                  />
                </TabsContent>
              )}

              {/* Logos Tab */}
              {typedUser?.role && hasPermission(typedUser.role, 'manageSettings') && (
                <TabsContent value="logos" className="space-y-4">
                  <LogoUploadManager />
                </TabsContent>
              )}

              {/* Certifications Tab */}
              {typedUser?.role && hasPermission(typedUser.role, 'manageSettings') && (
                <TabsContent value="certifications" className="space-y-4">
                  <CertificationsManager />
                </TabsContent>
              )}

              {/* Team Members Tab */}
              {typedUser?.role && hasPermission(typedUser.role, 'manageSettings') && (
                <TabsContent value="team" className="space-y-4">
                  <TeamMembersManager />
                </TabsContent>
              )}

              {/* Legal Tab */}
              {typedUser?.role && hasPermission(typedUser.role, 'manageSettings') && (
                <TabsContent value="legal" className="space-y-4">
                  <LegalManager />
                </TabsContent>
              )}
            </Tabs>
          </TabsContent>

          {/* System Tab (Admin Only) */}
          {userRole === 'admin' && (
            <TabsContent value="system" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Users Card */}
                <Card data-testid="card-total-users">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {systemMetricsLoading ? (
                      <div className="text-2xl font-bold">...</div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold" data-testid="text-total-users">
                          {systemMetrics?.totalUsers || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          +{systemMetrics?.usersThisMonth || 0} this month
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* System Health Card */}
                <Card data-testid="card-system-health">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Health</CardTitle>
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {systemMetricsLoading ? (
                      <div className="text-2xl font-bold">...</div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold" data-testid="text-system-health">
                          {systemMetrics?.systemHealthPercent || 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          All systems operational
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Database Storage Card */}
                <Card data-testid="card-database-storage">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Database</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {systemMetricsLoading ? (
                      <div className="text-2xl font-bold">...</div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold" data-testid="text-database-size">
                          {systemMetrics?.databaseSizeGB?.toFixed(2) || '0.00'}GB
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Storage used
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Active Sessions Card */}
                <Card data-testid="card-active-sessions">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {systemMetricsLoading ? (
                      <div className="text-2xl font-bold">...</div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold" data-testid="text-active-sessions">
                          {systemMetrics?.activeSessions || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Currently logged in
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Dialogs */}
        <UserDialog
          open={isUserDialogOpen}
          onOpenChange={setIsUserDialogOpen}
          onSubmit={handleUserSubmit}
          user={editingUser}
          isPending={createUserMutation.isPending || updateUserMutation.isPending}
        />
        <InventoryDialog
          open={isInventoryDialogOpen}
          onOpenChange={setIsInventoryDialogOpen}
          onSubmit={handleInventorySubmit}
          item={editingInventoryItem}
          isPending={createInventoryMutation.isPending || updateInventoryMutation.isPending}
        />
        <ProjectDialog
          open={isProjectDialogOpen}
          onOpenChange={setIsProjectDialogOpen}
          onSubmit={handleProjectSubmit}
          isPending={createProjectMutation.isPending || updateProjectMutation.isPending}
          project={editingProject}
        />
        <ClientDialog
          open={isClientDialogOpen}
          onOpenChange={setIsClientDialogOpen}
          onSubmit={createClientMutation.mutate}
          isPending={createClientMutation.isPending}
        />
        <AppConfigDialog
          open={isAppConfigDialogOpen}
          onOpenChange={setIsAppConfigDialogOpen}
        />
        <LogoUploadDialog
          open={isLogoUploadDialogOpen}
          onOpenChange={setIsLogoUploadDialogOpen}
        />
      </div>
    </div>
  );
}
