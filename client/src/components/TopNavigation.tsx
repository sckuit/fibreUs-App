import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, usePermissions } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import LoginDialog from "@/components/LoginDialog";
import GetQuoteDialog from "@/components/GetQuoteDialog";
import ScheduleAppointmentDialog from "@/components/ScheduleAppointmentDialog";
import { Menu, X, Shield, Phone, FileText, Calendar, Users, Settings, BarChart3, Clock, Mail, LayoutDashboard, FolderKanban, ClipboardList, CheckSquare } from "lucide-react";
import type { User } from "@shared/schema";

export default function TopNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { hasPermission, role } = usePermissions();
  const [location, setLocation] = useLocation();
  const typedUser = user as User | undefined;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/logout');
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
      
      // Use full page reload to ensure auth state is cleared
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const isActive = (path: string) => location === path;

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top contact bar - only show for non-authenticated users on landing page */}
      {!isAuthenticated && location === '/' && (
        <div className="border-b bg-primary text-primary-foreground py-1">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1" data-testid="contact-phone">
                  <Phone className="h-3 w-3" />
                  <span>(555) 123-4567</span>
                </div>
                <div className="flex items-center gap-1" data-testid="contact-email">
                  <Mail className="h-3 w-3" />
                  <span>info@fibreus.co</span>
                </div>
              </div>
              <div className="flex items-center gap-1" data-testid="emergency-service">
                <Clock className="h-3 w-3" />
                <span>24/7 Emergency Service</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  CERTIFIED
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">FibreUS</span>
          </Link>

          {/* Desktop Navigation Tabs */}
          {isAuthenticated && (
            <Tabs value={location} className="hidden md:block flex-1 mx-8">
              <TabsList className="h-10">
                <TabsTrigger value="/dashboard" onClick={() => setLocation('/dashboard')} data-testid="tab-dashboard">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </TabsTrigger>
                
                {hasPermission('viewOwnRequests') && (
                  <TabsTrigger value="/requests" onClick={() => setLocation('/requests')} data-testid="tab-requests">
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Requests
                  </TabsTrigger>
                )}
                
                {hasPermission('viewOwnProjects') && (
                  <TabsTrigger value="/projects" onClick={() => setLocation('/projects')} data-testid="tab-projects">
                    <FolderKanban className="w-4 h-4 mr-2" />
                    Projects
                  </TabsTrigger>
                )}
                
                {hasPermission('viewUsers') && (
                  <TabsTrigger value="/users" onClick={() => setLocation('/users')} data-testid="tab-users">
                    <Users className="w-4 h-4 mr-2" />
                    Users
                  </TabsTrigger>
                )}
                
                {hasPermission('viewReports') && (
                  <TabsTrigger value="/reports" onClick={() => setLocation('/reports')} data-testid="tab-reports">
                    <FileText className="w-4 h-4 mr-2" />
                    Reports
                  </TabsTrigger>
                )}
                
                {hasPermission('manageSystem') && (
                  <TabsTrigger value="/tasks" onClick={() => setLocation('/tasks')} data-testid="tab-tasks">
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Tasks
                  </TabsTrigger>
                )}
                
                {hasPermission('manageSystem') && (
                  <TabsTrigger value="/admin" onClick={() => setLocation('/admin')} data-testid="tab-admin">
                    <Settings className="w-4 h-4 mr-2" />
                    Admin
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {!isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-2">
                <GetQuoteDialog>
                  <Button variant="outline" size="sm" data-testid="button-get-quote">
                    <FileText className="w-4 h-4 mr-2" />
                    Get Quote
                  </Button>
                </GetQuoteDialog>
                
                <ScheduleAppointmentDialog>
                  <Button variant="outline" size="sm" data-testid="button-schedule">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                </ScheduleAppointmentDialog>

                <LoginDialog>
                  <Button variant="default" size="sm" data-testid="button-login">
                    Sign In
                  </Button>
                </LoginDialog>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">
                  Welcome, {typedUser?.firstName || typedUser?.email}
                </span>
                <Badge variant={typedUser?.role === 'admin' ? 'default' : 'secondary'} data-testid="badge-user-role">
                  {typedUser?.role}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  data-testid="button-logout"
                >
                  {logoutMutation.isPending ? 'Signing Out...' : 'Sign Out'}
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="flex flex-col space-y-2">
              {isAuthenticated && (
                <>
                  <Button
                    variant={location === '/dashboard' ? 'default' : 'ghost'}
                    className="justify-start"
                    onClick={() => { setLocation('/dashboard'); setMobileMenuOpen(false); }}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  
                  {hasPermission('viewOwnRequests') && (
                    <Button
                      variant={location === '/requests' ? 'default' : 'ghost'}
                      className="justify-start"
                      onClick={() => { setLocation('/requests'); setMobileMenuOpen(false); }}
                    >
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Requests
                    </Button>
                  )}
                  
                  {hasPermission('viewOwnProjects') && (
                    <Button
                      variant={location === '/projects' ? 'default' : 'ghost'}
                      className="justify-start"
                      onClick={() => { setLocation('/projects'); setMobileMenuOpen(false); }}
                    >
                      <FolderKanban className="w-4 h-4 mr-2" />
                      Projects
                    </Button>
                  )}
                  
                  {hasPermission('viewUsers') && (
                    <Button
                      variant={location === '/users' ? 'default' : 'ghost'}
                      className="justify-start"
                      onClick={() => { setLocation('/users'); setMobileMenuOpen(false); }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Users
                    </Button>
                  )}
                  
                  {hasPermission('viewReports') && (
                    <Button
                      variant={location === '/reports' ? 'default' : 'ghost'}
                      className="justify-start"
                      onClick={() => { setLocation('/reports'); setMobileMenuOpen(false); }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Reports
                    </Button>
                  )}
                  
                  {hasPermission('manageSystem') && (
                    <Button
                      variant={location === '/tasks' ? 'default' : 'ghost'}
                      className="justify-start"
                      onClick={() => { setLocation('/tasks'); setMobileMenuOpen(false); }}
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Tasks
                    </Button>
                  )}
                  
                  {hasPermission('manageSystem') && (
                    <Button
                      variant={location === '/admin' ? 'default' : 'ghost'}
                      className="justify-start"
                      onClick={() => { setLocation('/admin'); setMobileMenuOpen(false); }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  )}

                  <div className="pt-4 mt-4 border-t">
                    <div className="text-sm text-muted-foreground mb-2 px-3">
                      {typedUser?.firstName || typedUser?.email}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => logoutMutation.mutate()}
                      disabled={logoutMutation.isPending}
                      className="justify-start w-full"
                    >
                      {logoutMutation.isPending ? 'Signing Out...' : 'Sign Out'}
                    </Button>
                  </div>
                </>
              )}

              {!isAuthenticated && (
                <div className="flex flex-col space-y-2">
                  <GetQuoteDialog>
                    <Button variant="outline" size="sm" className="justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      Get Quote
                    </Button>
                  </GetQuoteDialog>
                  
                  <ScheduleAppointmentDialog>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                  </ScheduleAppointmentDialog>

                  <LoginDialog>
                    <Button variant="default" size="sm" className="justify-start">
                      Sign In
                    </Button>
                  </LoginDialog>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}