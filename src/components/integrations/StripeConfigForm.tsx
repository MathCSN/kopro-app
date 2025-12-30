import { useState, useEffect } from "react";
import { 
  CreditCard, Check, X, Loader2, Eye, EyeOff, 
  AlertCircle, CheckCircle2, Building 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useStripeConfig, StripeConfig } from "@/hooks/useStripeConfig";

interface StripeConfigFormProps {
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function StripeConfigForm({ onConnected, onDisconnected }: StripeConfigFormProps) {
  const {
    config,
    isLoading,
    isSaving,
    isTesting,
    connectionStatus,
    accountInfo,
    testError,
    saveConfig,
    testConnection,
  } = useStripeConfig();

  const [formData, setFormData] = useState<StripeConfig>(config);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleInputChange = (field: keyof StripeConfig, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async () => {
    const success = await testConnection(formData.secretKey);
    if (success && onConnected) {
      onConnected();
    }
  };

  const handleSave = async () => {
    const success = await saveConfig(formData);
    if (success && connectionStatus === "success" && onConnected) {
      onConnected();
    }
  };

  const handleDisconnect = async () => {
    await saveConfig({
      secretKey: "",
      webhookSecret: "",
      priceIdMonthly: "",
      priceIdActivation: "",
      isTestMode: true,
    });
    if (onDisconnected) {
      onDisconnected();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Banner */}
      {connectionStatus !== "idle" && (
        <Card className={connectionStatus === "success" ? "border-green-500/50 bg-green-500/5" : "border-destructive/50 bg-destructive/5"}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {connectionStatus === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              )}
              <div className="flex-1">
                {connectionStatus === "success" && accountInfo ? (
                  <>
                    <p className="font-medium text-green-700 dark:text-green-400">Connecté à Stripe</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Compte:</span>{" "}
                        <span className="font-medium">{accountInfo.business_name || accountInfo.id}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pays:</span>{" "}
                        <span className="font-medium">{accountInfo.country}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Devise:</span>{" "}
                        <span className="font-medium uppercase">{accountInfo.default_currency}</span>
                      </div>
                      <div className="flex gap-2">
                        {accountInfo.charges_enabled && (
                          <Badge variant="secondary" className="text-xs">Paiements actifs</Badge>
                        )}
                        {accountInfo.payouts_enabled && (
                          <Badge variant="secondary" className="text-xs">Virements actifs</Badge>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-destructive">Erreur de connexion</p>
                    <p className="text-sm text-muted-foreground mt-1">{testError}</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Mode Switch */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <p className="font-medium">Mode test</p>
          <p className="text-sm text-muted-foreground">
            Utiliser les clés de test Stripe (recommandé pour les tests)
          </p>
        </div>
        <Switch 
          checked={formData.isTestMode}
          onCheckedChange={(checked) => handleInputChange("isTestMode", checked)}
        />
      </div>

      <Separator />

      {/* API Keys Section */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Clés API
        </h4>

        <div className="space-y-2">
          <Label>Clé secrète (Secret Key) *</Label>
          <div className="relative">
            <Input 
              type={showSecretKey ? "text" : "password"}
              value={formData.secretKey}
              onChange={(e) => handleInputChange("secretKey", e.target.value)}
              placeholder={formData.isTestMode ? "sk_test_..." : "sk_live_..."}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowSecretKey(!showSecretKey)}
            >
              {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Trouvez cette clé dans votre{" "}
            <a 
              href="https://dashboard.stripe.com/apikeys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Dashboard Stripe → Développeurs → Clés API
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label>Clé webhook (Webhook Secret)</Label>
          <div className="relative">
            <Input 
              type={showWebhookSecret ? "text" : "password"}
              value={formData.webhookSecret}
              onChange={(e) => handleInputChange("webhookSecret", e.target.value)}
              placeholder="whsec_..."
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowWebhookSecret(!showWebhookSecret)}
            >
              {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Configurez un webhook dans Stripe pointant vers votre endpoint
          </p>
        </div>
      </div>

      <Separator />

      {/* Price IDs Section */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Building className="h-4 w-4" />
          IDs de prix
        </h4>

        <div className="space-y-2">
          <Label>Price ID - Abonnement mensuel</Label>
          <Input 
            value={formData.priceIdMonthly}
            onChange={(e) => handleInputChange("priceIdMonthly", e.target.value)}
            placeholder="price_..."
          />
          <p className="text-xs text-muted-foreground">
            ID du prix récurrent pour l'abonnement mensuel par appartement
          </p>
        </div>

        <div className="space-y-2">
          <Label>Price ID - Frais d'activation</Label>
          <Input 
            value={formData.priceIdActivation}
            onChange={(e) => handleInputChange("priceIdActivation", e.target.value)}
            placeholder="price_..."
          />
          <p className="text-xs text-muted-foreground">
            ID du prix one-shot pour les frais d'activation
          </p>
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={handleTestConnection}
          disabled={!formData.secretKey || isTesting}
          className="flex-1"
        >
          {isTesting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : connectionStatus === "success" ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : connectionStatus === "error" ? (
            <X className="h-4 w-4 mr-2 text-destructive" />
          ) : null}
          Tester la connexion
        </Button>

        <Button
          onClick={handleSave}
          disabled={!formData.secretKey || isSaving}
          className="flex-1"
        >
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Sauvegarder
        </Button>

        {config.secretKey && (
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            disabled={isSaving}
          >
            Déconnecter
          </Button>
        )}
      </div>
    </div>
  );
}
