import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  UserPlus, Download, AlertTriangle, FileDown, Upload
} from "lucide-react";
import type { User, ServiceRequest, Project, Communication, Visitor, InventoryItem, FinancialLog } from "@shared/schema";
import { hasPermission } from "@shared/permissions";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { exportToCSV, downloadInventoryTemplate, parseCSV } from "@/lib/exportUtils";
import { UserDialog } from "@/components/UserDialog";
import { InventoryDialog } from "@/components/InventoryDialog";
import { ProjectDialog } from "@/components/ProjectDialog";
import { ClientDialog } from "@/components/ClientDialog";
import ReportsManager from "@/components/ReportsManager";
import { TasksManager } from "@/components/TasksManager";
import MessagesManager from "@/components/MessagesManager";
import LeadsManager from "@/components/LeadsManager";
import ClientsManager from "@/components/ClientsManager";
import SuppliersManager from "@/components/SuppliersManager";

interface DashboardData {
  pendingRequests?: ServiceRequest[];
  activeRequests?: ServiceRequest[];
  activeProjects?: Project[];
  recentCommunications?: Communication[];
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
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  
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
      toast({ title: "Project created", description: "New project has been successfully created" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create project", variant: "destructive" });
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
        {/* Role-based Tabular Navigation - Two Rows */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="space-y-2 mb-6">
            {/* Row 1 */}
            <TabsList className="w-full h-auto p-1 grid gap-1" style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(100px, 1fr))`
            }}>
              {hasPermission(userRole, 'viewUsers') && userRole !== 'project_manager' && (
                <TabsTrigger value="users" data-testid="tab-users">
                  <Users className="w-4 h-4 mr-2" />
                  Users
                </TabsTrigger>
              )}
              {hasPermission(userRole, 'viewOwnTasks') && (
                <TabsTrigger value="tasks" data-testid="tab-tasks">
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Tasks
                </TabsTrigger>
              )}
              {hasPermission(userRole, 'viewOwnProjects') && (
                <TabsTrigger value="projects" data-testid="tab-projects">
                  <Wrench className="w-4 h-4 mr-2" />
                  Projects
                </TabsTrigger>
              )}
              {hasPermission(userRole, 'viewOwnReports') && (
                <TabsTrigger value="reports" data-testid="tab-reports">
                  <FileText className="w-4 h-4 mr-2" />
                  Reports
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
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/')}
                className="h-9"
                data-testid="button-goto-home"
              >
                <Home className="w-4 h-4" />
              </Button>
            </TabsList>

            {/* Row 2 */}
            <TabsList className="w-full h-auto p-1 grid gap-1" style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(100px, 1fr))`
            }}>
              {hasPermission(userRole, 'viewOwnMessages') && (
                <TabsTrigger value="messages" data-testid="tab-messages">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Messages
                </TabsTrigger>
              )}
              {hasPermission(userRole, 'viewClients') && (
                <TabsTrigger value="clients" data-testid="tab-clients">
                  <UserCircle className="w-4 h-4 mr-2" />
                  Clients
                </TabsTrigger>
              )}
              {hasPermission(userRole, 'viewLeads') && (
                <TabsTrigger value="leads" data-testid="tab-leads">
                  <BarChart className="w-4 h-4 mr-2" />
                  Leads
                </TabsTrigger>
              )}
              {hasPermission(userRole, 'viewVisitors') && (
                <TabsTrigger value="visitors" data-testid="tab-visitors">
                  <Eye className="w-4 h-4 mr-2" />
                  Visitors
                </TabsTrigger>
              )}
              {hasPermission(userRole, 'viewFinancial') && (
                <TabsTrigger value="financial" data-testid="tab-financial">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Financial
                </TabsTrigger>
              )}
              {hasPermission(userRole, 'viewActivities') && (
                <TabsTrigger value="activities" data-testid="tab-activities">
                  <Activity className="w-4 h-4 mr-2" />
                  Activities
                </TabsTrigger>
              )}
              <TabsTrigger value="settings" data-testid="tab-settings" className="px-3">
                <Settings className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </div>

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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage all system users and their roles</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => exportToCSV(users, 'users')} data-testid="button-export-users">
                    <Download className="w-4 h-4 mr-2" />Export
                  </Button>
                  <Button onClick={() => { setEditingUser(undefined); setIsUserDialogOpen(true); }} data-testid="button-add-user">
                    <UserPlus className="w-4 h-4 mr-2" />Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <p className="text-sm text-muted-foreground">Loading users...</p>
                ) : users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                          <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                          <TableCell data-testid={`text-email-${u.id}`}>{u.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" data-testid={`badge-role-${u.id}`}>{u.role}</Badge>
                          </TableCell>
                          <TableCell>{u.company || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="sm" onClick={() => { setEditingUser(u); setIsUserDialogOpen(true); }} data-testid={`button-edit-${u.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" disabled={u.id === typedUser?.id} onClick={() => deleteUserMutation.mutate(u.id)} data-testid={`button-delete-${u.id}`}>
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

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            {typedUser && (
              <TasksManager role={userRole as "manager" | "admin"} userId={typedUser.id} />
            )}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap space-y-0 pb-4">
                <div>
                  <CardTitle>Projects Overview</CardTitle>
                  <CardDescription>
                    {hasPermission(userRole, 'viewAllProjects') ? 'All project records' : 'Your assigned projects'}
                  </CardDescription>
                </div>
                {hasPermission(userRole, 'manageAllProjects') && (
                  <Button onClick={() => setIsProjectDialogOpen(true)} data-testid="button-create-project">
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.slice(0, 10).map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-mono">{project.ticketNumber}</TableCell>
                          <TableCell>{project.projectName || '-'}</TableCell>
                          <TableCell>{project.serviceRequestId || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{project.status}</Badge>
                          </TableCell>
                          <TableCell>{project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            {typedUser && <ReportsManager role={userRole as "manager" | "admin"} userId={typedUser.id} />}
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

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            <MessagesManager />
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            <ClientsManager />
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-4">
            <LeadsManager />
          </TabsContent>

          {/* Visitors Tab */}
          <TabsContent value="visitors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Visitor Analytics</CardTitle>
                <CardDescription>Recent visitor activity</CardDescription>
              </CardHeader>
              <CardContent>
                {visitorsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading visitors...</p>
                ) : visitors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No visitor data available</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Path</TableHead>
                        <TableHead>Referrer</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visitors.slice(0, 10).map((visitor) => (
                        <TableRow key={visitor.id}>
                          <TableCell className="font-mono">{visitor.ipAddress || '-'}</TableCell>
                          <TableCell>{visitor.landingPage || '-'}</TableCell>
                          <TableCell>{visitor.referrer || '-'}</TableCell>
                          <TableCell>{visitor.visitedAt ? new Date(visitor.visitedAt).toLocaleString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Logs (Read-Only)</CardTitle>
                <CardDescription>Audit trail of all financial transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {financialLogsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading financial logs...</p>
                ) : financialLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No financial logs found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Ticket #</TableHead>
                        <TableHead>User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialLogs.slice(0, 10).map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{log.createdAt ? new Date(log.createdAt).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{log.logType}</Badge>
                          </TableCell>
                          <TableCell className="font-mono">
                            {log.previousValue && log.newValue 
                              ? `$${log.previousValue} → $${log.newValue}`
                              : log.newValue 
                                ? `$${log.newValue}`
                                : '-'
                            }
                          </TableCell>
                          <TableCell>{log.description}</TableCell>
                          <TableCell className="font-mono">{log.entityId || '-'}</TableCell>
                          <TableCell>{log.userId}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Activity Logs</CardTitle>
                <CardDescription>Track all system activities and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">Activity logging feature coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
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
          onSubmit={createProjectMutation.mutate}
          isPending={createProjectMutation.isPending}
        />
        <ClientDialog
          open={isClientDialogOpen}
          onOpenChange={setIsClientDialogOpen}
          onSubmit={createClientMutation.mutate}
          isPending={createClientMutation.isPending}
        />
      </div>
    </div>
  );
}
