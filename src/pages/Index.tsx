import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading, hasResidence } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate("/auth/login", { replace: true });
      return;
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
      navigate("/auth/login", { replace: true });
    }
  }, [user, profile, isLoading, hasResidence, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Chargement...</div>
    </div>
  );
};

export default Index;