import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_MESSAGES, parseAuthError } from "@/lib/messages";
import { z } from "zod";
import koproLogo from "@/assets/kopro-logo.svg";

const loginSchema = z.object({
  email: z.string().email(AUTH_MESSAGES.INVALID_EMAIL).max(255),
  password: z.string().min(1, AUTH_MESSAGES.PASSWORD_REQUIRED).max(128),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isLoading: authLoading, hasResidence, login, resetPassword } = useAuth();

  // Redirect if already logged in based on role
  useEffect(() => {
    if (!authLoading && user && profile) {
      redirectBasedOnRole();
    }
  }, [user, profile, authLoading, hasResidence]);

  const redirectBasedOnRole = () => {
    // If no role assigned, user needs to complete registration flow
    if (!profile?.role) {
      toast({
        title: "Compte en cours de création",
        description: "Veuillez finaliser la création de votre compte.",
      });
      navigate("/pending");
      return;
    }

    if (profile.role === 'admin') {
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur Kopro !",
      });
      navigate("/admin/platform");
    } else if (profile.role === 'manager' || profile.role === 'cs') {
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur Kopro !",
      });
      navigate("/dashboard");
    } else if (profile.role === 'resident') {
      if (hasResidence) {
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur Kopro !",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Compte en cours de création",
          description: "Veuillez finaliser la création de votre compte.",
        });
        navigate("/pending");
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate
    const result = loginSchema.safeParse({ email, password });
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

    const { error } = await login(email, password);

    if (error) {
      const errorMessage = parseAuthError(error);
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      });
    }

    // Toast + redirection are handled by useEffect once the profile is loaded
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const emailSchema = z.string().email(AUTH_MESSAGES.INVALID_EMAIL);
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setValidationErrors({ email: AUTH_MESSAGES.INVALID_EMAIL });
      return;
    }

    setIsLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      toast({
        title: "Erreur",
        description: parseAuthError(error),
        variant: "destructive",
      });
    } else {
      setResetEmailSent(true);
      toast({
        title: "Email envoyé",
        description: "Consultez votre boîte mail pour réinitialiser votre mot de passe.",
      });
    }

    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">{AUTH_MESSAGES.LOADING}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Hero (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-secondary blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-secondary/50 blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-12 lg:p-16">
          <div className="flex items-center gap-3 mb-8">
            <img src={koproLogo} alt="Kopro" className="w-14 h-14" />
            <h1 className="text-3xl font-bold text-primary-foreground">Kopro</h1>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
            Votre résidence, simplifiée
          </h2>
          
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-md">
            Gestionnaires et résidents, retrouvez tout ce dont vous avez besoin : incidents, réservations, documents, paiements et bien plus.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Mobile header */}
        <header className="lg:hidden border-b border-border bg-card p-4">
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
            <div className="w-16" />
          </div>
        </header>

        {/* Form content */}
        <main className="flex-1 flex items-center justify-center p-6 pb-safe">
          <div className="w-full max-w-md space-y-8">
            {showForgotPassword ? (
              // Forgot password form
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-semibold text-foreground">Mot de passe oublié</h2>
                  <p className="text-muted-foreground">
                    {resetEmailSent 
                      ? "Un email de réinitialisation a été envoyé."
                      : "Entrez votre email pour recevoir un lien de réinitialisation"}
                  </p>
                </div>

                {!resetEmailSent ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="resetEmail">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="resetEmail"
                          type="email"
                          placeholder="votre@email.fr"
                          className="pl-10 h-12"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      {validationErrors.email && (
                        <p className="text-sm text-destructive">{validationErrors.email}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full h-12" disabled={isLoading}>
                      {isLoading ? "Envoi..." : "Envoyer le lien"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Consultez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmailSent(false);
                    setValidationErrors({});
                  }}
                  className="w-full text-sm text-primary hover:underline"
                >
                  ← Retour à la connexion
                </button>
              </div>
            ) : (
              // Login form
              <>
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-semibold text-foreground">Bon retour !</h2>
                  <p className="text-muted-foreground">Connectez-vous à votre espace Kopro</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.fr"
                        className="pl-10 h-12"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        inputMode="email"
                        required
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="text-sm text-destructive">{validationErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Mot de passe</Label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-12"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
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

                  {/* Remember me */}
                  <div className="flex items-center space-x-3 py-2">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      className="h-5 w-5"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Rester connecté
                    </label>
                  </div>

                  <Button type="submit" className="w-full h-14 text-lg" disabled={isLoading}>
                    {isLoading ? "Connexion..." : "Se connecter"}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </form>

                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Pas encore de compte ?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate("/auth/register-resident")}
                    >
                      Créer un compte résident
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate("/auth/register-manager")}
                    >
                      Compte gestionnaire
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
