import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  priceIdMonthly: string;
  priceIdActivation: string;
  isTestMode: boolean;
}

export interface StripeAccountInfo {
  id: string;
  business_name: string | null;
  country: string;
  default_currency: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
}

export function useStripeConfig() {
  const { toast } = useToast();
  const [config, setConfig] = useState<StripeConfig>({
    secretKey: "",
    webhookSecret: "",
    priceIdMonthly: "",
    priceIdActivation: "",
    isTestMode: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [accountInfo, setAccountInfo] = useState<StripeAccountInfo | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Load config from database
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("app_config")
        .select("key, value")
        .in("key", [
          "stripe_secret_key",
          "stripe_webhook_secret",
          "stripe_price_id_monthly",
          "stripe_price_id_activation",
          "stripe_test_mode",
        ]);

      if (error) throw error;

      const configMap: Record<string, string> = {};
      data?.forEach((item) => {
        configMap[item.key] = item.value || "";
      });

      setConfig({
        secretKey: configMap["stripe_secret_key"] || "",
        webhookSecret: configMap["stripe_webhook_secret"] || "",
        priceIdMonthly: configMap["stripe_price_id_monthly"] || "",
        priceIdActivation: configMap["stripe_price_id_activation"] || "",
        isTestMode: configMap["stripe_test_mode"] !== "false",
      });

      // If we have a secret key, check if it's valid
      if (configMap["stripe_secret_key"]) {
        setConnectionStatus("success");
      }
    } catch (error) {
      console.error("Error loading Stripe config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (newConfig: StripeConfig) => {
    setIsSaving(true);
    try {
      const configEntries = [
        { key: "stripe_secret_key", value: newConfig.secretKey },
        { key: "stripe_webhook_secret", value: newConfig.webhookSecret },
        { key: "stripe_price_id_monthly", value: newConfig.priceIdMonthly },
        { key: "stripe_price_id_activation", value: newConfig.priceIdActivation },
        { key: "stripe_test_mode", value: newConfig.isTestMode ? "true" : "false" },
      ];

      for (const entry of configEntries) {
        const { error } = await supabase
          .from("app_config")
          .upsert(
            { key: entry.key, value: entry.value },
            { onConflict: "key" }
          );

        if (error) throw error;
      }

      setConfig(newConfig);
      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres Stripe ont été enregistrés.",
      });
      return true;
    } catch (error) {
      console.error("Error saving Stripe config:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async (secretKey?: string) => {
    setIsTesting(true);
    setTestError(null);
    setConnectionStatus("idle");
    setAccountInfo(null);

    try {
      const response = await supabase.functions.invoke("test-stripe-connection", {
        body: {
          secretKey: secretKey || config.secretKey,
          action: secretKey ? "test_new" : "test_saved",
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;

      if (data.success) {
        setConnectionStatus("success");
        setAccountInfo(data.account);
        toast({
          title: "Connexion réussie",
          description: `Compte Stripe: ${data.account.business_name || data.account.id}`,
        });
        return true;
      } else {
        setConnectionStatus("error");
        setTestError(data.error);
        toast({
          title: "Échec de connexion",
          description: data.error,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error testing Stripe connection:", error);
      setConnectionStatus("error");
      const errorMessage = error instanceof Error ? error.message : "Erreur de connexion";
      setTestError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  return {
    config,
    setConfig,
    isLoading,
    isSaving,
    isTesting,
    connectionStatus,
    accountInfo,
    testError,
    loadConfig,
    saveConfig,
    testConnection,
  };
}
