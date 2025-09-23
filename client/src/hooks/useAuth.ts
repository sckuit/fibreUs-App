// From javascript_log_in_with_replit integration
import { useQuery } from "@tanstack/react-query";
import { hasPermission, canAccessRoute, getDefaultRoute, UserRole } from "@shared/permissions";
import type { User } from "@shared/schema";

// Custom auth query function that handles 401 gracefully
async function fetchAuthUser() {
  try {
    const response = await fetch("/api/auth/user", {
      credentials: "include",
    });
    
    if (response.status === 401) {
      // User is not authenticated, return null
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // On any error, assume user is not authenticated
    return null;
  }
}

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: fetchAuthUser,
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity, // Don't refetch unless explicitly invalidated
    gcTime: Infinity, // Keep in cache indefinitely
  });

  return {
    user: user as User | null,
    isLoading,
    isAuthenticated: !!user,
    role: user?.role as UserRole | null,
  };
}

// Hook for checking user permissions
export function usePermissions() {
  const { user, role } = useAuth();
  
  return {
    hasPermission: (permission: keyof import("@shared/permissions").Permission) => 
      role ? hasPermission(role, permission) : false,
    canAccessRoute: (route: string) => 
      role ? canAccessRoute(role, route) : false,
    getDefaultRoute: () => 
      role ? getDefaultRoute(role) : '/',
    role,
    user,
  };
}