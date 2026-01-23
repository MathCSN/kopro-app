import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAppEnvironment } from "@/hooks/useAppEnvironment";
import { supabase } from "@/integrations/supabase/client";
import LandingB2B from "./LandingB2B";
import MobileLanding from "./MobileLanding";

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading, hasResidence } = useAuth();
  const { isNative, isMobile } = useAppEnvironment();
  const [agencyType, setAgencyType] = useState<string | null>(null);
  const [agencyLoading, setAgencyLoading] = useState(false);

  // Fetch agency type for manager/cs roles
  useEffect(() => {
    const fetchAgencyType = async () => {
      if (!user || !profile) return;
      if (profile.role !== 'manager' && profile.role !== 'cs') return;

      setAgencyLoading(true);
      try {
        // Get user's agency
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('agency_id')
          .eq('user_id', user.id)
          .not('agency_id', 'is', null)
          .maybeSingle();

        if (roleData?.agency_id) {
          const { data: agencyData } = await supabase
            .from('agencies')
            .select('type')
            .eq('id', roleData.agency_id)
            .maybeSingle();

          if (agencyData?.type) {
            setAgencyType(agencyData.type);
          }
        }
      } catch (error) {
        console.error('Error fetching agency type:', error);
      } finally {
        setAgencyLoading(false);
      }
    };

    fetchAgencyType();
  }, [user, profile]);

  useEffect(() => {
    if (isLoading || agencyLoading) return;

    // If not logged in, show the appropriate landing page
    if (!user) {
      return; // Will render the landing component below
    }

    // Redirect based on role
    if (profile?.role === 'admin') {
      navigate("/admin/platform", { replace: true });
    } else if (profile?.role === 'manager' || profile?.role === 'cs') {
      // Redirect based on agency type
      if (agencyType === 'bailleur') {
        navigate("/bailleur/dashboard", { replace: true });
      } else if (agencyType === 'syndic') {
        navigate("/syndic/dashboard", { replace: true });
      } else {
        // Fallback to generic dashboard if no agency type
        navigate("/dashboard", { replace: true });
      }
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
  }, [user, profile, isLoading, hasResidence, navigate, agencyType, agencyLoading]);

  // Show loading while checking auth or agency
  if (isLoading || agencyLoading) {
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
  if (isNative || isMobile) {
    return <MobileLanding />;
  }

  return <LandingB2B />;
};

export default Index;