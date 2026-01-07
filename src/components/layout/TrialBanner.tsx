import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight } from "lucide-react";
import { differenceInDays } from "date-fns";

interface TrialInfo {
  id: string;
  expires_at: string;
  status: string;
}

export function TrialBanner() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);

  useEffect(() => {
    if (!user || profile?.role !== "manager") return;

    const fetchTrial = async () => {
      const { data } = await supabase
        .from("trial_accounts")
        .select("id, expires_at, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (data) {
        setTrialInfo(data);
      }
    };

    fetchTrial();
  }, [user, profile]);

  if (!trialInfo) return null;

  const daysRemaining = Math.max(0, differenceInDays(new Date(trialInfo.expires_at), new Date()));

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <Clock className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">
            Vous êtes en période d'essai —{" "}
            <strong>
              {daysRemaining} jour{daysRemaining > 1 ? "s" : ""} restant{daysRemaining > 1 ? "s" : ""}
            </strong>
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-800/50"
          onClick={() => navigate("/agency-signup")}
        >
          Passer à l'abonnement
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
