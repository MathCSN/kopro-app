import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import koproLogo from "@/assets/kopro-logo.svg";

const passwordSchema = z.object({
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(128, "Mot de passe trop long"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      setIsCheckingToken(true);

      const token = searchParams.get('token');

      if (token) {
        setIsValidToken(true);
      } else {
        toast({
          title: "Lien invalide",
          description: "Ce lien de réinitialisation est invalide ou a expiré.",
          variant: "destructive",
        });
      }

      setIsCheckingToken(false);
    };

    checkToken();
  }, [searchParams, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const result = passwordSchema.safeParse({ password, confirmPassword });
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

    try {
      const token = searchParams.get('token');

      const { getFunctionUrl } = await import("@/lib/backendPublic");
      const response = await fetch(
        getFunctionUrl("reset-password-with-token"),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: token,
            newPassword: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Erreur",
          description: data.error || "Impossible de réinitialiser le mot de passe",
          variant: "destructive",
        });
      } else {
        setIsSuccess(true);
        toast({
          title: "Mot de passe mis à jour",
          description: "Votre mot de passe a été modifié avec succès.",
        });

        setTimeout(() => {
          navigate("/auth/login");
        }, 3000);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  if (isCheckingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Vérification...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent/50 blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-12 lg:p-16">
          <div className="flex items-center gap-3 mb-8">
            <img src={koproLogo} alt="KOPRO" className="w-12 h-12" />
            <h1 className="font-display text-3xl font-bold text-primary-foreground">Kopro</h1>
          </div>
          
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
            Réinitialisation du mot de passe
          </h2>
          
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-md">
            Créez un nouveau mot de passe sécurisé pour accéder à votre espace copropriétaire.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src={koproLogo} alt="KOPRO" className="w-10 h-10" />
            <h1 className="font-display text-2xl font-bold text-foreground">Kopro</h1>
          </div>

          {isSuccess ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Mot de passe modifié !
                </h2>
                <p className="text-muted-foreground">
                  Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.
                </p>
              </div>
              <Button onClick={() => navigate("/auth")} className="w-full">
                Se connecter
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : !isValidToken ? (
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Lien invalide
                </h2>
                <p className="text-muted-foreground">
                  Ce lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.
                </p>
              </div>
              <Button onClick={() => navigate("/auth")} variant="outline" className="w-full">
                Retour à la connexion
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Nouveau mot de passe
                </h2>
                <p className="text-muted-foreground">
                  Choisissez un mot de passe sécurisé pour votre compte
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="text-sm text-destructive">{validationErrors.password}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Minimum 8 caractères</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="text-sm text-destructive">{validationErrors.confirmPassword}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Modification..." : "Modifier le mot de passe"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </form>

              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="w-full text-sm text-primary hover:underline"
              >
                ← Retour à la connexion
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
