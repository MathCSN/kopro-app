import { useNavigate } from "react-router-dom";
import { Building2, User, Briefcase, ArrowRight, Gift, LogIn } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AccountChoice() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-4 border-b bg-card">
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-soft">
            <Building2 className="h-6 w-6 text-accent-foreground" />
          </div>
          <span className="font-display font-bold text-2xl">KOPRO</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl space-y-6">
          {/* Already have an account - Primary CTA */}
          <Card className="border-primary bg-primary/5">
            <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <LogIn className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-foreground">Vous avez déjà un compte ?</p>
                  <p className="text-muted-foreground text-sm">Connectez-vous à votre espace</p>
                </div>
              </div>
              <Button 
                size="lg"
                className="w-full sm:w-auto gap-2"
                onClick={() => navigate("/auth/login")}
              >
                <LogIn className="h-4 w-4" />
                Se connecter
              </Button>
            </CardContent>
          </Card>

          {/* Title */}
          <div className="text-center space-y-3 pt-2">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Bienvenue sur Kopro
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              La plateforme de gestion de copropriété moderne. Choisissez votre type de compte.
            </p>
          </div>

          {/* Account Type Cards */}
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {/* Resident Account */}
            <Card 
              className="relative overflow-hidden cursor-pointer hover:border-primary/50 transition-all hover:shadow-medium group"
              onClick={() => navigate("/auth/register-resident")}
            >
              <CardHeader className="pb-2">
                <div className="w-14 h-14 rounded-xl bg-kopro-teal/10 flex items-center justify-center mb-4 group-hover:bg-kopro-teal/20 transition-colors">
                  <User className="h-7 w-7 text-kopro-teal" />
                </div>
                <CardTitle className="text-xl">Compte Résident</CardTitle>
                <CardDescription>
                  Vous êtes locataire ou copropriétaire
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-kopro-teal" />
                    Accédez à votre espace personnel
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-kopro-teal" />
                    Signalez des incidents facilement
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-kopro-teal" />
                    Consultez vos documents et paiements
                  </li>
                </ul>
                <Button className="w-full">
                  Créer un compte résident
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Manager Account */}
            <Card 
              className="relative overflow-hidden hover:border-primary transition-all hover:shadow-medium group"
            >
              <CardHeader className="pb-2">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Briefcase className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl">Compte Gestionnaire</CardTitle>
                <CardDescription>
                  Syndic, gestionnaire ou propriétaire bailleur
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Gérez vos résidences et locataires
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Suivez les incidents et paiements
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Accédez aux outils professionnels
                  </li>
                </ul>
                <div className="flex flex-col gap-2">
                  <Button 
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                    onClick={() => navigate("/auth/register-manager")}
                  >
                    <Gift className="h-4 w-4" />
                    Essai gratuit 30 jours
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate("/auth/register-manager")}
                  >
                    Créer un compte gestionnaire
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-muted-foreground border-t">
        <p>Kopro - Gestion de copropriété simplifiée</p>
      </footer>
    </div>
  );
}
