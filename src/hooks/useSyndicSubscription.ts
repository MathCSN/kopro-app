import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SyndicSubscription {
  id: string;
  syndic_user_id: string;
  residence_id: string;
  status: "active" | "inactive" | "cancelled" | "trial";
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
}

export function useSyndicSubscription(userId: string | undefined, residenceId: string | undefined) {
  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ["syndic-subscription", userId, residenceId],
    queryFn: async () => {
      if (!userId || !residenceId) return null;

      const { data, error } = await supabase
        .from("syndic_subscriptions")
        .select("*")
        .eq("syndic_user_id", userId)
        .eq("residence_id", residenceId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching syndic subscription:", error);
        return null;
      }

      return data as SyndicSubscription | null;
    },
    enabled: !!userId && !!residenceId,
  });

  const isActive = (() => {
    if (!subscription) return false;

    const now = new Date();

    if (subscription.status === "active" && subscription.current_period_end) {
      return new Date(subscription.current_period_end) > now;
    }

    if (subscription.status === "trial" && subscription.trial_ends_at) {
      return new Date(subscription.trial_ends_at) > now;
    }

    return false;
  })();

  const trialDaysRemaining = (() => {
    if (!subscription?.trial_ends_at || subscription.status !== "trial") return 0;
    const trialEnd = new Date(subscription.trial_ends_at);
    const now = new Date();
    const diffMs = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  })();

  return {
    subscription,
    isLoading,
    isActive,
    isTrial: subscription?.status === "trial",
    trialDaysRemaining,
    refetch,
  };
}

export function useSyndicSubscriptions(userId: string | undefined) {
  return useQuery({
    queryKey: ["syndic-subscriptions-all", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("syndic_subscriptions")
        .select(`
          *,
          residence:residences(id, name, address)
        `)
        .eq("syndic_user_id", userId);

      if (error) {
        console.error("Error fetching syndic subscriptions:", error);
        return [];
      }

      return data;
    },
    enabled: !!userId,
  });
}
