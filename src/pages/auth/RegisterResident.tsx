import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_MESSAGES, parseAuthError } from "@/lib/messages";
import { z } from "zod";
import koproLogo from "@/assets/kopro-logo.svg";

const signUpSchema = z.object({
  firstName: z.string().min(1, AUTH_MESSAGES.FIRST_NAME_REQUIRED).max(100),
  lastName: z.string().min(1, AUTH_MESSAGES.LAST_NAME_REQUIRED).max(100),
  email: z.string().email(AUTH_MESSAGES.INVALID_EMAIL).max(255),
  password: z.string().min(8, AUTH_MESSAGES.PASSWORD_MIN_LENGTH).max(128),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: AUTH_MESSAGES.PASSWORDS_DONT_MATCH,
  path: ["confirmPassword"],
});

export default function RegisterResident() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"form" | "success">("form");
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading, signUp } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/pending");
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

    // Validate
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

    setIsLoading(true);

    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.firstName,
      formData.lastName
    );

    if (error) {
      const errorMessage = parseAuthError(error);
      
      // If user already exists, show specific UI
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
          title: "Erreur d'inscription",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } else {
      setStep("success");
      toast({
        title: "Inscription réussie",
        description: "Bienvenue sur Kopro ! Scannez le QR code de votre résidence.",
      });
    }

    setIsLoading(false);
  };

  const isFormValid = 
    formData.firstName && 
    formData.lastName && 
    formData.email && 
    formData.password && 
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">{AUTH_MESSAGES.LOADING}</div>
      </div>
    );
  }

  // Success step - redirect to QR scanning
  if (step === "success") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card p-4">
          <div className="flex items-center gap-2 max-w-md mx-auto">
            <img src={koproLogo} alt="Kopro" className="w-8 h-8" />
            <span className="font-semibold text-lg">Kopro</span>
          </div>
        </header>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">✓</div>
          <div className="w-12 h-0.5 bg-primary" />
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</div>
          <div className="w-12 h-0.5 bg-muted" />
          <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">3</div>
        </div>

        {/* Content */}
        <main className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <User className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Compte créé avec succès !
              </h1>
              <p className="text-muted-foreground mt-2">
                Bienvenue {formData.firstName} ! Pour accéder à votre résidence, scannez le QR code fourni par votre gestionnaire.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                className="w-full h-14 text-lg" 
                onClick={() => navigate("/pending")}
              >
                Scanner le QR code
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Vous pouvez aussi entrer le code manuellement si vous ne pouvez pas scanner.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
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
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 py-4">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">1</div>
        <div className="w-12 h-0.5 bg-muted" />
        <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">2</div>
        <div className="w-12 h-0.5 bg-muted" />
        <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">3</div>
      </div>

      {/* Form */}
      <main className="flex-1 flex flex-col p-6 pb-safe">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground">
              Créer un compte résident
            </h1>
            <p className="text-muted-foreground mt-1">
              Rejoignez votre résidence sur Kopro
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
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
                    autoCapitalize="words"
                  />
                </div>
                {validationErrors.firstName && (
                  <p className="text-sm text-destructive">{validationErrors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Dupont"
                  className="h-12"
                  value={formData.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                  autoCapitalize="words"
                />
                {validationErrors.lastName && (
                  <p className="text-sm text-destructive">{validationErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jean@email.fr"
                  className="pl-10 h-12"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  autoCapitalize="off"
                  inputMode="email"
                />
              </div>
              {validationErrors.email && (
                <p className="text-sm text-destructive">{validationErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-sm text-destructive">{validationErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
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

            {/* Sticky button at bottom on mobile */}
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full h-14 text-lg" 
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? "Création..." : "Continuer"}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </form>

          <div className="text-center pt-4">
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
