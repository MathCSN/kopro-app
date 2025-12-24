import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Globe,
  Bell,
  Shield,
  Key,
  Phone,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { OwnerLayout } from "@/components/layout/OwnerLayout";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OwnerSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const handleSendVerificationCode = async () => {
    if (!phoneNumber) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un numéro de téléphone.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    // Simulate sending code
    await new Promise(resolve => setTimeout(resolve, 1500));
    setCodeSent(true);
    setIsVerifying(false);
    toast({
      title: "Code envoyé",
      description: `Un code de vérification a été envoyé au ${phoneNumber}`,
    });
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer le code de vérification.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTwoFAEnabled(true);
    setIsVerifying(false);
    setCodeSent(false);
    toast({
      title: "2FA activée",
      description: "L'authentification à deux facteurs a été activée avec succès.",
    });
  };

  if (!user) return null;

  return (
    <OwnerLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Paramètres globaux</h1>
          <p className="text-muted-foreground mt-1">Configuration de la plateforme KOPRO</p>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Informations plateforme
                </CardTitle>
                <CardDescription>Paramètres généraux de KOPRO</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nom de la plateforme</Label>
                    <Input defaultValue="KOPRO" />
                  </div>
                  <div className="space-y-2">
                    <Label>URL du site</Label>
                    <Input defaultValue="https://kopro.fr" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email de contact</Label>
                    <Input defaultValue="contact@kopro.fr" />
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone support</Label>
                    <Input defaultValue="+33 1 23 45 67 89" />
                  </div>
                </div>
                <Button onClick={() => toast({ title: "Paramètres enregistrés" })}>
                  Enregistrer
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  RGPD & Conservation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Durée conservation candidatures (mois)</Label>
                  <Input type="number" defaultValue="12" />
                </div>
                <div className="space-y-2">
                  <Label>Durée conservation logs (mois)</Label>
                  <Input type="number" defaultValue="24" />
                </div>
                <Button onClick={() => toast({ title: "Paramètres enregistrés" })}>
                  Enregistrer
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Authentification à deux facteurs (2FA)
                </CardTitle>
                <CardDescription>
                  Sécurisez votre compte avec une vérification par SMS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {twoFAEnabled ? (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <Shield className="h-5 w-5" />
                      <span className="font-medium">2FA activée</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Un code de vérification sera envoyé au {phoneNumber} à chaque connexion.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-3"
                      onClick={() => {
                        setTwoFAEnabled(false);
                        setPhoneNumber("");
                        toast({ title: "2FA désactivée" });
                      }}
                    >
                      Désactiver la 2FA
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Numéro de téléphone
                      </Label>
                      <div className="flex gap-2">
                        <Input 
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+33 6 12 34 56 78"
                          disabled={codeSent}
                          className="flex-1"
                        />
                        <Button 
                          onClick={handleSendVerificationCode}
                          disabled={isVerifying || codeSent}
                        >
                          {isVerifying ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Envoyer le code"
                          )}
                        </Button>
                      </div>
                    </div>

                    {codeSent && (
                      <div className="space-y-2 animate-fade-in">
                        <Label>Code de vérification</Label>
                        <div className="flex gap-2">
                          <Input 
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            placeholder="123456"
                            maxLength={6}
                            className="flex-1"
                          />
                          <Button 
                            onClick={handleVerifyCode}
                            disabled={isVerifying}
                          >
                            {isVerifying ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Vérifier"
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Un code a été envoyé au {phoneNumber}
                        </p>
                        <Button 
                          variant="link" 
                          className="p-0 h-auto"
                          onClick={() => {
                            setCodeSent(false);
                            setVerificationCode("");
                          }}
                        >
                          Changer de numéro
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sécurité des sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">2FA obligatoire pour gestionnaires</p>
                    <p className="text-sm text-muted-foreground">Exiger la 2FA pour tous les gestionnaires</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Expiration sessions</p>
                    <p className="text-sm text-muted-foreground">Déconnexion après 24h d'inactivité</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Logs d'audit</p>
                    <p className="text-sm text-muted-foreground">Journaliser toutes les actions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifications email admins</p>
                    <p className="text-sm text-muted-foreground">Recevoir les alertes par email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rapports hebdomadaires</p>
                    <p className="text-sm text-muted-foreground">Résumé automatique chaque lundi</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Alertes impayés</p>
                    <p className="text-sm text-muted-foreground">Notification en cas d'impayés de plus de 30 jours</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nouveaux devis validés</p>
                    <p className="text-sm text-muted-foreground">Notification quand un client valide un devis</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OwnerLayout>
  );
}
