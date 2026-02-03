import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Bell, BellOff, Eye, EyeOff, Shield, Save, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileSettings {
  hideApartment: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  nightMode: boolean;
  doNotDisturb: boolean;
}

export default function Profile() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
  });
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<ProfileSettings>({
    hideApartment: false,
    pushNotifications: true,
    emailNotifications: true,
    nightMode: false,
    doNotDisturb: false,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
          email: data.email || user.email || "",
        });
        setAvatarUrl(data.avatar_url);
        
        // Load settings from profile
        const savedSettings = data.settings as Record<string, unknown> | null;
        if (savedSettings) {
          setSettings({
            hideApartment: Boolean(savedSettings.hideApartment ?? false),
            pushNotifications: Boolean(savedSettings.pushNotifications ?? true),
            emailNotifications: Boolean(savedSettings.emailNotifications ?? true),
            nightMode: Boolean(savedSettings.nightMode ?? false),
            doNotDisturb: Boolean(savedSettings.doNotDisturb ?? false),
          });
        }
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const settingsToSave = {
        hideApartment: settings.hideApartment,
        pushNotifications: settings.pushNotifications,
        emailNotifications: settings.emailNotifications,
        nightMode: settings.nightMode,
        doNotDisturb: settings.doNotDisturb,
      };

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          settings: settingsToSave,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profil mis à jour avec succès");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const getInitials = () => {
    const first = formData.first_name?.charAt(0) || "";
    const last = formData.last_name?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
  };

  if (isLoading) {
    return (
      <AppLayout userRole={profile?.role} onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole={profile?.role} onLogout={handleLogout}>
      <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Mon Profil</h1>
          <p className="text-muted-foreground mt-1">Gérez vos informations personnelles et préférences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="privacy">Confidentialité</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Avatar Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Photo de profil</CardTitle>
                <CardDescription>
                  Votre photo sera visible par les autres résidents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user && (
                  <AvatarUpload
                    userId={user.id}
                    currentAvatarUrl={avatarUrl}
                    initials={getInitials()}
                    onAvatarChange={setAvatarUrl}
                  />
                )}
              </CardContent>
            </Card>

            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Prénom</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="first_name"
                        className="pl-10"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      value={formData.email}
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      className="pl-10"
                      placeholder="+33 6 00 00 00 00"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Confidentialité
                </CardTitle>
                <CardDescription>
                  Contrôlez ce que les autres résidents peuvent voir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      {settings.hideApartment ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      Masquer mon numéro d'appartement
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Les voisins ne verront pas votre numéro d'appartement
                    </p>
                  </div>
                  <Switch
                    checked={settings.hideApartment}
                    onCheckedChange={(checked) => setSettings({ ...settings, hideApartment: checked })}
                  />
                </div>
                
                <Separator />

                <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer les préférences
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Personnalisez vos préférences de notification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications push</Label>
                    <p className="text-sm text-muted-foreground">
                      {!pushSupported 
                        ? "Non supporté sur cet appareil"
                        : permission === "denied"
                        ? "Bloquées dans les paramètres du navigateur"
                        : "Recevez des alertes sur votre appareil"}
                    </p>
                  </div>
                  <Switch
                    checked={pushSubscribed}
                    onCheckedChange={togglePush}
                    disabled={!pushSupported || pushLoading || permission === "denied"}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifications par email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevez des résumés par email
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mode nuit</Label>
                    <p className="text-sm text-muted-foreground">
                      Pas de notifications entre 22h et 8h
                    </p>
                  </div>
                  <Switch
                    checked={settings.nightMode}
                    onCheckedChange={(checked) => setSettings({ ...settings, nightMode: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <BellOff className="h-4 w-4" />
                      Ne pas déranger
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Désactiver toutes les notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.doNotDisturb}
                    onCheckedChange={(checked) => setSettings({ ...settings, doNotDisturb: checked })}
                  />
                </div>

                <Separator />

                <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer les préférences
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
