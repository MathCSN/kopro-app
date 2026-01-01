import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, LogOut, Loader2, QrCode, Building2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function Pending() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCheckingRoles, setIsCheckingRoles] = useState(true);
  const [manualCode, setManualCode] = useState("");

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
        const hasAdminRole = roles.some(r => r.role === 'admin');
        if (hasAdminRole) {
          navigate("/admin/platform");
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

  const handleScanQRCode = () => {
    // Open the native QR scanner or redirect to a scanner page
    // For now, we'll prompt user to enter the residence code manually
    // In production, this would open the camera
    navigate("/join");
  };

  const handleManualCode = () => {
    if (manualCode.trim()) {
      // Assume manual code is a residence ID or a short code
      navigate(`/join?residence=${manualCode.trim()}`);
    }
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
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Bienvenue sur Kopro</CardTitle>
          <CardDescription>
            Scannez le QR code de votre résidence pour accéder à votre espace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main CTA - Scan QR Code */}
          <Button 
            className="w-full h-14 text-lg gap-3" 
            onClick={handleScanQRCode}
          >
            <QrCode className="h-6 w-6" />
            Scanner le QR code
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Manual code entry */}
          <div className="space-y-3">
            <Label htmlFor="residence-code">Entrer un code de résidence</Label>
            <div className="flex gap-2">
              <Input
                id="residence-code"
                placeholder="Ex: abc123..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant="secondary" 
                onClick={handleManualCode}
                disabled={!manualCode.trim()}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Demandez le code à votre gestionnaire si vous ne pouvez pas scanner le QR code.
            </p>
          </div>

          {/* Status info */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  En attente d'attribution
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Votre compte est actif mais vous n'avez pas encore rejoint de résidence.
                </p>
              </div>
            </div>
          </div>

          {/* Logout button */}
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
