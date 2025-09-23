import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Plus, FileText, Wrench, Clock } from "lucide-react";
import type { User, ServiceRequest, Project, Communication } from "@shared/schema";

interface DashboardData {
  pendingRequests?: ServiceRequest[];
  activeRequests?: ServiceRequest[];
  activeProjects?: Project[];
  recentCommunications?: Communication[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const typedUser = user as User | undefined;
  
  // Fetch dashboard data based on user role
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: [typedUser?.role === 'admin' ? '/api/dashboard/admin' : '/api/dashboard/client'],
    enabled: !!typedUser,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            {typedUser?.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}
          </h2>
          <p className="text-muted-foreground">
            {typedUser?.role === 'admin' 
              ? 'Manage all service requests and projects'
              : 'Track your service requests and projects'
            }
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover-elevate" data-testid="card-new-request">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <Plus className="w-5 h-5 mr-2 text-blue-600" />
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

          <Card data-testid="card-active-requests">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <FileText className="w-5 h-5 mr-2 text-green-600" />
                Active Requests
              </CardTitle>
              <CardDescription>
                {typedUser?.role === 'admin' ? 'Pending client requests' : 'Your open requests'}
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
                <Wrench className="w-5 h-5 mr-2 text-orange-600" />
                Active Projects
              </CardTitle>
              <CardDescription>
                {typedUser?.role === 'admin' ? 'Ongoing installations' : 'Your active projects'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-projects-count">
                {dashboardData?.activeProjects?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Requests Overview for Clients */}
        {typedUser?.role !== 'admin' && dashboardData?.activeRequests?.length > 0 && (
          <Card className="mb-8" data-testid="card-active-requests-overview">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Your Active Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4" data-testid="list-active-requests">
                {dashboardData.activeRequests.slice(0, 3).map((request) => (
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
                      <Badge 
                        variant="secondary" 
                        className={`${
                          request.status === 'completed' ? 'bg-green-100 text-green-800' :
                          request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          request.status === 'approved' ? 'bg-purple-100 text-purple-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
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
              {dashboardData.activeRequests.length > 3 && (
                <div className="mt-4 text-center">
                  <Link href="/requests">
                    <Button variant="outline" data-testid="button-view-all-requests">
                      View All Requests ({dashboardData.activeRequests.length})
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
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
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
      </div>
    </div>
  );
}