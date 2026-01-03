import { useNavigate } from "react-router-dom";
import { Building2, User, Briefcase, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AccountChoice() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center shadow-glow">
            <Building2 className="h-8 w-8 text-accent-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Bienvenue sur Kopro
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Choisissez le type de compte qui correspond à votre situation
          </p>
        </div>

        {/* Account Type Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Manager Account */}
          <Card 
            className="relative overflow-hidden cursor-pointer hover:border-primary transition-all hover:shadow-medium group"
            onClick={() => navigate("/agency-signup")}
          >
            <CardHeader className="pb-2">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Briefcase className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-xl">Compte Gestionnaire</CardTitle>
              <CardDescription>
                Vous êtes syndic, gestionnaire immobilier ou propriétaire bailleur
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
              <Button className="w-full group-hover:bg-primary/90">
                Créer un compte gestionnaire
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Resident Account */}
          <Card 
            className="relative overflow-hidden cursor-pointer hover:border-kopro-teal transition-all hover:shadow-medium group"
            onClick={() => navigate("/auth")}
          >
            <CardHeader className="pb-2">
              <div className="w-14 h-14 rounded-xl bg-kopro-teal/10 flex items-center justify-center mb-4 group-hover:bg-kopro-teal/20 transition-colors">
                <User className="h-7 w-7 text-kopro-teal" />
              </div>
              <CardTitle className="text-xl">Compte Résident</CardTitle>
              <CardDescription>
                Vous êtes locataire ou copropriétaire d'une résidence
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
              <Button variant="outline" className="w-full border-kopro-teal/50 hover:bg-kopro-teal/10 hover:border-kopro-teal">
                Créer un compte résident
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Already have an account */}
        <div className="text-center">
          <p className="text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <button 
              onClick={() => navigate("/auth")}
              className="text-primary hover:underline font-medium"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
