import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Demo users for showcasing different roles
const demoUsers = [
  { email: "resident@kopro.fr", password: "demo123", role: "resident", name: "Marie Dupont", badge: "Résident" },
  { email: "cs@kopro.fr", password: "demo123", role: "cs", name: "Jean Martin", badge: "Conseil Syndical" },
  { email: "gestionnaire@kopro.fr", password: "demo123", role: "manager", name: "Sophie Bernard", badge: "Gestionnaire" },
  { email: "admin@kopro.fr", password: "demo123", role: "admin", name: "Superadmin" , badge: "Superadmin" },
  { email: "owner@kopro.fr", password: "demo123", role: "owner", name: "Pierre Fondateur", badge: "Fondateur / Owner" },
];

export default function Auth() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, login } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(email, password);
    if (success) {
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur Kopro!",
      });
      // Redirect owners to owner dashboard, others to regular dashboard
      const isOwnerUser = email === "owner@kopro.fr";
      navigate(isOwnerUser ? "/owner" : "/dashboard");
    } else {
      toast({
        title: "Erreur de connexion",
        description: "Email ou mot de passe incorrect",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleDemoLogin = (user: typeof demoUsers[0]) => {
    setEmail(user.email);
    setPassword(user.password);
  };

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
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-input" />
                    <span className="text-muted-foreground">Se souvenir de moi</span>
                  </label>
                  <a href="#" className="text-primary hover:underline">Mot de passe oublié?</a>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Connexion..." : "Se connecter"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              {/* Demo accounts */}
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Comptes démo</CardTitle>
                  <CardDescription className="text-xs">Cliquez pour pré-remplir les identifiants</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  {demoUsers.map((user) => (
                    <Button
                      key={user.email}
                      variant="outline"
                      size="sm"
                      className="text-xs justify-start h-auto py-2"
                      onClick={() => handleDemoLogin(user)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{user.badge}</div>
                        <div className="text-muted-foreground">{user.email}</div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register" className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="font-display text-2xl font-semibold text-foreground">Créer un compte</h2>
                <p className="text-muted-foreground">Rejoignez votre résidence sur Kopro</p>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input id="firstName" placeholder="Jean" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input id="lastName" placeholder="Dupont" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registerEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="registerEmail" type="email" placeholder="votre@email.fr" className="pl-10" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Code d'invitation</Label>
                  <Input id="inviteCode" placeholder="KOPRO-XXXX-XXXX" required />
                  <p className="text-xs text-muted-foreground">Ce code vous a été fourni par votre gestionnaire</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registerPassword">Mot de passe</Label>
                  <Input id="registerPassword" type="password" placeholder="••••••••" required />
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Créer mon compte
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}