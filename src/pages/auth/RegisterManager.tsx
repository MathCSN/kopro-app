import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight, User, ArrowLeft, Briefcase, Phone, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AUTH_MESSAGES, parseAuthError, validateSirenSiret } from "@/lib/messages";
import { z } from "zod";

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

export default function RegisterManager() {
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
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate form
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

    // Validate SIREN/SIRET
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

      if (!authData.user) {
        throw new Error("Erreur lors de la création du compte");
      }

      const userId = authData.user.id;

      // Create agency for the manager
      const { data: agencyData, error: agencyError } = await supabase.from("agencies").insert([{
        name: formData.company,
        email: formData.email,
        phone: formData.phone || null,
        siret: formData.sirenSiret.replace(/\s/g, ''),
        owner_id: userId,
        status: "active",
      }]).select().single();

      if (agencyError) throw agencyError;

      // Create manager role for the user
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
        status: "client",
        source: "manager_signup",
        user_id: userId,
      }]);

      toast({
        title: "Compte créé avec succès",
        description: "Bienvenue sur Kopro ! Vous pouvez maintenant créer vos résidences.",
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
      <header className="border-b bg-card p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Retour</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
              <Building2 className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="font-display font-bold text-lg">KOPRO</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 flex flex-col p-6 pb-safe">
        <div className="w-full max-w-lg mx-auto space-y-6">
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Briefcase className="h-7 w-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Créer un compte gestionnaire
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos résidences et locataires avec Kopro
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
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
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 h-12"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{validationErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full h-14 text-lg" 
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? "Création..." : "Créer mon compte gestionnaire"}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-muted-foreground">
              Déjà un compte ?{" "}
              <button
                onClick={() => navigate("/auth/login")}
                className="text-primary hover:underline font-medium"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
