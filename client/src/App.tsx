import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import TopNavigation from "@/components/TopNavigation";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import ServiceRequests from "@/pages/ServiceRequests";
import Projects from "@/pages/Projects";
import Analytics from "@/pages/Analytics";
import LogoShowcase from "@/components/LogoShowcase";
import ClientPortal from "@/pages/ClientPortal";
import EmployeePortal from "@/pages/EmployeePortal";
import ManagerPortal from "@/pages/ManagerPortal";
import AdminPortal from "@/pages/AdminPortal";
import SalesPortal from "@/pages/SalesPortal";

// Services pages
import CCTVInstallation from "@/pages/services/CCTVInstallation";
import AlarmSystems from "@/pages/services/AlarmSystems";
import AccessControl from "@/pages/services/AccessControl";
import IntercomSystems from "@/pages/services/IntercomSystems";
import CloudStorage from "@/pages/services/CloudStorage";
import RemoteMonitoring from "@/pages/services/RemoteMonitoring";

// Company pages
import AboutUs from "@/pages/company/AboutUs";
import OurTeam from "@/pages/company/OurTeam";
import Certifications from "@/pages/company/Certifications";
import CaseStudies from "@/pages/company/CaseStudies";
import Careers from "@/pages/company/Careers";
import NewsUpdates from "@/pages/company/NewsUpdates";
import ReferralProgram from "@/pages/ReferralProgram";

// Support pages
import SystemStatus from "@/pages/support/SystemStatus";
import TechnicalSupport from "@/pages/support/TechnicalSupport";
import EmergencyService from "@/pages/support/EmergencyService";
import Maintenance from "@/pages/support/Maintenance";
import Training from "@/pages/support/Training";

// Legal pages
import PrivacyPolicy from "@/pages/legal/PrivacyPolicy";
import TermsOfService from "@/pages/legal/TermsOfService";
import ServiceAgreement from "@/pages/legal/ServiceAgreement";
import WarrantyInformation from "@/pages/legal/WarrantyInformation";

// Public layout with PublicHeader for non-authenticated pages
function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicHeader />
      <main className="pt-[106px] flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

// Authenticated layout with TopNavigation for portal pages
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavigation />
      <main className="pt-20 flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

// Landing page for non-authenticated users
function LandingPage() {
  return (
    <PublicLayout>
      <Home />
    </PublicLayout>
  );
}

// Protected router for authenticated users - redirects to role-specific portals
function AuthenticatedRouter() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect to="/" />;
  }

  // Role-based routing
  const roleRoutes: Record<string, string> = {
    client: "/portal/client",
    employee: "/portal/employee",
    manager: "/portal/manager",
    admin: "/portal/admin",
    sales: "/portal/sales",
    project_manager: "/projects",
  };

  const defaultRoute = (user?.role && roleRoutes[user.role]) || "/portal/client";

  return (
    <AuthenticatedLayout>
      <Switch>
        {/* Root redirects to role-specific portal */}
        <Route path="/">
          {() => <Redirect to={defaultRoute} />}
        </Route>

        {/* Role-specific portals */}
        <Route path="/portal/client" component={ClientPortal} />
        <Route path="/portal/employee" component={EmployeePortal} />
        <Route path="/portal/manager" component={ManagerPortal} />
        <Route path="/portal/admin" component={AdminPortal} />
        <Route path="/portal/sales" component={SalesPortal} />

        {/* Direct access routes */}
        <Route path="/admin" component={AdminPortal} />
        <Route path="/sales" component={SalesPortal} />
        <Route path="/users" component={AdminPortal} />
        <Route path="/employees" component={AdminPortal} />
        <Route path="/reports" component={ManagerPortal} />
        <Route path="/tasks" component={ManagerPortal} />
        <Route path="/projects" component={Projects} />

        {/* Legacy routes for backwards compatibility */}
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/requests" component={ServiceRequests} />
        <Route path="/projects" component={Projects} />
        <Route path="/analytics" component={Analytics} />
        
        <Route component={NotFound} />
      </Switch>
    </AuthenticatedLayout>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Public routes that don't require authentication
  return (
    <Switch>
      {/* Public pages */}
      <Route path="/logos" component={() => (
        <PublicLayout>
          <LogoShowcase />
        </PublicLayout>
      )} />
      
      {/* Services routes */}
      <Route path="/services/cctv-installation" component={() => (
        <PublicLayout>
          <CCTVInstallation />
        </PublicLayout>
      )} />
      <Route path="/services/alarm-systems" component={() => (
        <PublicLayout>
          <AlarmSystems />
        </PublicLayout>
      )} />
      <Route path="/services/access-control" component={() => (
        <PublicLayout>
          <AccessControl />
        </PublicLayout>
      )} />
      <Route path="/services/intercom-systems" component={() => (
        <PublicLayout>
          <IntercomSystems />
        </PublicLayout>
      )} />
      <Route path="/services/cloud-storage" component={() => (
        <PublicLayout>
          <CloudStorage />
        </PublicLayout>
      )} />
      <Route path="/services/remote-monitoring" component={() => (
        <PublicLayout>
          <RemoteMonitoring />
        </PublicLayout>
      )} />
      
      {/* Company routes */}
      <Route path="/company/about-us" component={() => (
        <PublicLayout>
          <AboutUs />
        </PublicLayout>
      )} />
      <Route path="/company/our-team" component={() => (
        <PublicLayout>
          <OurTeam />
        </PublicLayout>
      )} />
      <Route path="/company/certifications" component={() => (
        <PublicLayout>
          <Certifications />
        </PublicLayout>
      )} />
      <Route path="/company/case-studies" component={() => (
        <PublicLayout>
          <CaseStudies />
        </PublicLayout>
      )} />
      <Route path="/company/careers" component={() => (
        <PublicLayout>
          <Careers />
        </PublicLayout>
      )} />
      <Route path="/company/news-updates" component={() => (
        <PublicLayout>
          <NewsUpdates />
        </PublicLayout>
      )} />
      <Route path="/referral-program" component={() => (
        <PublicLayout>
          <ReferralProgram />
        </PublicLayout>
      )} />
      
      {/* Support routes */}
      <Route path="/support/system-status" component={() => (
        <PublicLayout>
          <SystemStatus />
        </PublicLayout>
      )} />
      <Route path="/support/technical-support" component={() => (
        <PublicLayout>
          <TechnicalSupport />
        </PublicLayout>
      )} />
      <Route path="/support/emergency-service" component={() => (
        <PublicLayout>
          <EmergencyService />
        </PublicLayout>
      )} />
      <Route path="/support/maintenance" component={() => (
        <PublicLayout>
          <Maintenance />
        </PublicLayout>
      )} />
      <Route path="/support/training" component={() => (
        <PublicLayout>
          <Training />
        </PublicLayout>
      )} />
      
      {/* Legal routes */}
      <Route path="/legal/privacy-policy" component={() => (
        <PublicLayout>
          <PrivacyPolicy />
        </PublicLayout>
      )} />
      <Route path="/legal/terms-of-service" component={() => (
        <PublicLayout>
          <TermsOfService />
        </PublicLayout>
      )} />
      <Route path="/legal/service-agreement" component={() => (
        <PublicLayout>
          <ServiceAgreement />
        </PublicLayout>
      )} />
      <Route path="/legal/warranty-information" component={() => (
        <PublicLayout>
          <WarrantyInformation />
        </PublicLayout>
      )} />
      
      <Route>
        {isAuthenticated ? <AuthenticatedRouter /> : <LandingPage />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="light" storageKey="fibreus-theme">
          <Toaster />
          <Router />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
