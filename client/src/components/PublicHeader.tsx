import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SystemConfig } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Shield, Phone, Mail, Calendar, FileText, LogIn, Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import GetQuoteDialog from "@/components/GetQuoteDialog";
import LoginDialog from "@/components/LoginDialog";
import { useAuth } from "@/hooks/useAuth";

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: config } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
  });
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const companyName = config?.companyName || "FibreUS";
  const phoneNumber = config?.phoneNumber || "(555) 123-4567";
  const contactEmail = config?.contactEmail || "info@fibreus.co";
  const emergencyPhone = config?.emergencyPhone || "24/7 Emergency Service";

  const handleDashboardClick = () => {
    setLocation('/dashboard');
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background">
      {/* Top Bar - Hidden on mobile, visible on md and up */}
      <div className="hidden md:block bg-[#1a2332] text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-10 text-sm">
            <div className="flex items-center gap-6">
              <a href={`tel:${phoneNumber.replace(/\D/g, '')}`} className="flex items-center gap-2 hover:text-primary transition-colors" data-testid="link-header-phone">
                <Phone className="h-3.5 w-3.5" />
                <span>{phoneNumber}</span>
              </a>
              <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 hover:text-primary transition-colors" data-testid="link-header-email">
                <Mail className="h-3.5 w-3.5" />
                <span>{contactEmail}</span>
              </a>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2" data-testid="text-emergency-service">
                <Phone className="h-3.5 w-3.5" />
                {emergencyPhone}
              </span>
              <Badge variant="secondary" className="bg-orange-500 hover:bg-orange-600 text-white border-0" data-testid="badge-certified">
                CERTIFIED
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" data-testid="link-home-logo">
              <Shield className="h-7 w-7 md:h-8 md:w-8 text-primary" />
              <div className="flex flex-col">
                <span className="text-base md:text-xl font-bold leading-tight">{companyName}</span>
                {config?.headerTagline && (
                  <span className="hidden sm:block text-xs text-muted-foreground leading-tight">{config.headerTagline}</span>
                )}
              </div>
            </Link>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <GetQuoteDialog>
                <Button variant="outline" size="sm" className="gap-2" data-testid="button-get-quote-header">
                  <FileText className="h-4 w-4" />
                  Get Quote
                </Button>
              </GetQuoteDialog>
              
              <Button variant="outline" size="sm" className="gap-2" data-testid="button-schedule-header">
                <Calendar className="h-4 w-4" />
                Schedule
              </Button>

              {user ? (
                <Button 
                  size="sm" 
                  className="gap-2" 
                  onClick={handleDashboardClick}
                  data-testid="button-dashboard-header"
                >
                  Dashboard
                </Button>
              ) : (
                <LoginDialog>
                  <Button 
                    size="sm" 
                    className="gap-2"
                    data-testid="button-sign-in-header"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </LoginDialog>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-6 mt-8">
                  {/* Contact Info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase">Contact</h3>
                    <a 
                      href={`tel:${phoneNumber.replace(/\D/g, '')}`} 
                      className="flex items-center gap-3 p-2 rounded-md hover-elevate active-elevate-2"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="link-mobile-phone"
                    >
                      <Phone className="h-4 w-4 text-primary" />
                      <span className="text-sm">{phoneNumber}</span>
                    </a>
                    <a 
                      href={`mailto:${contactEmail}`} 
                      className="flex items-center gap-3 p-2 rounded-md hover-elevate active-elevate-2"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="link-mobile-email"
                    >
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="text-sm">{contactEmail}</span>
                    </a>
                    <div className="flex items-center gap-3 p-2">
                      <Phone className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">{emergencyPhone}</span>
                    </div>
                    <Badge variant="secondary" className="bg-orange-500 hover:bg-orange-600 text-white border-0 w-fit">
                      CERTIFIED
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase">Actions</h3>
                    
                    <GetQuoteDialog>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start gap-3" 
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid="button-mobile-get-quote"
                      >
                        <FileText className="h-4 w-4" />
                        Get Quote
                      </Button>
                    </GetQuoteDialog>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="button-mobile-schedule"
                    >
                      <Calendar className="h-4 w-4" />
                      Schedule Service
                    </Button>

                    {user ? (
                      <Button 
                        className="w-full justify-start gap-3" 
                        onClick={handleDashboardClick}
                        data-testid="button-mobile-dashboard"
                      >
                        Dashboard
                      </Button>
                    ) : (
                      <LoginDialog>
                        <Button 
                          className="w-full justify-start gap-3"
                          data-testid="button-mobile-sign-in"
                        >
                          <LogIn className="h-4 w-4" />
                          Sign In
                        </Button>
                      </LoginDialog>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
