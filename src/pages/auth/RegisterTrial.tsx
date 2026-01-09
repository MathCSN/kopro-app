import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, ArrowLeft, Phone, Hash, Building2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AUTH_MESSAGES, parseAuthError, validateSirenSiret } from "@/lib/messages";
import { z } from "zod";
import koproLogo from "@/assets/kopro-logo.svg";
import { addDays } from "date-fns";

const TRIAL_DURATION_DAYS = 30;

const signUpSchema = z.object({
  firstName: z.string().min(1, AUTH_MESSAGES.FIRST_NAME_REQUIRED).max(100),
  lastName: z.string().min(1, AUTH_MESSAGES.LAST_NAME_REQUIRED).max(100),
  email: z.string().email(AUTH_MESSAGES.INVALID_EMAIL).max(255),
  password: z.string().min(8, AUTH_MESSAGES.PASSWORD_MIN_LENGTH).max(128),
  confirmPassword: z.string(),
  company: z.string().min(1, "Nom de l'agence requis").max(200),
  sirenSiret: z.string(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: AUTH_MESSAGES.PASSWORDS_DONT_MATCH,
  path: ["confirmPassword"],
});

export default function RegisterTrial() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    company: "",
    sirenSiret: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const result = signUpSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    const sirenValidation = validateSirenSiret(formData.sirenSiret);
    if (!sirenValidation.valid) {
      setValidationErrors({ sirenSiret: sirenValidation.error! });
      return;
    }

    setIsLoading(true);

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erreur lors de la création du compte");

      const userId = authData.user.id;
      const now = new Date();

      // Create trial account record
      const { data: trialData, error: trialError } = await supabase
        .from("trial_accounts")
        .insert([{
          email: formData.email,
          agency_name: formData.company,
          duration_days: TRIAL_DURATION_DAYS,
          status: "active",
          user_id: userId,
          started_at: now.toISOString(),
          expires_at: addDays(now, TRIAL_DURATION_DAYS).toISOString(),
        }])
        .select()
        .single();

      if (trialError) throw trialError;

      // Create agency with trial status
      const { data: agencyData, error: agencyError } = await supabase.from("agencies").insert([{
        name: formData.company,
        email: formData.email,
        phone: formData.phone || null,
        siret: formData.sirenSiret.replace(/\s/g, ""),
        owner_id: userId,
        status: "trial",
        trial_account_id: trialData.id,
      }]).select().single();

      if (agencyError) throw agencyError;

      // Update trial with agency_id
      await supabase
        .from("trial_accounts")
        .update({ agency_id: agencyData.id })
        .eq("id", trialData.id);

      // Create manager role
      const { error: roleError } = await supabase.from("user_roles").insert([{
        user_id: userId,
        role: "manager",
        agency_id: agencyData.id,
      }]);

      if (roleError) throw roleError;

      // Create CRM contact
      await supabase.from("crm_contacts").insert([{
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        company: formData.company,
        phone: formData.phone || null,
        status: "trial",
        source: "trial_signup",
        user_id: userId,
      }]);

      toast({
        title: "Compte créé avec succès",
        description: `Bienvenue ! Votre période d'essai de ${TRIAL_DURATION_DAYS} jours est activée.`,
      });

      navigate("/dashboard");
    } catch (error: any) {
      const errorMessage = parseAuthError(error);
      
      if (errorMessage === AUTH_MESSAGES.USER_ALREADY_EXISTS) {
        setValidationErrors({ email: errorMessage });
        toast({
          title: "Compte existant",
          description: errorMessage,
          variant: "destructive",
          action: (
            <Button variant="outline" size="sm" onClick={() => navigate("/auth/login")}>
              Se connecter
            </Button>
          ),
        });
      } else {
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = 
    formData.firstName && 
    formData.lastName && 
    formData.email && 
    formData.password && 
    formData.confirmPassword &&
    formData.company &&
    formData.sirenSiret &&
    formData.password === formData.confirmPassword;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">{AUTH_MESSAGES.LOADING}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Retour</span>
          </button>
          <div className="flex items-center gap-2">
            <img src={koproLogo} alt="Kopro" className="w-8 h-8" />
            <span className="font-semibold text-lg">Kopro</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      {/* Trial banner */}
      <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-4 py-3">
        <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200">
          <Gift className="h-5 w-5" />
          <span className="font-medium">
            Période d'essai gratuite de {TRIAL_DURATION_DAYS} jours
          </span>
          <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">
            Sans paiement
          </Badge>
        </div>
      </div>

      {/* Form */}
      <main className="flex-1 flex flex-col p-6 pb-safe">
        <div className="w-full max-w-lg mx-auto space-y-6">
          {/* Existing account CTA */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Déjà un compte ?</p>
                  <p className="text-sm text-muted-foreground">Connectez-vous à votre espace</p>
                </div>
              </div>
              <Button onClick={() => navigate("/auth/login")} className="gap-2">
                Se connecter
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou créez un compte</span>
            </div>
          </div>

          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <Gift className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              Essayez gratuitement pendant {TRIAL_DURATION_DAYS} jours
            </h1>
            <p className="text-muted-foreground mt-1">
              Sans engagement, sans carte bancaire
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="Jean"
                    className="pl-10 h-12"
                    value={formData.firstName}
                    onChange={handleChange}
                    autoComplete="given-name"
                  />
                </div>
                {validationErrors.firstName && (
                  <p className="text-sm text-destructive">{validationErrors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Dupont"
                  className="h-12"
                  value={formData.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                />
                {validationErrors.lastName && (
                  <p className="text-sm text-destructive">{validationErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Company info */}
            <div className="space-y-2">
              <Label htmlFor="company">Nom de l'agence *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company"
                  name="company"
                  type="text"
                  placeholder="Agence Immobilière XYZ"
                  className="pl-10 h-12"
                  value={formData.company}
                  onChange={handleChange}
                />
              </div>
              {validationErrors.company && (
                <p className="text-sm text-destructive">{validationErrors.company}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sirenSiret">SIREN ou SIRET *</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="sirenSiret"
                  name="sirenSiret"
                  type="text"
                  placeholder="123 456 789 ou 123 456 789 00012"
                  className="pl-10 h-12 font-mono"
                  value={formData.sirenSiret}
                  onChange={handleChange}
                  inputMode="numeric"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                SIREN (9 chiffres) ou SIRET (14 chiffres)
              </p>
              {validationErrors.sirenSiret && (
                <p className="text-sm text-destructive">{validationErrors.sirenSiret}</p>
              )}
            </div>

            {/* Contact info */}
            <div className="space-y-2">
              <Label htmlFor="email">Email professionnel *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contact@agence.com"
                  className="pl-10 h-12"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  inputMode="email"
                />
              </div>
              {validationErrors.email && (
                <p className="text-sm text-destructive">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  className="pl-10 h-12"
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-12"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-sm text-destructive">{validationErrors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-12"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                {validationErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{validationErrors.confirmPassword}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Minimum 8 caractères</p>

            <Button 
              type="submit" 
              className="w-full h-12 bg-green-600 hover:bg-green-700 gap-2"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Gift className="h-5 w-5" />
                  Démarrer mon essai gratuit
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            En créant un compte, vous acceptez nos{" "}
            <a href="#" className="underline hover:text-foreground">conditions d'utilisation</a>
            {" "}et notre{" "}
            <a href="#" className="underline hover:text-foreground">politique de confidentialité</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
