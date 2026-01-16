import { useNavigate } from "react-router-dom";
import { Building2, Gift, LogIn, CheckCircle, BarChart3, Users, FileText, Shield, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import koproLogo from "@/assets/kopro-logo.svg";

const features = [
  {
    icon: Users,
    title: "Gestion des copropriétaires",
    description: "Centralisez toutes les informations de vos résidents et copropriétaires en un seul endroit."
  },
  {
    icon: FileText,
    title: "Documents partagés",
    description: "Partagez facilement les PV d'AG, règlements et documents importants."
  },
  {
    icon: BarChart3,
    title: "Suivi des incidents",
    description: "Gérez les signalements et suivez leur résolution en temps réel."
  },
  {
    icon: Shield,
    title: "Appels de fonds",
    description: "Automatisez vos appels de charges et suivez les paiements."
  }
];

export default function LandingB2B() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={koproLogo} alt="Kopro" className="w-10 h-10" />
            <span className="font-display font-bold text-2xl">KOPRO</span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/auth/login")}
              className="hidden sm:flex"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Se connecter
            </Button>
            <Button 
              onClick={() => navigate("/auth/register-trial")}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Essai gratuit</span>
              <span className="sm:hidden">Essai</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-kopro-teal/10 blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Building2 className="h-4 w-4" />
              Solutions pour Syndics et Bailleurs
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
              Gérez vos copropriétés{" "}
              <span className="text-primary">en toute simplicité</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Kopro est la plateforme tout-en-un pour les syndics professionnels et bailleurs. 
              Incidents, paiements, documents, communication — tout est centralisé.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg"
                className="gap-2 bg-green-600 hover:bg-green-700 h-14 px-8 text-lg"
                onClick={() => navigate("/auth/register-trial")}
              >
                <Gift className="h-5 w-5" />
                Essai gratuit 30 jours
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg"
                onClick={() => navigate("/auth/login")}
              >
                <LogIn className="h-5 w-5 mr-2" />
                Connexion Gestionnaire
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground pt-2">
              Pas de carte bancaire requise • Configuration en 5 minutes
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Une solution complète pour gérer vos résidences au quotidien
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-soft bg-card">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Pourquoi choisir Kopro ?
              </h2>
              <ul className="space-y-4">
                {[
                  "Application mobile pour vos résidents",
                  "Tableau de bord en temps réel",
                  "Automatisation des appels de fonds",
                  "Gestion documentaire centralisée",
                  "Support client réactif"
                ].map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Button 
                size="lg"
                className="gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => navigate("/auth/register-trial")}
              >
                <Gift className="h-5 w-5" />
                Commencer l'essai gratuit
              </Button>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-kopro-teal/20 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Smartphone className="h-24 w-24 text-primary mx-auto" />
                  <p className="text-lg font-medium text-foreground">
                    Application mobile incluse
                  </p>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Vos résidents accèdent à leur espace depuis l'app mobile Kopro
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
            Prêt à simplifier votre gestion ?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Rejoignez les syndics et bailleurs qui font confiance à Kopro
          </p>
          <Button 
            size="lg"
            variant="secondary"
            className="h-14 px-8 text-lg"
            onClick={() => navigate("/auth/register-trial")}
          >
            <Gift className="h-5 w-5 mr-2" />
            Démarrer l'essai gratuit
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={koproLogo} alt="Kopro" className="w-8 h-8" />
              <span className="font-semibold">Kopro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Kopro - Gestion de copropriété simplifiée
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
