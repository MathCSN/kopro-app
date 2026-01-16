import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAppEnvironment } from "@/hooks/useAppEnvironment";
import LandingB2B from "./LandingB2B";
import MobileLanding from "./MobileLanding";

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading, hasResidence } = useAuth();
  const { isNative, isMobile } = useAppEnvironment();

  useEffect(() => {
    if (isLoading) return;

    // If not logged in, show the appropriate landing page
    if (!user) {
      return; // Will render the landing component below
    }

    // Redirect based on role
    if (profile?.role === 'admin') {
      navigate("/admin/platform", { replace: true });
    } else if (profile?.role === 'manager' || profile?.role === 'cs') {
      navigate("/dashboard", { replace: true });
    } else if (profile?.role === 'resident') {
      if (hasResidence) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/pending", { replace: true });
      }
    } else {
      // No role yet, stay on landing
      return;
    }
  }, [user, profile, isLoading, hasResidence, navigate]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  // If logged in, show loading (will redirect via useEffect)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  // Not logged in: show appropriate landing page based on environment
  // Mobile native or mobile web -> MobileLanding (residents only)
  // Desktop web -> LandingB2B (managers only)
  if (isNative || isMobile) {
    return <MobileLanding />;
  }

  return <LandingB2B />;
};

export default Index;