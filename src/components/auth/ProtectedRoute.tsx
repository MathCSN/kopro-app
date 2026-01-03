import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppRole } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
  requireRental?: boolean;
}

export function ProtectedRoute({ children, requiredRole, requireRental }: ProtectedRouteProps) {
  const { user, profile, isLoading, hasResidence, hasRole, canAccessRental, isResident } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && user && profile) {
      if (requiredRole && !hasRole(requiredRole)) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les permissions nécessaires pour accéder à cette page.",
          variant: "destructive",
        });
      }
      if (requireRental && !canAccessRental()) {
        toast({
          title: "Accès refusé",
          description: "Ce module est réservé aux gestionnaires.",
          variant: "destructive",
        });
      }
    }
  }, [isLoading, user, profile, requiredRole, requireRental, hasRole, canAccessRental, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Wait for profile to load before checking roles
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  // Redirect residents without a residence to pending page
  if (isResident() && !hasResidence && location.pathname !== '/pending' && location.pathname !== '/join') {
    return <Navigate to="/pending" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireRental && !canAccessRental()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
