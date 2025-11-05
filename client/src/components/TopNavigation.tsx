import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import LoginDialog from "@/components/LoginDialog";
import GetQuoteDialog from "@/components/GetQuoteDialog";
import ScheduleAppointmentDialog from "@/components/ScheduleAppointmentDialog";
import { Menu, X, Shield, Phone, FileText, Calendar, Clock, Mail, LayoutDashboard, LogOut } from "lucide-react";
import type { User, SystemConfig } from "@shared/schema";

export default function TopNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const typedUser = user as User | undefined;
  const { toast } = useToast();

  // Fetch system config for logo
  const { data: config } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
  });

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

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] w-full border-b bg-background backdrop-blur-sm">
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
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2" data-testid="link-home">
            {config?.logoUrl ? (
              <img src={config.logoUrl} alt={`${config.companyName || 'FibreUS'} Logo`} className="h-8 w-8 object-contain" />
            ) : (
              <Shield className="h-8 w-8 text-primary" />
            )}
            <span className="text-2xl font-bold text-primary">{config?.companyName || 'FibreUS'}</span>
          </Link>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {!isAuthenticated ? (
              <div className="flex items-center space-x-2">
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
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">
                  Hi, {typedUser?.firstName || typedUser?.email}
                </span>
                <Badge variant={typedUser?.role === 'admin' ? 'default' : 'secondary'} data-testid="badge-user-role">
                  {typedUser?.role}
                </Badge>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4" />
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
      </div>
    </header>
  );
}
