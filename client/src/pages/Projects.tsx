import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { Calendar, MapPin, DollarSign, Clock, CheckCircle, User } from "lucide-react";
import AdminProjectsDialog from "@/components/AdminProjectsDialog";
import type { User as UserType, Project } from "@shared/schema";

const projectStatusColors = {
  planning: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-orange-100 text-orange-800',
  completed: 'bg-gray-100 text-gray-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
};

const getProjectProgress = (status: string): number => {
  switch (status) {
    case 'planning': return 20;
    case 'approved': return 40;
    case 'scheduled': return 60;
    case 'in_progress': return 70;
    case 'completed': return 100;
    case 'on_hold': return 50;
    default: return 0;
  }
};

export default function Projects() {
  const { user } = useAuth();
  const typedUser = user as UserType | undefined;

  const { data: projects, isLoading, isError } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !!typedUser,
  });

  const activeProjects = projects?.filter(p => p.status !== 'completed') || [];
  const completedProjects = projects?.filter(p => p.status === 'completed') || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Failed to load projects</h3>
          <p className="text-muted-foreground mb-4">Please try again later.</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
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
            {typedUser?.role === 'admin' ? 'All Projects' : 'My Projects'}
          </h2>
          <p className="text-muted-foreground">
            {typedUser?.role === 'admin' 
              ? 'Manage all client projects and installations'
              : 'Track your security installations and project progress'
            }
          </p>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card data-testid="card-active-projects">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <Clock className="w-5 h-5 mr-2 text-orange-600" />
                Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-projects-count">
                {activeProjects.length}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-completed-projects">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Completed Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-completed-projects-count">
                {completedProjects.length}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-value">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                Total Project Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-value">
                ${(projects || []).reduce((sum, p) => sum + (p.estimatedValue || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Projects */}
        {activeProjects.length > 0 && (
          <Card className="mb-8" data-testid="card-active-projects-list">
            <CardHeader>
              <CardTitle>Active Projects</CardTitle>
              <CardDescription>
                Currently ongoing installations and projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6" data-testid="list-active-projects">
                {activeProjects.map((project) => (
                  <div key={project.id} className="p-6 rounded-lg border hover-elevate">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
                        <p className="text-muted-foreground mb-3">{project.description}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                          {project.address && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {project.address}
                            </div>
                          )}
                          {project.startDate && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Started {new Date(project.startDate).toLocaleDateString()}
                            </div>
                          )}
                          {project.estimatedValue && (
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              ${project.estimatedValue.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant="secondary"
                          className={`${projectStatusColors[project.status] || 'bg-gray-100 text-gray-800'}`}
                        >
                          {project.status?.replace('_', ' ')}
                        </Badge>
                        {typedUser?.role === 'admin' && (
                          <AdminProjectsDialog 
                            project={project} 
                            onSuccess={() => {
                              // Refetch handled by mutation
                            }} 
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* Technician Assignment (Admin View) */}
                    {typedUser?.role === 'admin' && project.assignedTechnicianId && (
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <User className="w-4 h-4 mr-1" />
                        Assigned Technician: {project.assignedTechnicianId}
                      </div>
                    )}
                    
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{getProjectProgress(project.status)}%</span>
                      </div>
                      <Progress 
                        value={getProjectProgress(project.status)} 
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Projects */}
        {completedProjects.length > 0 && (
          <Card data-testid="card-completed-projects-list">
            <CardHeader>
              <CardTitle>Completed Projects</CardTitle>
              <CardDescription>
                Successfully completed installations and projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4" data-testid="list-completed-projects">
                {completedProjects.map((project) => (
                  <div key={project.id} className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          {project.endDate && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Completed {new Date(project.endDate).toLocaleDateString()}
                            </div>
                          )}
                          {project.estimatedValue && (
                            <div className="flex items-center text-green-600 font-medium">
                              <DollarSign className="w-4 h-4 mr-1" />
                              ${project.estimatedValue.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {(projects || []).length === 0 && (
          <Card data-testid="card-no-projects">
            <CardContent className="text-center py-16">
              <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground mb-6">
                {typedUser?.role === 'admin' 
                  ? 'No projects have been created yet.'
                  : 'You don\'t have any projects at the moment. Submit a service request to get started!'
                }
              </p>
              {typedUser?.role !== 'admin' && (
                <Link href="/requests?action=new">
                  <Button data-testid="button-create-request">
                    Create Service Request
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}