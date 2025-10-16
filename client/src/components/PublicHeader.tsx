import { useQuery } from "@tanstack/react-query";
import type { SystemConfig } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Phone, Mail, Calendar, FileText, LogIn } from "lucide-react";
import { Link, useLocation } from "wouter";
import GetQuoteDialog from "@/components/GetQuoteDialog";
import LoginDialog from "@/components/LoginDialog";
import { useAuth } from "@/hooks/useAuth";

export default function PublicHeader() {
  const { data: config } = useQuery<SystemConfig>({
    queryKey: ['/api/system-config'],
  });
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const companyName = config?.companyName || "FibreUS";
  const phoneNumber = config?.phoneNumber || "(555) 123-4567";
  const contactEmail = config?.contactEmail || "info@fibreus.co";
  const emergencyPhone = config?.emergencyPhone || "24/7 Emergency Service";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background">
      {/* Top Bar */}
      <div className="bg-[#1a2332] text-white">
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
              <Shield className="h-8 w-8 text-primary" />
              <div className="flex flex-col">
                <span className="text-xl font-bold leading-tight">{companyName}</span>
                {config?.headerTagline && (
                  <span className="text-xs text-muted-foreground leading-tight">{config.headerTagline}</span>
                )}
              </div>
            </Link>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
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
                  onClick={() => setLocation('/dashboard')}
                  data-testid="button-dashboard-header"
                >
                  Dashboard
                </Button>
              ) : (
                <LoginDialog>
                  <Button 
                    size="icon"
                    data-testid="button-sign-in-header"
                  >
                    <LogIn className="h-4 w-4" />
                  </Button>
                </LoginDialog>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
