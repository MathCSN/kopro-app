import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Server, Lock, Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SmtpConfig {
  id?: string;
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
  is_active: boolean;
}

interface SmtpConfigFormProps {
  residenceId: string;
}

const SMTP_PRESETS = [
  { name: "Gmail", host: "smtp.gmail.com", port: 587 },
  { name: "Outlook/Office 365", host: "smtp.office365.com", port: 587 },
  { name: "Yahoo", host: "smtp.mail.yahoo.com", port: 587 },
  { name: "SendGrid", host: "smtp.sendgrid.net", port: 587 },
  { name: "Mailgun", host: "smtp.mailgun.org", port: 587 },
  { name: "Personnalisé", host: "", port: 587 },
];

export function SmtpConfigForm({ residenceId }: SmtpConfigFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("Personnalisé");
  const [config, setConfig] = useState<SmtpConfig>({
    host: "",
    port: 587,
    username: "",
    password: "",
    from_email: "",
    from_name: "",
    use_tls: true,
    is_active: false,
  });

  useEffect(() => {
    fetchConfig();
  }, [residenceId]);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("smtp_configs")
        .select("*")
        .eq("residence_id", residenceId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig({
          id: data.id,
          host: data.host,
          port: data.port,
          username: data.username,
          password: data.password,
          from_email: data.from_email,
          from_name: data.from_name || "",
          use_tls: data.use_tls ?? true,
          is_active: data.is_active ?? false,
        });

        // Detect preset
        const preset = SMTP_PRESETS.find(p => p.host === data.host);
        if (preset) setSelectedPreset(preset.name);
      }
    } catch (error) {
      console.error("Error fetching SMTP config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    const preset = SMTP_PRESETS.find(p => p.name === presetName);
    if (preset) {
      setConfig(prev => ({
        ...prev,
        host: preset.host,
        port: preset.port,
      }));
    }
  };

  const handleSave = async () => {
    if (!config.host || !config.username || !config.from_email) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        residence_id: residenceId,
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        from_email: config.from_email,
        from_name: config.from_name || null,
        use_tls: config.use_tls,
        is_active: config.is_active,
      };

      if (config.id) {
        const { error } = await supabase
          .from("smtp_configs")
          .update(payload)
          .eq("id", config.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("smtp_configs")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setConfig(prev => ({ ...prev, id: data.id }));
      }

      toast.success("Configuration SMTP enregistrée");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.from_email) {
      toast.error("Veuillez configurer l'email d'expéditeur");
      return;
    }
    
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: config.from_email,
          subject: "Test de configuration SMTP - KOPRO",
          body: `<h2>Configuration SMTP validée !</h2>
                 <p>Votre configuration SMTP fonctionne correctement.</p>
                 <p><strong>Serveur:</strong> ${config.host}:${config.port}</p>
                 <p><strong>Expéditeur:</strong> ${config.from_name || 'Non défini'} &lt;${config.from_email}&gt;</p>
                 <p>Ce message a été envoyé depuis KOPRO pour tester votre configuration.</p>`,
          fromName: config.from_name || "KOPRO Test",
          fromEmail: config.from_email,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Email de test envoyé à ${config.from_email}`);
    } catch (error: any) {
      console.error("SMTP test error:", error);
      toast.error(error.message || "Échec de l'envoi de l'email de test");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Configuration SMTP
        </CardTitle>
        <CardDescription>
          Configurez un serveur SMTP personnalisé pour envoyer des emails au nom de votre agence
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset Selection */}
        <div className="space-y-2">
          <Label>Fournisseur email</Label>
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SMTP_PRESETS.map(preset => (
                <SelectItem key={preset.name} value={preset.name}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Server Settings */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Serveur SMTP *</Label>
            <div className="relative">
              <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="smtp.example.com"
                value={config.host}
                onChange={(e) => setConfig({ ...config, host: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Port</Label>
            <Input
              type="number"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 587 })}
            />
          </div>
        </div>

        {/* Credentials */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Identifiant / Email *</Label>
            <Input
              placeholder="votre@email.com"
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Mot de passe *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                className="pl-10 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* From Settings */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Email d'expéditeur *</Label>
            <Input
              type="email"
              placeholder="contact@votre-agence.com"
              value={config.from_email}
              onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Nom de l'expéditeur</Label>
            <Input
              placeholder="Mon Agence Immobilière"
              value={config.from_name}
              onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
            />
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <p className="font-medium">Utiliser TLS</p>
            <p className="text-sm text-muted-foreground">Connexion sécurisée (recommandé)</p>
          </div>
          <Switch
            checked={config.use_tls}
            onCheckedChange={(checked) => setConfig({ ...config, use_tls: checked })}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <p className="font-medium">Activer la configuration</p>
            <p className="text-sm text-muted-foreground">
              Les emails seront envoyés via ce serveur
            </p>
          </div>
          <Switch
            checked={config.is_active}
            onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Enregistrer
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={testing || !config.id}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
            Tester la connexion
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t">
          <p className="font-medium">💡 Pour Gmail:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Activez l'accès aux applications moins sécurisées OU</li>
            <li>Utilisez un mot de passe d'application (recommandé)</li>
            <li>Allez dans: Compte Google → Sécurité → Mots de passe des applications</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
