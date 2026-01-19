import { useNavigate } from "react-router-dom";
import { Gift, LogIn } from "lucide-react";
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
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <img src={koproLogo} alt="Kopro" className="w-16 h-16" />
              </div>
              <div>
                <h1 className="font-display font-bold text-3xl text-foreground">KOPRO</h1>
                <p className="text-muted-foreground mt-1">Gestion de copropriété</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
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
                Créer un compte
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
