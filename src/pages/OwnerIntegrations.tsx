import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plug, CreditCard, Building, FileText, Phone, Mail, 
  Shield, Check, X, ExternalLink, Loader2, Settings
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { OwnerLayout } from "@/components/layout/OwnerLayout";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StripeConfigForm } from "@/components/integrations/StripeConfigForm";
import { supabase } from "@/integrations/supabase/client";

type IntegrationStatus = 'connected' | 'disconnected' | 'pending';

type Integration = {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: IntegrationStatus;
  category: 'payment' | 'banking' | 'accounting' | 'communication' | 'security';
};

const INTEGRATIONS: Integration[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Paiements par carte bancaire et SEPA',
    icon: CreditCard,
    status: 'disconnected',
    category: 'payment',
  },
  {
    id: 'qonto',
    name: 'Qonto',
    description: 'Connexion directe à votre compte bancaire professionnel',
    icon: Building,
    status: 'disconnected',
    category: 'banking',
  },
  {
    id: 'pennylane',
    name: 'Pennylane',
    description: 'Synchronisation comptable automatique',
    icon: FileText,
    status: 'disconnected',
    category: 'accounting',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Export comptable vers QuickBooks',
    icon: FileText,
    status: 'disconnected',
    category: 'accounting',
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Intégration comptable Sage',
    icon: FileText,
    status: 'disconnected',
    category: 'accounting',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Envoi de SMS et appels',
    icon: Phone,
    status: 'disconnected',
    category: 'communication',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Envoi d\'emails transactionnels',
    icon: Mail,
    status: 'disconnected',
    category: 'communication',
  },
  {
    id: '2fa_sms',
    name: 'Authentification 2FA SMS',
    description: 'Double authentification par SMS',
    icon: Shield,
    status: 'disconnected',
    category: 'security',
  },
];

export default function OwnerIntegrations() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Qonto specific
  const [qontoApiKey, setQontoApiKey] = useState("");
  
  // 2FA specific
  const [enable2FA, setEnable2FA] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Load Stripe connection status on mount
  useEffect(() => {
    const checkStripeStatus = async () => {
      try {
        const { data } = await supabase
          .from("app_config")
          .select("value")
          .eq("key", "stripe_secret_key")
          .single();
        
        if (data?.value) {
          setIntegrations(prev => prev.map(i => 
            i.id === "stripe" ? { ...i, status: "connected" as IntegrationStatus } : i
          ));
        }
      } catch (error) {
        // No config found, that's ok
      }
    };
    checkStripeStatus();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const openConfigDialog = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsConfigDialogOpen(true);
  };

  const handleConnect = async () => {
    if (!selectedIntegration) return;
    
    setIsConnecting(true);
    
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIntegrations(prev => prev.map(i => 
      i.id === selectedIntegration.id 
        ? { ...i, status: 'connected' as IntegrationStatus }
        : i
    ));
    
    toast({
      title: "Intégration connectée",
      description: `${selectedIntegration.name} a été connecté avec succès.`,
    });
    
    setIsConnecting(false);
    setIsConfigDialogOpen(false);
    setSelectedIntegration(null);
  };

  const handleDisconnect = (integrationId: string) => {
    setIntegrations(prev => prev.map(i => 
      i.id === integrationId 
        ? { ...i, status: 'disconnected' as IntegrationStatus }
        : i
    ));
    
    toast({
      title: "Intégration déconnectée",
      description: "L'intégration a été déconnectée.",
    });
  };

  if (!user) return null;

  const getStatusBadge = (status: IntegrationStatus) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500 text-white"><Check className="h-3 w-3 mr-1" />Connecté</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />En attente</Badge>;
      default:
        return <Badge variant="outline"><X className="h-3 w-3 mr-1" />Non connecté</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'payment': return 'Paiements';
      case 'banking': return 'Banque';
      case 'accounting': return 'Comptabilité';
      case 'communication': return 'Communication';
      case 'security': return 'Sécurité';
      default: return category;
    }
  };

  const groupedIntegrations = {
    payment: integrations.filter(i => i.category === 'payment'),
    banking: integrations.filter(i => i.category === 'banking'),
    accounting: integrations.filter(i => i.category === 'accounting'),
    communication: integrations.filter(i => i.category === 'communication'),
    security: integrations.filter(i => i.category === 'security'),
  };

  const renderConfigForm = () => {
    if (!selectedIntegration) return null;

    switch (selectedIntegration.id) {
      case 'stripe':
        return (
          <StripeConfigForm 
            onConnected={() => {
              setIntegrations(prev => prev.map(i => 
                i.id === 'stripe' ? { ...i, status: 'connected' as IntegrationStatus } : i
              ));
              setIsConfigDialogOpen(false);
            }}
            onDisconnected={() => {
              setIntegrations(prev => prev.map(i => 
                i.id === 'stripe' ? { ...i, status: 'disconnected' as IntegrationStatus } : i
              ));
              setIsConfigDialogOpen(false);
            }}
          />
        );

      case 'qonto':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Clé API Qonto</Label>
              <Input 
                type="password"
                value={qontoApiKey}
                onChange={(e) => setQontoApiKey(e.target.value)}
                placeholder="Votre clé API Qonto"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Vous pouvez obtenir votre clé API depuis les paramètres de votre compte Qonto.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a href="https://qonto.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir Qonto
              </a>
            </Button>
          </div>
        );

      case '2fa_sms':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Activer la 2FA par SMS</p>
                <p className="text-sm text-muted-foreground">Obligatoire pour tous les gestionnaires</p>
              </div>
              <Switch checked={enable2FA} onCheckedChange={setEnable2FA} />
            </div>
            {enable2FA && (
              <div className="space-y-2">
                <Label>Numéro de téléphone administrateur</Label>
                <Input 
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                />
                <p className="text-sm text-muted-foreground">
                  Un code de vérification sera envoyé à ce numéro à chaque connexion.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Clé API</Label>
              <Input 
                type="password"
                placeholder="Entrez votre clé API..."
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Consultez la documentation de {selectedIntegration.name} pour obtenir vos identifiants.
            </p>
          </div>
        );
    }
  };

  return (
    <OwnerLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Intégrations</h1>
          <p className="text-muted-foreground mt-1">Connectez vos services externes</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">
                {integrations.filter(i => i.status === 'connected').length}
              </p>
              <p className="text-sm text-muted-foreground">Connectées</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">
                {integrations.filter(i => i.status === 'disconnected').length}
              </p>
              <p className="text-sm text-muted-foreground">Disponibles</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{integrations.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-muted-foreground">Catégories</p>
            </CardContent>
          </Card>
        </div>

        {/* Integrations by category */}
        <Tabs defaultValue="payment">
          <TabsList className="mb-6">
            <TabsTrigger value="payment">Paiements</TabsTrigger>
            <TabsTrigger value="banking">Banque</TabsTrigger>
            <TabsTrigger value="accounting">Comptabilité</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
          </TabsList>

          {Object.entries(groupedIntegrations).map(([category, items]) => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((integration) => (
                  <Card key={integration.id} className="shadow-soft">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <integration.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{integration.name}</CardTitle>
                          </div>
                        </div>
                        {getStatusBadge(integration.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {integration.description}
                      </p>
                      {integration.status === 'connected' ? (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => openConfigDialog(integration)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Configurer
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDisconnect(integration.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => openConfigDialog(integration)}
                        >
                          <Plug className="h-4 w-4 mr-2" />
                          Connecter
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Config Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className={selectedIntegration?.id === 'stripe' ? 'max-w-2xl max-h-[90vh] overflow-y-auto' : ''}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIntegration && (
                <>
                  <selectedIntegration.icon className="h-5 w-5" />
                  Configurer {selectedIntegration.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedIntegration?.description}
            </DialogDescription>
          </DialogHeader>

          {renderConfigForm()}

          {/* Only show footer buttons for non-Stripe integrations */}
          {selectedIntegration?.id !== 'stripe' && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {selectedIntegration?.status === 'connected' ? 'Mettre à jour' : 'Connecter'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </OwnerLayout>
  );
}
