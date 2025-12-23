import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Key, Users, Shield, Book } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";

const demoCredentials = [
  { email: "resident@kopro.fr", password: "demo123", role: "Résident", description: "Accès résident standard" },
  { email: "cs@kopro.fr", password: "demo123", role: "Conseil Syndical", description: "Accès CS avec lecture étendue" },
  { email: "gestionnaire@kopro.fr", password: "demo123", role: "Gestionnaire", description: "Gestion complète résidence" },
  { email: "admin@kopro.fr", password: "demo123", role: "Superadmin", description: "Admin résidence" },
  { email: "owner@kopro.fr", password: "demo123", role: "Fondateur", description: "Owner plateforme (nouveau!)" },
];

export default function Help() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <AppLayout userRole={user?.role || 'resident'} onLogout={logout}>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Aide & Documentation</h1>
          <p className="text-muted-foreground mt-1">Guide d'utilisation de Kopro</p>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Comptes de démonstration</CardTitle>
            <CardDescription>Utilisez ces identifiants pour tester les différents rôles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demoCredentials.map(cred => (
                <div key={cred.email} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{cred.email}</span>
                      <Badge variant="secondary">{cred.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{cred.description}</p>
                  </div>
                  <span className="font-mono text-sm text-muted-foreground">demo123</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Rôles & Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><strong>Fondateur/Owner:</strong> Crée résidences, gère tous les comptes, paramètres globaux, audit log complet</div>
            <div><strong>Superadmin:</strong> Admin complet d'une résidence</div>
            <div><strong>Gestionnaire:</strong> Gestion opérationnelle, tickets, paiements, module location</div>
            <div><strong>Conseil Syndical:</strong> Lecture étendue, participation aux décisions</div>
            <div><strong>Résident:</strong> Accès personnel, signalements, votes, réservations</div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
