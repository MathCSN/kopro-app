import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Building2, Users, Euro, CheckCircle2, ArrowRight, Loader2,
  Minus, Plus, CreditCard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import koproLogo from "@/assets/kopro-logo.svg";

interface PricingConfig {
  activation_price_per_residence: number;
  monthly_price_per_apartment: number;
}

export default function AgencySignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"config" | "account" | "payment">("config");
  const [isProcessing, setIsProcessing] = useState(false);

  const [config, setConfig] = useState({
    residences_count: 1,
    apartments_count: 20,
  });

  const [accountForm, setAccountForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    company: "",
    phone: "",
  });

  // Fetch pricing
  const { data: pricing } = useQuery({
    queryKey: ["public-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_config")
        .select("activation_price_per_residence, monthly_price_per_apartment")
        .eq("is_active", true)
        .single();

      if (error) {
        // Default pricing if not found
        return {
          activation_price_per_residence: 299,
          monthly_price_per_apartment: 2.5,
        } as PricingConfig;
      }
      return data as PricingConfig;
    },
  });

  const activationPrice = pricing?.activation_price_per_residence || 299;
  const monthlyPrice = pricing?.monthly_price_per_apartment || 2.5;

  const totalActivation = activationPrice * config.residences_count;
  const totalMonthly = monthlyPrice * config.apartments_count;
  const totalHT = totalActivation + totalMonthly;
  const tva = totalHT * 0.2;
  const totalTTC = totalHT + tva;

  const handleConfigNext = () => {
    if (config.residences_count < 1 || config.apartments_count < 1) {
      toast.error("Veuillez sélectionner au moins 1 résidence et 1 appartement");
      return;
    }
    setStep("account");
  };

  const handleAccountSubmit = async () => {
    if (!accountForm.email || !accountForm.password) {
      toast.error("Email et mot de passe requis");
      return;
    }

    if (accountForm.password !== accountForm.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (accountForm.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsProcessing(true);

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: accountForm.email,
        password: accountForm.password,
        options: {
          data: {
            first_name: accountForm.firstName,
            last_name: accountForm.lastName,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Erreur lors de la création du compte");
      }

      const userId = authData.user.id;

      // Create agency for the manager
      const { data: agencyData, error: agencyError } = await supabase.from("agencies").insert([{
        name: accountForm.company || `Agence de ${accountForm.firstName} ${accountForm.lastName}`,
        email: accountForm.email,
        phone: accountForm.phone || null,
        owner_id: userId,
        status: "trial", // Trial until payment
      }]).select().single();

      if (agencyError) throw agencyError;

      // Create manager role for the user
      const { error: roleError } = await supabase.from("user_roles").insert([{
        user_id: userId,
        role: "manager",
        agency_id: agencyData.id,
      }]);

      if (roleError) throw roleError;

      // Create subscription record linked to user
      const { data: subData, error: subError } = await supabase.from("agency_subscriptions").insert([{
        user_id: userId,
        residences_count: config.residences_count,
        apartments_count: config.apartments_count,
        catalog_activation_price: activationPrice,
        catalog_monthly_price: monthlyPrice,
        activation_price_paid: totalActivation,
        monthly_price: totalMonthly,
        status: "pending",
      }]).select().single();

      if (subError) throw subError;

      // Create CRM contact
      await supabase.from("crm_contacts").insert([{
        email: accountForm.email,
        name: `${accountForm.firstName} ${accountForm.lastName}`.trim() || null,
        company: accountForm.company || null,
        phone: accountForm.phone || null,
        status: "pending_payment",
        source: "self_signup",
        user_id: userId,
        subscription_id: subData.id,
      }]);

      toast.success("Compte créé ! Passez au paiement.");
      setStep("payment");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création du compte");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // TODO: Integrate with Stripe checkout
      toast.info("Redirection vers la page de paiement...");

      // Simulate payment flow
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Paiement simulé avec succès !");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du paiement");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={koproLogo} alt="KOPRO" className="w-9 h-9" />
            <span className="font-display font-bold text-xl">KOPRO</span>
          </div>
          <Button variant="ghost" onClick={() => navigate("/auth")}>
            Déjà un compte ?
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {["config", "account", "payment"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : i < ["config", "account", "payment"].indexOf(step)
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < ["config", "account", "payment"].indexOf(step) ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && <div className="w-12 h-0.5 bg-muted" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {step === "config" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Configurez votre abonnement</CardTitle>
                  <CardDescription>
                    Choisissez le nombre de résidences et d'appartements à gérer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Residences */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Résidences</h3>
                        <p className="text-sm text-muted-foreground">
                          {activationPrice}€ d'activation par résidence
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setConfig({ ...config, residences_count: Math.max(1, config.residences_count - 1) })
                        }
                        disabled={config.residences_count <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={config.residences_count}
                        onChange={(e) =>
                          setConfig({ ...config, residences_count: parseInt(e.target.value) || 1 })
                        }
                        className="w-24 text-center text-lg font-medium"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setConfig({ ...config, residences_count: config.residences_count + 1 })}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Apartments */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                        <Users className="h-5 w-5 text-secondary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium">Appartements (total)</h3>
                        <p className="text-sm text-muted-foreground">
                          {monthlyPrice}€/mois par appartement
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setConfig({ ...config, apartments_count: Math.max(1, config.apartments_count - 5) })
                        }
                        disabled={config.apartments_count <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={config.apartments_count}
                        onChange={(e) =>
                          setConfig({ ...config, apartments_count: parseInt(e.target.value) || 1 })
                        }
                        className="w-24 text-center text-lg font-medium"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setConfig({ ...config, apartments_count: config.apartments_count + 5 })}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button className="w-full" size="lg" onClick={handleConfigNext}>
                    Continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === "account" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Créez votre compte</CardTitle>
                  <CardDescription>
                    Informations du responsable d'agence
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prénom</Label>
                      <Input
                        value={accountForm.firstName}
                        onChange={(e) => setAccountForm({ ...accountForm, firstName: e.target.value })}
                        placeholder="Jean"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nom</Label>
                      <Input
                        value={accountForm.lastName}
                        onChange={(e) => setAccountForm({ ...accountForm, lastName: e.target.value })}
                        placeholder="Dupont"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Entreprise</Label>
                    <Input
                      value={accountForm.company}
                      onChange={(e) => setAccountForm({ ...accountForm, company: e.target.value })}
                      placeholder="Agence Immobilière XYZ"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={accountForm.email}
                      onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                      placeholder="jean@agence.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input
                      type="tel"
                      value={accountForm.phone}
                      onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mot de passe *</Label>
                      <Input
                        type="password"
                        value={accountForm.password}
                        onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirmer *</Label>
                      <Input
                        type="password"
                        value={accountForm.confirmPassword}
                        onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button variant="outline" onClick={() => setStep("config")} className="flex-1">
                      Retour
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleAccountSubmit}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Créer mon compte
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === "payment" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Paiement</CardTitle>
                  <CardDescription>
                    Finalisez votre abonnement par carte bancaire
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-6 bg-muted/50 rounded-lg text-center">
                    <CreditCard className="h-12 w-12 mx-auto text-primary mb-4" />
                    <p className="text-muted-foreground">
                      Vous allez être redirigé vers notre page de paiement sécurisée
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handlePayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    Payer {totalTTC.toLocaleString()}€ TTC
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-2">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Activation ({config.residences_count} résidence{config.residences_count > 1 ? "s" : ""})
                    </span>
                    <span>{totalActivation.toLocaleString()}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Mensuel ({config.apartments_count} appts)
                    </span>
                    <span>{totalMonthly.toLocaleString()}€/mois</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total HT</span>
                    <span>{totalHT.toLocaleString()}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TVA (20%)</span>
                    <span>{tva.toLocaleString()}€</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total TTC</span>
                  <span className="text-primary">{totalTTC.toLocaleString()}€</span>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Prix standard sans remise
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
