import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Home,
  Users,
  Ticket,
  CreditCard,
  FileText,
  ArrowUpRight,
  AlertCircle,
  TrendingUp,
  Plus,
  Calendar,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export default function BailleurDashboard() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalApartments: 0,
    occupiedApartments: 0,
    vacantApartments: 0,
    totalTenants: 0,
    openTickets: 0,
    pendingRent: 0,
    occupancyRate: 0,
    monthlyRevenue: 0,
    recentTickets: [] as any[],
    upcomingLeaseEnds: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch landlord apartments
      const { data: apartments } = await supabase
        .from('landlord_apartments')
        .select('*')
        .eq('landlord_id', user!.id);

      const totalApartments = apartments?.length || 0;
      const occupiedApartments = apartments?.filter(a => a.status === 'occupied').length || 0;
      const vacantApartments = apartments?.filter(a => a.status === 'vacant').length || 0;
      const occupancyRate = totalApartments > 0 ? Math.round((occupiedApartments / totalApartments) * 100) : 0;

      // Fetch active leases
      const { data: leases } = await supabase
        .from('tenant_leases')
        .select('*, landlord_apartments(*)')
        .eq('landlord_id', user!.id)
        .eq('status', 'active');

      const totalTenants = leases?.length || 0;
      const monthlyRevenue = leases?.reduce((sum, l) => sum + Number(l.rent || 0) + Number(l.charges || 0), 0) || 0;

      // Upcoming lease ends (within 60 days)
      const upcomingLeaseEnds = leases?.filter(l => {
        if (!l.end_date) return false;
        const endDate = new Date(l.end_date);
        const diffDays = (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return diffDays > 0 && diffDays <= 60;
      }).slice(0, 3) || [];

      // Fetch tickets for landlord apartments
      const apartmentIds = apartments?.map(a => a.id) || [];
      let openTickets = 0;
      let recentTickets: any[] = [];
      
      if (apartmentIds.length > 0) {
        const { data: tickets } = await supabase
          .from('tickets')
          .select('*')
          .in('landlord_apartment_id', apartmentIds)
          .order('created_at', { ascending: false });

        openTickets = tickets?.filter(t => t.status === 'open' || t.status === 'in_progress').length || 0;
        recentTickets = tickets?.slice(0, 3) || [];
      }

      // Fetch pending payments
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'pending');

      const pendingRent = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

      setStats({
        totalApartments,
        occupiedApartments,
        vacantApartments,
        totalTenants,
        openTickets,
        pendingRent,
        occupancyRate,
        monthlyRevenue,
        recentTickets,
        upcomingLeaseEnds,
      });
    } catch (error) {
      console.error('Error fetching bailleur dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login");
  };

  if (!user || !profile) {
    return null;
  }

  const displayName = profile.first_name || profile.email?.split("@")[0] || "Utilisateur";

return (
    <div className="p-6 space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              Bonjour, {displayName} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez votre portefeuille immobilier
            </p>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <Badge variant="secondary" className="bg-kopro-teal/10 text-kopro-teal border-kopro-teal/20">
              Bailleur
            </Badge>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft cursor-pointer hover:shadow-medium transition-all" onClick={() => navigate("/bailleur/apartments")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Home className="h-5 w-5 text-kopro-teal" />
                <Badge variant="outline" className="text-xs">{stats.occupancyRate}%</Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">{stats.totalApartments}</p>
                <p className="text-xs text-muted-foreground">Appartements</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft cursor-pointer hover:shadow-medium transition-all" onClick={() => navigate("/bailleur/tenants")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-kopro-purple" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">{stats.totalTenants}</p>
                <p className="text-xs text-muted-foreground">Locataires actifs</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft cursor-pointer hover:shadow-medium transition-all" onClick={() => navigate("/bailleur/tickets")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Ticket className="h-5 w-5 text-kopro-rose" />
                {stats.openTickets > 0 && (
                  <Badge variant="destructive" className="text-xs">{stats.openTickets}</Badge>
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">{stats.openTickets}</p>
                <p className="text-xs text-muted-foreground">Incidents ouverts</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft cursor-pointer hover:shadow-medium transition-all" onClick={() => navigate("/bailleur/payments")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <CreditCard className="h-5 w-5 text-kopro-amber" />
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">{stats.monthlyRevenue.toLocaleString()}€</p>
                <p className="text-xs text-muted-foreground">Revenus mensuels</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="group cursor-pointer shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => navigate("/bailleur/apartments/new")}
          >
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-kopro-teal/10 text-kopro-teal flex items-center justify-center mb-3">
                <Plus className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                Ajouter un appartement
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Nouveau bien à gérer</p>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => navigate("/bailleur/tenants/new")}
          >
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-kopro-purple/10 text-kopro-purple flex items-center justify-center mb-3">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                Inviter un locataire
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Nouveau bail</p>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => navigate("/bailleur/payments")}
          >
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-kopro-amber/10 text-kopro-amber flex items-center justify-center mb-3">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                Quittances
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Générer et envoyer</p>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => navigate("/bailleur/documents")}
          >
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-kopro-rose/10 text-kopro-rose flex items-center justify-center mb-3">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                Documents
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Contrats, diagnostics</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Apartments Overview */}
          <Card className="lg:col-span-2 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="font-display text-lg">Mes appartements</CardTitle>
                <CardDescription>Vue d'ensemble de votre portefeuille</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/bailleur/apartments")}>
                Voir tout
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-success/10">
                  <p className="text-2xl font-bold text-success">{stats.occupiedApartments}</p>
                  <p className="text-xs text-muted-foreground">Loués</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-warning/10">
                  <p className="text-2xl font-bold text-warning">{stats.vacantApartments}</p>
                  <p className="text-xs text-muted-foreground">Vacants</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-muted-foreground">
                    {stats.totalApartments - stats.occupiedApartments - stats.vacantApartments}
                  </p>
                  <p className="text-xs text-muted-foreground">En travaux</p>
                </div>
              </div>

              {stats.totalApartments === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground mb-4">Aucun appartement pour le moment</p>
                  <Button onClick={() => navigate("/bailleur/apartments/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter mon premier appartement
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => navigate("/bailleur/apartments")}>
                  Gérer mes appartements
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Tickets */}
            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-display text-lg">Incidents récents</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/bailleur/tickets")}>
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <p className="text-center text-muted-foreground py-4">Chargement...</p>
                ) : stats.recentTickets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Aucun incident</p>
                ) : (
                  stats.recentTickets.map((ticket) => (
                    <div 
                      key={ticket.id} 
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/bailleur/tickets/${ticket.id}`)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-kopro-rose/10 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-kopro-rose" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Upcoming Lease Ends */}
            {stats.upcomingLeaseEnds.length > 0 && (
              <Card className="shadow-soft border-warning/30 bg-warning/5">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-warning" />
                    Baux expirant bientôt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stats.upcomingLeaseEnds.map((lease) => (
                    <div key={lease.id} className="flex items-center justify-between p-2 rounded-lg bg-background">
                      <span className="text-sm font-medium">{lease.landlord_apartments?.door}</span>
                      <Badge variant="outline" className="text-warning border-warning/30">
                        {new Date(lease.end_date).toLocaleDateString('fr-FR')}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
  );
}
