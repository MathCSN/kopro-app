import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, LogOut, Loader2, QrCode, Building2, ArrowRight, Keyboard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AUTH_MESSAGES } from "@/lib/messages";
import { QrScannerDialog } from "@/components/residence/QrScannerDialog";

export default function Pending() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCheckingRoles, setIsCheckingRoles] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth/login");
      return;
    }
    checkUserRoles();
    
    // Check for pending residence from QR scan
    const pendingResidence = localStorage.getItem("pending_join_residence");
    if (pendingResidence) {
      navigate(`/join?residence=${pendingResidence}`);
    }
  }, [user]);

  const checkUserRoles = async () => {
    if (!user) return;
    
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role, residence_id')
        .eq('user_id', user.id);

      if (error) throw error;

      if (roles && roles.length > 0) {
        const hasAdminRole = roles.some(r => r.role === 'admin');
        const hasManagerRole = roles.some(r => r.role === 'manager');
        const hasResidenceAccess = roles.some(r => r.residence_id);
        
        if (hasAdminRole) {
          navigate("/admin/platform");
        } else if (hasManagerRole) {
          navigate("/dashboard");
        } else if (hasResidenceAccess) {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error checking roles:", error);
    } finally {
      setIsCheckingRoles(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleScanQRCode = () => {
    setScannerOpen(true);
  };

  const handleScanResult = (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    setScannerOpen(false);

    // Accept full URLs (e.g. https://.../r/XXXX or https://.../join?residence=UUID)
    try {
      const url = new URL(text);
      if (url.pathname.startsWith("/r/")) {
        navigate(url.pathname + url.search);
        return;
      }
      const residence = url.searchParams.get("residence");
      if (url.pathname === "/join" && residence) {
        navigate(`/join?residence=${residence}`);
        return;
      }
    } catch {
      // Not a URL, continue
    }

    // If it looks like a UUID, use it directly
    if (text.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      navigate(`/join?residence=${text}`);
      return;
    }

    // Otherwise treat it as a residence code/path
    navigate(`/r/${text}`);
  };

  const handleManualCode = () => {
    if (manualCode.trim()) {
      // Check if it's a full URL or just an ID
      const code = manualCode.trim();
      
      // If it looks like a UUID, use it directly
      if (code.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        navigate(`/join?residence=${code}`);
      } else {
        // Otherwise treat it as a residence code/path
        navigate(`/r/${code}`);
      }
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
    <div className="min-h-screen flex flex-col bg-background">
      <QrScannerDialog
        open={scannerOpen}
        onOpenChange={(open) => {
          setScannerOpen(open);
          if (!open) {
            // If scanner closes (permission denied, etc.), fall back to manual input
            // without changing the rest of the flow.
          }
        }}
        onResult={handleScanResult}
        onError={() => {
          setScannerOpen(false);
          setShowManualInput(true);
        }}
      />

      {/* Header */}
      <header className="border-b bg-card p-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
            <Building2 className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="font-display font-bold text-lg">KOPRO</span>
        </div>
      </header>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 py-4">
        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">✓</div>
        <div className="w-12 h-0.5 bg-primary" />
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</div>
        <div className="w-12 h-0.5 bg-muted" />
        <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">3</div>
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4 pb-safe">
        <Card className="w-full max-w-md shadow-soft">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Rejoindre une résidence</CardTitle>
            <CardDescription>
              Scannez le QR code fourni par votre gestionnaire pour rejoindre votre résidence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!showManualInput ? (
              <>
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

                {/* Manual code button */}
                <Button 
                  variant="outline" 
                  className="w-full h-12"
                  onClick={() => setShowManualInput(true)}
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Entrer un code manuellement
                </Button>
              </>
            ) : (
              <>
                {/* Manual code entry */}
                <div className="space-y-3">
                  <Label htmlFor="residence-code">Code de la résidence</Label>
                  <Input
                    id="residence-code"
                    placeholder="Entrez le code ou l'ID de la résidence"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="h-12 text-center font-mono"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Demandez le code à votre gestionnaire si vous ne pouvez pas scanner le QR code.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowManualInput(false)}
                  >
                    Retour
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleManualCode}
                    disabled={!manualCode.trim()}
                  >
                    Rejoindre
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

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
      </main>
    </div>
  );
}
