import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, profile, isLoading, isAdmin } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && user && profile && !isAdmin()) {
      toast({
        title: "Accès refusé",
        description: "Cette section est réservée aux administrateurs de la plateforme.",
        variant: "destructive",
      });
    }
  }, [isLoading, user, profile, isAdmin, toast]);

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

  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
