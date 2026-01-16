import { useNavigate } from "react-router-dom";
import { Building2, User, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import koproLogo from "@/assets/kopro-logo.svg";

export default function MobileLanding() {
  const navigate = useNavigate();

  const handleCreateAccount = async () => {
    // Force logout before navigating to registration
    // This allows users to create accounts for family members
    await supabase.auth.signOut();
    navigate("/auth/register-resident");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-4 border-b bg-card">
        <div className="flex items-center justify-center gap-2">
          <img src={koproLogo} alt="Kopro" className="w-10 h-10" />
          <span className="font-display font-bold text-2xl">KOPRO</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 pb-safe">
        <div className="w-full max-w-md space-y-8">
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl gradient-accent flex items-center justify-center shadow-soft mx-auto">
              <Building2 className="h-10 w-10 text-accent-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Bienvenue sur Kopro
            </h1>
            <p className="text-muted-foreground">
              Votre espace résident pour gérer votre logement facilement
            </p>
          </div>

          {/* Main actions */}
          <div className="space-y-4">
            {/* Create account - Primary action */}
            <Card className="border-primary bg-primary/5">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-foreground">Nouveau sur Kopro ?</p>
                    <p className="text-muted-foreground text-sm">Créez votre compte résident</p>
                  </div>
                </div>
                <Button 
                  size="lg"
                  className="w-full h-14 text-lg"
                  onClick={handleCreateAccount}
                >
                  Créer mon compte résident
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Login - Secondary action */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <LogIn className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Déjà un compte ?</p>
                    <p className="text-muted-foreground text-sm">Connectez-vous à votre espace</p>
                  </div>
                </div>
                <Button 
                  size="lg"
                  variant="outline"
                  className="w-full h-14 text-lg"
                  onClick={() => navigate("/auth/login")}
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Me connecter
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features list */}
          <div className="space-y-3 pt-4">
            <p className="text-sm font-medium text-muted-foreground text-center">
              Avec Kopro, vous pouvez :
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Signaler des incidents facilement
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Consulter vos documents
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Suivre vos paiements
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Communiquer avec votre gestionnaire
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-muted-foreground border-t safe-area-inset-bottom">
        <p>Kopro - Votre résidence simplifiée</p>
      </footer>
    </div>
  );
}
