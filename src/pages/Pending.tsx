import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, LogOut, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function Pending() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCheckingRoles, setIsCheckingRoles] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkUserRoles();
  }, [user]);

  const checkUserRoles = async () => {
    if (!user) return;
    
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;

      if (roles && roles.length > 0) {
        const hasOwnerRole = roles.some(r => r.role === 'owner');
        if (hasOwnerRole) {
          navigate("/owner");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error checking roles:", error);
    } finally {
      setIsCheckingRoles(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (isCheckingRoles) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">En attente d'attribution</CardTitle>
          <CardDescription>
            Votre compte a été créé mais aucun rôle ne vous a encore été attribué.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>Un administrateur doit vous attribuer un rôle pour accéder à la plateforme.</p>
            <p className="mt-2">Ou scannez le QR code de votre résidence pour la rejoindre.</p>
          </div>

          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
