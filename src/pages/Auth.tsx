import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Email invalide").max(255, "Email trop long"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").max(128, "Mot de passe trop long")
});

const signUpSchema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(100, "Prénom trop long"),
  lastName: z.string().min(1, "Nom requis").max(100, "Nom trop long"),
  email: z.string().email("Email invalide").max(255, "Email trop long"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(128, "Mot de passe trop long")
});

export default function Auth() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, isLoading: authLoading, login, signUp } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && profile) {
      navigate(profile.role === 'owner' ? "/owner" : "/dashboard");
    }
  }, [user, profile, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    
    // Validate input
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
      let errorMessage = "Erreur de connexion";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Email ou mot de passe incorrect";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Veuillez confirmer votre email avant de vous connecter";
      } else {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur Kopro!",
      });
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    
    // Validate input
    const result = signUpSchema.safeParse({ firstName, lastName, email, password });
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

    const { error } = await signUp(email, password, firstName, lastName);
    
    if (error) {
      let errorMessage = "Erreur lors de l'inscription";
      
      if (error.message.includes("User already registered")) {
        errorMessage = "Cet email est déjà utilisé";
      } else if (error.message.includes("Password")) {
        errorMessage = "Le mot de passe ne respecte pas les critères de sécurité";
      } else {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur d'inscription",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Inscription réussie",
        description: "Bienvenue sur Kopro! Vous êtes maintenant connecté.",
      });
    }
    
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
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
            <div className="w-12 h-12 rounded-2xl gradient-accent flex items-center justify-center shadow-glow">
              <Building2 className="h-7 w-7 text-accent-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold text-primary-foreground">Kopro</h1>
          </div>
          
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
            Gérez votre copropriété en toute simplicité
          </h2>
          
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-md">
            Une plateforme moderne pour la gestion de votre résidence : incidents, réservations, documents, paiements et plus encore.
          </p>
          
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              "Incidents & suivi",
              "Réservations",
              "Documents officiels",
              "Paiements en ligne",
              "Assemblées & votes",
              "Messagerie sécurisée",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-primary-foreground/90">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-soft">
              <Building2 className="h-6 w-6 text-accent-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Kopro</h1>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="font-display text-2xl font-semibold text-foreground">Bon retour!</h2>
                <p className="text-muted-foreground">Connectez-vous à votre espace copropriétaire</p>
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
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
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
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Connexion..." : "Se connecter"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="font-display text-2xl font-semibold text-foreground">Créer un compte</h2>
                <p className="text-muted-foreground">Rejoignez votre résidence sur Kopro</p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="firstName" 
                        placeholder="Jean" 
                        className="pl-10"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required 
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
                      placeholder="Dupont"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required 
                    />
                    {validationErrors.lastName && (
                      <p className="text-sm text-destructive">{validationErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registerEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="registerEmail" 
                      type="email" 
                      placeholder="votre@email.fr" 
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-sm text-destructive">{validationErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registerPassword">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="registerPassword" 
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

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Inscription..." : "Créer mon compte"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Quick login buttons for testing */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-4">Connexion rapide (dev)</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setIsLoading(true);
                  const { error } = await login("cousinmathis31@gmail.com", "test1234");
                  setIsLoading(false);
                  if (error) {
                    toast({
                      title: "Erreur de connexion",
                      description: error.message,
                      variant: "destructive",
                    });
                  }
                }}
                disabled={isLoading}
                className="text-xs"
              >
                <Building2 className="h-3 w-3 mr-1" />
                Admin
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setIsLoading(true);
                  const { error } = await login("manager@kopro.fr", "test1234");
                  setIsLoading(false);
                  if (error) {
                    toast({
                      title: "Erreur de connexion",
                      description: error.message,
                      variant: "destructive",
                    });
                  }
                }}
                disabled={isLoading}
                className="text-xs"
              >
                <User className="h-3 w-3 mr-1" />
                Resp. Agence
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setIsLoading(true);
                  const { error } = await login("syndic@kopro.fr", "test1234");
                  setIsLoading(false);
                  if (error) {
                    toast({
                      title: "Erreur de connexion",
                      description: error.message,
                      variant: "destructive",
                    });
                  }
                }}
                disabled={isLoading}
                className="text-xs"
              >
                <User className="h-3 w-3 mr-1" />
                Syndic
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setIsLoading(true);
                  const { error } = await login("resident@kopro.fr", "test1234");
                  setIsLoading(false);
                  if (error) {
                    toast({
                      title: "Erreur de connexion",
                      description: error.message,
                      variant: "destructive",
                    });
                  }
                }}
                disabled={isLoading}
                className="text-xs"
              >
                <User className="h-3 w-3 mr-1" />
                Résident
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
