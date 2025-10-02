import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useAuth, usePermissions } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import LoginDialog from "@/components/LoginDialog";
import GetQuoteDialog from "@/components/GetQuoteDialog";
import ScheduleAppointmentDialog from "@/components/ScheduleAppointmentDialog";
import { Menu, X, Shield, Phone, FileText, Calendar, Users, Settings, BarChart3, Clock, Mail } from "lucide-react";
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

  const services = [
    { title: "CCTV Systems", description: "Professional surveillance solutions", href: "/services/cctv" },
    { title: "Alarm Systems", description: "Advanced security monitoring", href: "/services/alarm" },
    { title: "Access Control", description: "Secure entry management", href: "/services/access" },
    { title: "Fiber Installation", description: "High-speed connectivity", href: "/services/fiber" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/" className={`navigation-menu-link ${isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                  Home
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-muted-foreground hover:text-primary">
                  Services
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[400px]">
                    <div className="row-span-3">
                      <p className="text-sm font-medium leading-none mb-2">Security Solutions</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Professional electronic security and fiber optic services
                      </p>
                    </div>
                    {services.map((service) => (
                      <NavigationMenuLink key={service.href} asChild>
                        <Link
                          href={service.href}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">{service.title}</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            {service.description}
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {isAuthenticated && (
                <>
                  <NavigationMenuItem>
                    <Link 
                      href="/dashboard" 
                      className={`navigation-menu-link ${isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                      data-testid="link-dashboard"
                    >
                      Dashboard
                    </Link>
                  </NavigationMenuItem>
                  
                  {/* Service Requests - available to all authenticated users */}
                  {hasPermission('viewOwnRequests') && (
                    <NavigationMenuItem>
                      <Link 
                        href="/requests" 
                        className={`navigation-menu-link ${isActive('/requests') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                        data-testid="link-requests"
                      >
                        {role === 'client' ? 'My Requests' : 'Service Requests'}
                      </Link>
                    </NavigationMenuItem>
                  )}
                  
                  {/* Projects - available to employees, managers, and admins */}
                  {hasPermission('viewOwnProjects') && (
                    <NavigationMenuItem>
                      <Link 
                        href="/projects" 
                        className={`navigation-menu-link ${isActive('/projects') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                        data-testid="link-projects"
                      >
                        {role === 'employee' ? 'My Projects' : 'Projects'}
                      </Link>
                    </NavigationMenuItem>
                  )}
                  
                  {/* Users/Employees - available to managers and admins */}
                  {hasPermission('viewUsers') && (
                    <NavigationMenuItem>
                      <Link 
                        href="/users" 
                        className={`navigation-menu-link ${isActive('/users') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                        data-testid="link-users"
                      >
                        Employees
                      </Link>
                    </NavigationMenuItem>
                  )}
                  
                  {/* Reports - available to managers and admins */}
                  {hasPermission('viewReports') && (
                    <NavigationMenuItem>
                      <Link 
                        href="/reports" 
                        className={`navigation-menu-link ${isActive('/reports') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                        data-testid="link-reports"
                      >
                        Reports
                      </Link>
                    </NavigationMenuItem>
                  )}
                  
                  {/* Admin Settings - only for admins */}
                  {hasPermission('manageSystem') && (
                    <NavigationMenuItem>
                      <Link 
                        href="/admin" 
                        className={`navigation-menu-link ${isActive('/admin') ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                        data-testid="link-admin"
                      >
                        Admin
                      </Link>
                    </NavigationMenuItem>
                  )}
                </>
              )}
            </NavigationMenuList>
          </NavigationMenu>

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
            <div className="flex flex-col space-y-3">
              <Link href="/" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link href="/dashboard" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                  
                  {hasPermission('viewOwnRequests') && (
                    <Link href="/requests" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                      {role === 'client' ? 'My Requests' : 'Service Requests'}
                    </Link>
                  )}
                  
                  {hasPermission('viewOwnProjects') && (
                    <Link href="/projects" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                      {role === 'employee' ? 'My Projects' : 'Projects'}
                    </Link>
                  )}
                  
                  {hasPermission('viewUsers') && (
                    <Link href="/users" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                      Employees
                    </Link>
                  )}
                  
                  {hasPermission('viewReports') && (
                    <Link href="/reports" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                      Reports
                    </Link>
                  )}
                  
                  {hasPermission('manageSystem') && (
                    <Link href="/admin" className="block py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                      Admin
                    </Link>
                  )}
                </>
              )}

              <div className="flex flex-col space-y-2 pt-4 border-t">
                {!isAuthenticated ? (
                  <>
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
                  </>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Welcome, {typedUser?.firstName || typedUser?.email}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => logoutMutation.mutate()}
                      disabled={logoutMutation.isPending}
                      className="justify-start"
                    >
                      {logoutMutation.isPending ? 'Signing Out...' : 'Sign Out'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}