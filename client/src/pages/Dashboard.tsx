import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "wouter";
import { 
  Plus, FileText, Wrench, Clock, Users, ClipboardList, 
  DollarSign, MessageSquare, BarChart, Package 
} from "lucide-react";
import type { User, ServiceRequest, Project, Communication } from "@shared/schema";
import { hasPermission } from "@shared/permissions";

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
  
  // Fetch dashboard data based on user role
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: [typedUser?.role === 'admin' ? '/api/dashboard/admin' : '/api/dashboard/client'],
    enabled: !!typedUser,
  });

  // Get portal name based on role
  const getPortalName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin Portal';
      case 'manager':
        return 'Manager Portal';
      case 'employee':
        return 'Employee Portal';
      case 'sales':
        return 'Sales Portal';
      case 'project_manager':
        return 'Project Manager Portal';
      case 'client':
        return 'Client Portal';
      default:
        return 'Dashboard';
    }
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'project_manager':
        return 'Project Manager';
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
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

  const userRole = typedUser?.role || 'client';
  const portalName = getPortalName(userRole);
  const roleDisplayName = getRoleDisplayName(userRole);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Portal Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight" data-testid="text-portal-name">
                {portalName}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="default" data-testid="badge-user-role-display">
                  {roleDisplayName}
                </Badge>
                <span className="text-muted-foreground">
                  Welcome, {typedUser?.firstName || typedUser?.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Role-based Tabular Navigation */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full gap-2" style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(120px, 1fr))`
          }}>
            <TabsTrigger value="overview" data-testid="tab-overview">
              <BarChart className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>

            {/* Requests Tab - for roles that can view requests */}
            {(hasPermission(userRole, 'viewOwnRequests') || hasPermission(userRole, 'viewAllRequests')) && (
              <TabsTrigger value="requests" data-testid="tab-requests">
                <FileText className="w-4 h-4 mr-2" />
                Requests
              </TabsTrigger>
            )}

            {/* Projects Tab - for roles that can view projects */}
            {(hasPermission(userRole, 'viewOwnProjects') || hasPermission(userRole, 'viewAllProjects')) && (
              <TabsTrigger value="projects" data-testid="tab-projects">
                <Wrench className="w-4 h-4 mr-2" />
                Projects
              </TabsTrigger>
            )}

            {/* Tasks Tab - for employee, manager, project_manager, admin */}
            {['employee', 'manager', 'project_manager', 'admin'].includes(userRole) && (
              <TabsTrigger value="tasks" data-testid="tab-tasks">
                <ClipboardList className="w-4 h-4 mr-2" />
                Tasks
              </TabsTrigger>
            )}

            {/* Reports Tab - for employee, manager, project_manager, admin */}
            {['employee', 'manager', 'project_manager', 'admin'].includes(userRole) && (
              <TabsTrigger value="reports" data-testid="tab-reports">
                <FileText className="w-4 h-4 mr-2" />
                Reports
              </TabsTrigger>
            )}

            {/* Users/Employees Tab - for roles with user management */}
            {hasPermission(userRole, 'viewUsers') && (
              <TabsTrigger value="users" data-testid="tab-users">
                <Users className="w-4 h-4 mr-2" />
                {userRole === 'admin' ? 'Users' : 'Employees'}
              </TabsTrigger>
            )}

            {/* Inventory Tab - for manager, project_manager, admin */}
            {['manager', 'project_manager', 'admin'].includes(userRole) && (
              <TabsTrigger value="inventory" data-testid="tab-inventory">
                <Package className="w-4 h-4 mr-2" />
                Inventory
              </TabsTrigger>
            )}

            {/* Financial Tab - for sales, manager, admin */}
            {['sales', 'manager', 'admin'].includes(userRole) && (
              <TabsTrigger value="financial" data-testid="tab-financial">
                <DollarSign className="w-4 h-4 mr-2" />
                Financial
              </TabsTrigger>
            )}

            {/* Messages Tab - all authenticated users */}
            <TabsTrigger value="messages" data-testid="tab-messages">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hasPermission(userRole, 'createRequests') && (
                <Card className="hover-elevate" data-testid="card-new-request">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <Plus className="w-5 h-5 mr-2 text-primary" />
                      New Service Request
                    </CardTitle>
                    <CardDescription>
                      Request a quote for security services
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/requests?action=new">
                      <Button className="w-full" data-testid="button-new-request">
                        Create Request
                      </Button>
                    </Link>
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

            {/* Active Requests Overview */}
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
                            <p className="text-sm font-medium text-green-600 mt-1">
                              Quote: ${request.quotedAmount}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary">
                            {request.status?.replace('_', ' ')}
                          </Badge>
                          <Link href="/requests">
                            <Button size="sm" variant="outline" data-testid={`button-view-request-${request.id}`}>
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  {dashboardData?.activeRequests && dashboardData.activeRequests.length > 3 && (
                    <div className="mt-4 text-center">
                      <Link href="/requests">
                        <Button variant="outline" data-testid="button-view-all-requests">
                          View All Requests ({dashboardData?.activeRequests?.length || 0})
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
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
                  <p className="text-muted-foreground text-center py-8" data-testid="text-no-activity">
                    No recent activity to display
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab Content */}
          <TabsContent value="requests" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Requests</CardTitle>
                <CardDescription>
                  {hasPermission(userRole, 'viewAllRequests') 
                    ? 'Manage all service requests' 
                    : 'View and manage your service requests'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/requests">
                  <Button data-testid="button-go-to-requests">
                    Go to Requests
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab Content */}
          <TabsContent value="projects" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
                <CardDescription>
                  {hasPermission(userRole, 'viewAllProjects') 
                    ? 'Manage all projects' 
                    : 'View your assigned projects'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/projects">
                  <Button data-testid="button-go-to-projects">
                    Go to Projects
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab Content */}
          <TabsContent value="tasks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>
                  Manage project tasks and assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin">
                  <Button data-testid="button-go-to-tasks">
                    Go to Tasks
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab Content */}
          <TabsContent value="reports" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>
                  {userRole === 'employee' 
                    ? 'Submit work reports' 
                    : 'Review and approve employee reports'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin">
                  <Button data-testid="button-go-to-reports">
                    Go to Reports
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab Content */}
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{userRole === 'admin' ? 'Users' : 'Employees'}</CardTitle>
                <CardDescription>
                  {userRole === 'admin' 
                    ? 'Manage all system users' 
                    : 'View and manage employees'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin">
                  <Button data-testid="button-go-to-users">
                    Go to {userRole === 'admin' ? 'Users' : 'Employees'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab Content */}
          <TabsContent value="inventory" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>
                  Manage inventory items and stock levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin">
                  <Button data-testid="button-go-to-inventory">
                    Go to Inventory
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab Content */}
          <TabsContent value="financial" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Management</CardTitle>
                <CardDescription>
                  {userRole === 'sales' 
                    ? 'View sales and financial data' 
                    : 'Manage financial records and audit logs'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin">
                  <Button data-testid="button-go-to-financial">
                    Go to Financial
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab Content */}
          <TabsContent value="messages" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Messages & Communications</CardTitle>
                <CardDescription>
                  View and manage messages and inquiries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin">
                  <Button data-testid="button-go-to-messages">
                    Go to Messages
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
