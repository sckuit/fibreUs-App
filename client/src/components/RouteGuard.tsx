import { useEffect } from "react";
import { useLocation } from "wouter";
import { usePermissions } from "@/hooks/useAuth";

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'client' | 'employee' | 'manager' | 'admin';
  fallbackRoute?: string;
}

export function RouteGuard({ 
  children, 
  requireAuth = true, 
  requiredRole,
  fallbackRoute = "/" 
}: RouteGuardProps) {
  const [location, setLocation] = useLocation();
  const { user, role, canAccessRoute, getDefaultRoute } = usePermissions();

  useEffect(() => {
    // If authentication is required but user is not logged in
    if (requireAuth && !user) {
      setLocation(fallbackRoute);
      return;
    }

    // If user is authenticated, check route permissions
    if (user && role) {
      // Check if user can access the current route
      if (!canAccessRoute(location)) {
        // Redirect to user's default route based on their role
        const defaultRoute = getDefaultRoute();
        setLocation(defaultRoute);
        return;
      }

      // Check specific role requirement
      if (requiredRole && role !== requiredRole) {
        // Check role hierarchy - allow higher roles to access lower role routes
        const roleHierarchy = { client: 1, employee: 2, manager: 3, admin: 4 };
        if (roleHierarchy[role] < roleHierarchy[requiredRole]) {
          const defaultRoute = getDefaultRoute();
          setLocation(defaultRoute);
          return;
        }
      }
    }
  }, [user, role, location, requireAuth, requiredRole, fallbackRoute, canAccessRoute, getDefaultRoute, setLocation]);

  // If checking authentication and user is not authenticated, don't render children
  if (requireAuth && !user) {
    return null;
  }

  // If user doesn't have permission for this route, don't render children
  if (user && role && !canAccessRoute(location)) {
    return null;
  }

  return <>{children}</>;
}