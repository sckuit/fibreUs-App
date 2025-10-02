import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import TopNavigation from "@/components/TopNavigation";
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

// Main application layout with navigation
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <main>
        {children}
      </main>
    </div>
  );
}

// Landing page for non-authenticated users
function LandingPage() {
  return (
    <AppLayout>
      <Home />
    </AppLayout>
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
  };

  const defaultRoute = (user?.role && roleRoutes[user.role]) || "/portal/client";

  return (
    <AppLayout>
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

        {/* Legacy routes for backwards compatibility */}
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/requests" component={ServiceRequests} />
        <Route path="/projects" component={Projects} />
        <Route path="/analytics" component={Analytics} />
        
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
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
      <Route path="/logos" component={() => (
        <AppLayout>
          <LogoShowcase />
        </AppLayout>
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
