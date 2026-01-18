import { Building2, Crown, Mail, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";

interface SyndicPaywallProps {
  residenceId: string;
  residenceName: string;
  userId: string;
  onContinueFree?: () => void;
}

export function SyndicPaywall({ 
  residenceId, 
  residenceName, 
  userId,
  onContinueFree 
}: SyndicPaywallProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Fetch pricing
  const { data: pricing } = useQuery({
    queryKey: ["syndic-pricing"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pricing_config")
        .select("syndic_monthly_price_per_residence")
        .eq("is_active", true)
        .single();
      return data;
    },
  });

  const monthlyPrice = pricing?.syndic_monthly_price_per_residence || 29.90;

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-syndic-checkout", {
        body: { 
          residenceId, 
          userId,
          successUrl: `${window.location.origin}/syndic-portal?success=true`,
          cancelUrl: `${window.location.origin}/syndic-portal?canceled=true`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Erreur lors de la création du paiement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTrial = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("syndic_subscriptions")
        .upsert({
          syndic_user_id: userId,
          residence_id: residenceId,
          status: "trial",
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: "syndic_user_id,residence_id" });

      if (error) throw error;

      toast.success("Période d'essai activée pour 14 jours !");
      window.location.reload();
    } catch (error) {
      console.error("Trial error:", error);
      toast.error("Erreur lors de l'activation de l'essai");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 relative">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <Badge className="absolute -top-1 -right-1 bg-amber-500">
              <Crown className="h-3 w-3 mr-1" />
              PRO
            </Badge>
          </div>
          <CardTitle className="text-xl">Débloquez l'accès complet</CardTitle>
          <CardDescription>
            Pour gérer la résidence <span className="font-medium text-foreground">{residenceName}</span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Features */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Inclus avec l'abonnement :</p>
            <ul className="space-y-2">
              {[
                "Tableau de bord centralisé des incidents",
                "Gestion des statuts et commentaires",
                "Historique complet des interventions",
                "Statistiques et rapports",
                "Notifications en temps réel",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">
              {monthlyPrice.toFixed(2).replace(".", ",")}€
              <span className="text-base font-normal text-muted-foreground">/mois</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Par résidence • Sans engagement
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleStartTrial}
              disabled={isLoading}
            >
              <Crown className="h-4 w-4 mr-2" />
              Essayer gratuitement 14 jours
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleSubscribe}
              disabled={isLoading}
            >
              S'abonner maintenant
            </Button>
          </div>

          {/* Free option */}
          {onContinueFree && (
            <div className="pt-4 border-t text-center">
              <button
                onClick={onContinueFree}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4 inline mr-1" />
                Continuer avec les notifications email uniquement
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
