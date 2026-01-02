import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AgencySubscriptionTabProps {
  agencyId: string;
  ownerId: string | null;
}

export function AgencySubscriptionTab({ agencyId, ownerId }: AgencySubscriptionTabProps) {
  const { data: subscription, isLoading } = useQuery({
    queryKey: ["agency-subscription", ownerId],
    queryFn: async () => {
      if (!ownerId) return null;

      const { data, error } = await supabase
        .from("agency_subscriptions")
        .select("*")
        .eq("user_id", ownerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!ownerId,
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/20 text-green-600 border-green-500/30 gap-1">
            <CheckCircle className="h-3 w-3" />
            Actif
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
            En attente
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/20 text-red-600 border-red-500/30 gap-1">
            <XCircle className="h-3 w-3" />
            Annulé
          </Badge>
        );
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun abonnement</h3>
          <p className="text-muted-foreground">
            Cette agence n'a pas d'abonnement actif
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Abonnement</h3>
        {getStatusBadge(subscription.status)}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tarification mensuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscription.monthly_price?.toFixed(2)} €
              <span className="text-sm font-normal text-muted-foreground">/mois</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tarif catalogue : {subscription.catalog_monthly_price?.toFixed(2)} €
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Frais d'activation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscription.activation_price_paid?.toFixed(2)} €
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tarif catalogue : {subscription.catalog_activation_price?.toFixed(2)} €
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Capacité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Résidences</span>
                <span className="font-medium">{subscription.residences_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Appartements</span>
                <span className="font-medium">{subscription.apartments_count}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créé le</span>
                <span className="font-medium">
                  {subscription.created_at 
                    ? format(new Date(subscription.created_at), "dd MMM yyyy", { locale: fr })
                    : "-"
                  }
                </span>
              </div>
              {subscription.paid_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payé le</span>
                  <span className="font-medium">
                    {format(new Date(subscription.paid_at), "dd MMM yyyy", { locale: fr })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {subscription.stripe_subscription_id && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Informations Stripe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID Abonnement</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {subscription.stripe_subscription_id}
                </code>
              </div>
              {subscription.stripe_customer_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Client</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {subscription.stripe_customer_id}
                  </code>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
