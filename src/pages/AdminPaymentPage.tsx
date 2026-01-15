import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Euro, Building2, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

interface PricingConfig {
  id: string;
  activation_price_per_residence: number;
  monthly_price_per_apartment: number;
  is_active: boolean;
}

export default function AdminPaymentPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const { data: pricing, isLoading } = useQuery({
    queryKey: ["pricing-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_config")
        .select("*")
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data as PricingConfig;
    },
  });

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const features = [
    "Gestion complète des résidences",
    "Suivi des incidents et tickets",
    "Assemblées générales en ligne",
    "Documents partagés",
    "Messagerie intégrée",
    "Tableau de bord analytique",
    "Application mobile",
    "Support prioritaire",
  ];

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/pricing")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Page de paiement</h1>
            <p className="text-muted-foreground mt-1">
              Aperçu de la page de tarification vue par les clients
            </p>
          </div>
        </div>

        {/* Preview Card */}
        <Card className="shadow-soft border-2 border-dashed border-primary/30">
          <CardHeader className="text-center pb-2">
            <Badge className="w-fit mx-auto mb-4" variant="secondary">
              Aperçu client
            </Badge>
            <CardTitle className="text-3xl font-display">Tarifs Kopro</CardTitle>
            <CardDescription className="text-lg">
              Une solution simple et transparente pour gérer vos résidences
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Activation Price */}
                <Card className="border-2">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>Activation</CardTitle>
                    <CardDescription>Frais uniques par résidence</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {pricing?.activation_price_per_residence || 299}€
                    </div>
                    <p className="text-muted-foreground">par résidence</p>
                    <p className="text-sm text-muted-foreground mt-4">
                      Paiement unique à l'activation de chaque résidence
                    </p>
                  </CardContent>
                </Card>

                {/* Monthly Price */}
                <Card className="border-2 border-primary">
                  <CardHeader className="text-center">
                    <Badge className="w-fit mx-auto mb-2">Recommandé</Badge>
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Home className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>Abonnement mensuel</CardTitle>
                    <CardDescription>Par appartement géré</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {pricing?.monthly_price_per_apartment || 2.5}€
                    </div>
                    <p className="text-muted-foreground">par appartement / mois</p>
                    <p className="text-sm text-muted-foreground mt-4">
                      Facturation mensuelle selon le nombre de lots
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Features */}
            <div className="mt-12 max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-center mb-6">Tout inclus</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <Button size="lg" className="px-8" disabled>
                <Euro className="h-5 w-5 mr-2" />
                Démarrer maintenant
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                (Bouton désactivé - Ceci est un aperçu administrateur)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
