import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Euro, Save, Loader2, History, Info, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PricingConfig {
  id: string;
  activation_price_per_residence: number;
  monthly_price_per_apartment: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminPricing() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    activation_price_per_residence: 299,
    monthly_price_per_apartment: 2.5,
  });

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

  useEffect(() => {
    if (pricing) {
      setFormData({
        activation_price_per_residence: pricing.activation_price_per_residence,
        monthly_price_per_apartment: pricing.monthly_price_per_apartment,
      });
    }
  }, [pricing]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!pricing?.id) throw new Error("No pricing config found");
      
      const { error } = await supabase
        .from("pricing_config")
        .update({
          activation_price_per_residence: data.activation_price_per_residence,
          monthly_price_per_apartment: data.monthly_price_per_apartment,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pricing.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-config"] });
      toast.success("Tarification mise à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!user) return null;

  // Example calculation
  const exampleResidences = 3;
  const exampleApartments = 50;
  const exampleActivation = formData.activation_price_per_residence * exampleResidences;
  const exampleMonthly = formData.monthly_price_per_apartment * exampleApartments;

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Tarification</h1>
          <p className="text-muted-foreground mt-1">
            Définissez les prix de référence pour les devis et abonnements
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Ces tarifs servent de <strong>référence comptable</strong> et de <strong>base légale</strong>. 
            Les remises sont appliquées uniquement sur les devis, sans modifier ces prix catalogue.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Configuration Form */}
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Euro className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Prix catalogue</CardTitle>
                    <CardDescription>
                      Prix standards appliqués aux devis et abonnements
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="activation_price">
                        Prix d'activation par résidence (€)
                      </Label>
                      <Input
                        id="activation_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.activation_price_per_residence}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            activation_price_per_residence: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Frais unique facturé à l'activation de chaque résidence
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monthly_price">
                        Prix mensuel par appartement (€)
                      </Label>
                      <Input
                        id="monthly_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.monthly_price_per_apartment}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            monthly_price_per_apartment: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Abonnement mensuel par lot/appartement
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="w-full"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Enregistrer
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Preview / Simulation */}
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                    <History className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Simulation</CardTitle>
                    <CardDescription>
                      Exemple de facturation avec les prix actuels
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Exemple : {exampleResidences} résidences, {exampleApartments} appartements
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Activation ({exampleResidences} × {formData.activation_price_per_residence}€)</span>
                        <span className="font-medium">{exampleActivation.toLocaleString()}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Mensuel ({exampleApartments} × {formData.monthly_price_per_apartment}€)</span>
                        <span className="font-medium">{exampleMonthly.toLocaleString()}€/mois</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-semibold">
                          <span>Total activation</span>
                          <span className="text-primary">{exampleActivation.toLocaleString()}€</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Revenu mensuel récurrent</span>
                          <span className="text-primary">{exampleMonthly.toLocaleString()}€</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {pricing?.updated_at && (
                    <p className="text-xs text-muted-foreground text-center">
                      Dernière modification : {new Date(pricing.updated_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Link to payment page */}
        <Card className="shadow-soft">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Page de paiement publique</h3>
              <p className="text-sm text-muted-foreground">
                Consultez la page de paiement visible par les clients
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/admin/payment-page")} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Voir la page de paiement
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
