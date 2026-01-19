import { useNavigate } from "react-router-dom";
import { LogIn, Building2, FileText, MessageSquare, Home, Users, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import koproLogo from "@/assets/kopro-logo.svg";

export default function LandingB2B() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-medium border-0">
          <CardContent className="p-8 space-y-6">
            {/* Logo & Title */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <img src={koproLogo} alt="Kopro" className="w-16 h-16" />
              </div>
              <div>
                <h1 className="font-display font-bold text-3xl text-foreground">KOPRO</h1>
                <p className="text-muted-foreground mt-2">
                  La solution simple pour gérer vos copropriétés
                </p>
              </div>
            </div>

            {/* Key features - minimal */}
            <div className="flex justify-center gap-6 py-2">
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="text-xs">Résidences</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-xs">Documents</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="text-xs">Incidents</span>
              </div>
            </div>

            {/* Login */}
            <Button 
              size="lg"
              className="w-full h-12 gap-2"
              onClick={() => navigate("/auth/login")}
            >
              <LogIn className="h-5 w-5" />
              Se connecter
            </Button>

            {/* Free trial */}
            <Button 
              size="lg"
              variant="outline"
              className="w-full h-12 gap-2 border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={() => navigate("/auth/register-trial")}
            >
              <Gift className="h-5 w-5" />
              Essai gratuit 30 jours
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Créer un compte</span>
              </div>
            </div>

            {/* Account type selection */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:border-primary hover:bg-primary/5"
                onClick={() => navigate("/auth/register-manager?type=bailleur")}
              >
                <Home className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Bailleur</span>
                <span className="text-xs text-muted-foreground font-normal">Propriétaire</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2 hover:border-primary hover:bg-primary/5"
                onClick={() => navigate("/auth/register-manager?type=syndic")}
              >
                <Users className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Syndic</span>
                <span className="text-xs text-muted-foreground font-normal">Gestionnaire pro</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-sm text-muted-foreground">
          © 2025 Kopro
        </p>
      </footer>
    </div>
  );
}
