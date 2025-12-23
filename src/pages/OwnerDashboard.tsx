import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  Settings,
  Activity,
  TrendingUp,
  AlertTriangle,
  Plus,
  Eye,
  CreditCard,
  FileText,
  Shield,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { OwnerLayout } from "@/components/layout/OwnerLayout";

// Empty state - data will come from database
const platformStats = {
  totalResidences: 0,
  totalLots: 0,
  totalUsers: 0,
  activeTickets: 0,
  monthlyRevenue: 0,
  pendingPayments: 0,
};

const recentResidences: { id: string; name: string; city: string; lots: number; users: number; status: string }[] = [];

const recentActivity: { id: number; type: string; message: string; time: string; residence: string }[] = [];

const managers: { id: string; name: string; email: string; residences: number; status: string }[] = [];

export default function OwnerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (!user) {
    return null;
  }

  return (
    <OwnerLayout onLogout={handleLogout}>
      <div className="space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              Tableau de bord Kopro
            </h1>
            <p className="text-muted-foreground mt-1">
              Vue d'ensemble de la plateforme
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-kopro-amber text-white border-0">
              <Shield className="h-3 w-3 mr-1" />
              Owner
            </Badge>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{platformStats.totalResidences}</p>
              <p className="text-xs text-muted-foreground">Résidences</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <FileText className="h-5 w-5 text-kopro-teal" />
              </div>
              <p className="text-2xl font-bold text-foreground">{platformStats.totalLots}</p>
              <p className="text-xs text-muted-foreground">Lots</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-kopro-purple" />
              </div>
              <p className="text-2xl font-bold text-foreground">{platformStats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">Utilisateurs</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="h-5 w-5 text-kopro-rose" />
              </div>
              <p className="text-2xl font-bold text-foreground">{platformStats.activeTickets}</p>
              <p className="text-xs text-muted-foreground">Tickets actifs</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <p className="text-2xl font-bold text-foreground">{(platformStats.monthlyRevenue / 1000).toFixed(1)}k€</p>
              <p className="text-xs text-muted-foreground">Revenus / mois</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CreditCard className="h-5 w-5 text-warning" />
              </div>
              <p className="text-2xl font-bold text-foreground">{(platformStats.pendingPayments / 1000).toFixed(1)}k€</p>
              <p className="text-xs text-muted-foreground">Impayés</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Residences */}
          <Card className="lg:col-span-2 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="font-display text-lg">Résidences</CardTitle>
                <CardDescription>Gérez toutes les copropriétés</CardDescription>
              </div>
              <Button size="sm" onClick={() => navigate("/owner/residences")}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle résidence
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentResidences.map((residence) => (
                <div
                  key={residence.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                  onClick={() => navigate(`/owner/residences/${residence.id}`)}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{residence.name}</p>
                      {residence.status === "pending" && (
                        <Badge variant="secondary" className="text-[10px]">En cours</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {residence.city} · {residence.lots} lots · {residence.users} utilisateurs
                    </p>
                  </div>
                  <Button variant="ghost" size="icon-sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions & Activity */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-start" onClick={() => navigate("/owner/residences")}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Résidences
                </Button>
                <Button variant="outline" size="sm" className="justify-start" onClick={() => navigate("/owner/managers")}>
                  <Users className="h-4 w-4 mr-2" />
                  Gestionnaires
                </Button>
                <Button variant="outline" size="sm" className="justify-start" onClick={() => navigate("/owner/billing")}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Facturation
                </Button>
                <Button variant="outline" size="sm" className="justify-start" onClick={() => navigate("/owner/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Paramètres
                </Button>
                <Button variant="outline" size="sm" className="justify-start col-span-2" onClick={() => navigate("/owner/audit")}>
                  <Activity className="h-4 w-4 mr-2" />
                  Journal d'audit global
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg">Activité récente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === "alert" ? "bg-destructive" :
                      activity.type === "payment" ? "bg-success" :
                      activity.type === "user" ? "bg-kopro-purple" :
                      "bg-primary"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.residence} · {activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Managers Overview */}
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="font-display text-lg">Gestionnaires</CardTitle>
              <CardDescription>Équipe de gestion des résidences</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/owner/managers")}>
              Voir tous
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {managers.map((manager) => (
                <div key={manager.id} className="p-4 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{manager.name}</p>
                      <p className="text-xs text-muted-foreground">{manager.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{manager.residences} résidences</Badge>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/owner/impersonate/${manager.id}`)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Impersonate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
