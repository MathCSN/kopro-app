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
  syndic_monthly_price_per_residence: number | null;
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
    syndic_monthly_price_per_residence: 29.90,
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
        syndic_monthly_price_per_residence: pricing.syndic_monthly_price_per_residence || 29.90,
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
          syndic_monthly_price_per_residence: data.syndic_monthly_price_per_residence,
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

  // Example calculation for Bailleur
  const bailleurResidences = 3;
  const bailleurApartments = 50;
  const bailleurActivation = formData.activation_price_per_residence * bailleurResidences;
  const bailleurMonthly = formData.monthly_price_per_apartment * bailleurApartments;

  // Example calculation for Syndic
  const syndicResidences = 10;
  const syndicMonthly = formData.syndic_monthly_price_per_residence * syndicResidences;

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
          <>
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Bailleur Pricing Card */}
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-xl">
                      🏠
                    </div>
                    <div>
                      <CardTitle>Tarification Bailleur</CardTitle>
                      <CardDescription>
                        Propriétaires avec biens locatifs
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
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

                    {/* Bailleur Simulation */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                        📊 Simulation Bailleur
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-300 mb-3">
                        Exemple : {bailleurResidences} résidences, {bailleurApartments} appartements
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Activation ({bailleurResidences} × {formData.activation_price_per_residence}€)</span>
                          <span className="font-medium">{bailleurActivation.toLocaleString()}€</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mensuel ({bailleurApartments} × {formData.monthly_price_per_apartment}€)</span>
                          <span className="font-medium">{bailleurMonthly.toLocaleString()}€/mois</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Syndic Pricing Card */}
              <Card className="shadow-soft">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-xl">
                      🏢
                    </div>
                    <div>
                      <CardTitle>Tarification Syndic</CardTitle>
                      <CardDescription>
                        Gestionnaires de copropriétés
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="syndic_price">
                        Prix mensuel par résidence (€)
                      </Label>
                      <Input
                        id="syndic_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.syndic_monthly_price_per_residence}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            syndic_monthly_price_per_residence: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Forfait mensuel par résidence gérée (pas de frais d'activation)
                      </p>
                    </div>

                    {/* Syndic Simulation */}
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                        📊 Simulation Syndic
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-300 mb-3">
                        Exemple : {syndicResidences} résidences gérées
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Mensuel ({syndicResidences} × {formData.syndic_monthly_price_per_residence}€)</span>
                          <span className="font-medium">{syndicMonthly.toLocaleString()}€/mois</span>
                        </div>
                        <div className="flex justify-between text-purple-700 dark:text-purple-300 font-semibold border-t border-purple-200 dark:border-purple-700 pt-2 mt-2">
                          <span>Revenu mensuel récurrent</span>
                          <span>{syndicMonthly.toLocaleString()}€</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Save Button */}
            <Card className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Enregistrer les modifications</h3>
                    {pricing?.updated_at && (
                      <p className="text-sm text-muted-foreground">
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
                  <Button
                    onClick={handleSubmit}
                    disabled={updateMutation.isPending}
                    size="lg"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Enregistrer les tarifs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
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
