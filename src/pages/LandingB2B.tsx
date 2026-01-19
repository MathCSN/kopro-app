import { useNavigate } from "react-router-dom";
import { Gift, LogIn, Building2, FileText, MessageSquare } from "lucide-react";
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
          <CardContent className="p-8 space-y-8">
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

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                size="lg"
                className="w-full h-12 gap-2"
                onClick={() => navigate("/auth/login")}
              >
                <LogIn className="h-5 w-5" />
                Se connecter
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="w-full h-12 gap-2 border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
                onClick={() => navigate("/auth/register-trial")}
              >
                <Gift className="h-5 w-5" />
                Essai gratuit 30 jours
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Sans engagement • Configuration en 5 minutes
            </p>
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
