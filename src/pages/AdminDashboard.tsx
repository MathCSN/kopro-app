import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  Settings,
  Activity,
  TrendingUp,
  AlertTriangle,
  Plus,
  CreditCard,
  FileText,
  Shield,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

export default function OwnerDashboard() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState({
    totalAgencies: 0,
    totalResidences: 0,
    totalLots: 0,
    totalUsers: 0,
    activeTickets: 0,
    activeSubscriptions: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      
      // Fetch agencies count
      const { count: agenciesCount } = await supabase
        .from('agencies')
        .select('*', { count: 'exact', head: true });

      // Fetch residences count
      const { count: residencesCount } = await supabase
        .from('residences')
        .select('*', { count: 'exact', head: true });

      // Fetch lots count
      const { count: lotsCount } = await supabase
        .from('lots')
        .select('*', { count: 'exact', head: true });

      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch active tickets
      const { count: ticketsCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']);

      // Fetch active subscriptions
      const { count: subscriptionsCount } = await supabase
        .from('agency_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setPlatformStats({
        totalAgencies: agenciesCount || 0,
        totalResidences: residencesCount || 0,
        totalLots: lotsCount || 0,
        totalUsers: usersCount || 0,
        activeTickets: ticketsCount || 0,
        activeSubscriptions: subscriptionsCount || 0,
        pendingPayments: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!user) {
    return null;
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              Bienvenue, {profile?.first_name || "Admin"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Vue d'ensemble de la plateforme Kopro
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-kopro-amber text-white border-0">
              <Shield className="h-3 w-3 mr-1" />
              Administrateur
            </Badge>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="shadow-soft cursor-pointer hover:shadow-medium transition-shadow" onClick={() => navigate("/admin/clients")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{platformStats.totalAgencies}</p>
              <p className="text-xs text-muted-foreground">Agences</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft cursor-pointer hover:shadow-medium transition-shadow" onClick={() => navigate("/admin/clients")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="h-5 w-5 text-kopro-teal" />
              </div>
              <p className="text-2xl font-bold text-foreground">{platformStats.totalResidences}</p>
              <p className="text-xs text-muted-foreground">Résidences</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft cursor-pointer hover:shadow-medium transition-shadow" onClick={() => navigate("/admin/clients")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <FileText className="h-5 w-5 text-kopro-purple" />
              </div>
              <p className="text-2xl font-bold text-foreground">{platformStats.totalLots}</p>
              <p className="text-xs text-muted-foreground">Lots</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft cursor-pointer hover:shadow-medium transition-shadow" onClick={() => navigate("/admin/global-users")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-kopro-amber" />
              </div>
              <p className="text-2xl font-bold text-foreground">{platformStats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">Utilisateurs</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft cursor-pointer hover:shadow-medium transition-shadow" onClick={() => navigate("/admin/tickets")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="h-5 w-5 text-kopro-rose" />
              </div>
              <p className="text-2xl font-bold text-foreground">{platformStats.activeTickets}</p>
              <p className="text-xs text-muted-foreground">Tickets actifs</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft cursor-pointer hover:shadow-medium transition-shadow" onClick={() => navigate("/admin/accounting")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <p className="text-2xl font-bold text-foreground">{platformStats.activeSubscriptions}</p>
              <p className="text-xs text-muted-foreground">Abonnements actifs</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-soft lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg">Actions rapides</CardTitle>
              <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/admin/residences")}>
                <Building2 className="h-5 w-5" />
                <span className="text-sm">Résidences</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/admin/managers")}>
                <Users className="h-5 w-5" />
                <span className="text-sm">Gestionnaires</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/admin/quotes")}>
                <CreditCard className="h-5 w-5" />
                <span className="text-sm">Facturation</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/admin/global-users")}>
                <Shield className="h-5 w-5" />
                <span className="text-sm">Utilisateurs</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/admin/global-settings")}>
                <Settings className="h-5 w-5" />
                <span className="text-sm">Paramètres</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate("/admin/audit")}>
                <Activity className="h-5 w-5" />
                <span className="text-sm">Journal d'audit</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
