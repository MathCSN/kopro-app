import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Ticket,
  CreditCard,
  FileText,
  ArrowUpRight,
  AlertCircle,
  TrendingUp,
  Plus,
  Vote,
  Calendar,
  Wrench,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export default function SyndicDashboard() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalResidences: 0,
    totalLots: 0,
    totalResidents: 0,
    openTickets: 0,
    inProgressTickets: 0,
    pendingCalls: 0,
    upcomingAG: null as any,
    pendingAttachmentRequests: 0,
    recentTickets: [] as any[],
    upcomingMaintenances: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch residences managed by this syndic
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('residence_id, agency_id')
        .eq('user_id', user!.id)
        .eq('role', 'manager');

      const residenceIds = userRoles?.map(r => r.residence_id).filter(Boolean) || [];
      const agencyId = userRoles?.[0]?.agency_id;

      // Get residences count
      let totalResidences = 0;
      if (agencyId) {
        const { count } = await supabase
          .from('residences')
          .select('id', { count: 'exact' })
          .eq('agency_id', agencyId);
        totalResidences = count || 0;
      }

      // Get total lots
      let totalLots = 0;
      if (residenceIds.length > 0) {
        const { count } = await supabase
          .from('lots')
          .select('id', { count: 'exact' })
          .in('residence_id', residenceIds);
        totalLots = count || 0;
      }

      // Get residents count
      let totalResidents = 0;
      if (residenceIds.length > 0) {
        const { count } = await supabase
          .from('user_roles')
          .select('id', { count: 'exact' })
          .in('residence_id', residenceIds)
          .eq('role', 'resident');
        totalResidents = count || 0;
      }

      // Fetch common area tickets
      let openTickets = 0;
      let inProgressTickets = 0;
      let recentTickets: any[] = [];
      
      if (residenceIds.length > 0) {
        const { data: tickets } = await supabase
          .from('tickets')
          .select('*')
          .in('residence_id', residenceIds)
          .eq('scope', 'common')
          .order('created_at', { ascending: false });

        openTickets = tickets?.filter(t => t.status === 'open').length || 0;
        inProgressTickets = tickets?.filter(t => t.status === 'in_progress').length || 0;
        recentTickets = tickets?.slice(0, 5) || [];
      }

      // Fetch pending calls
      let pendingCalls = 0;
      if (residenceIds.length > 0) {
        const { count } = await supabase
          .from('copro_calls')
          .select('id', { count: 'exact' })
          .in('residence_id', residenceIds)
          .eq('status', 'pending');
        pendingCalls = count || 0;
      }

      // Fetch upcoming AG
      let upcomingAG = null;
      if (residenceIds.length > 0) {
        const { data: ags } = await supabase
          .from('general_assemblies')
          .select('*')
          .in('residence_id', residenceIds)
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(1);
        upcomingAG = ags?.[0] || null;
      }

      // Fetch pending attachment requests
      let pendingAttachmentRequests = 0;
      if (agencyId) {
        const { count } = await supabase
          .from('apartment_attachment_requests')
          .select('id', { count: 'exact' })
          .eq('status', 'pending');
        pendingAttachmentRequests = count || 0;
      }

      // Fetch upcoming maintenances
      let upcomingMaintenances: any[] = [];
      if (residenceIds.length > 0) {
        const { data: maintenances } = await supabase
          .from('maintenance_logs')
          .select('*')
          .in('residence_id', residenceIds)
          .gte('next_maintenance', new Date().toISOString())
          .order('next_maintenance', { ascending: true })
          .limit(3);
        upcomingMaintenances = maintenances || [];
      }

      setStats({
        totalResidences,
        totalLots,
        totalResidents,
        openTickets,
        inProgressTickets,
        pendingCalls,
        upcomingAG,
        pendingAttachmentRequests,
        recentTickets,
        upcomingMaintenances,
      });
    } catch (error) {
      console.error('Error fetching syndic dashboard data:', error);
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
            Gérez vos copropriétés
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <Badge variant="secondary" className="bg-kopro-teal/10 text-kopro-teal border-kopro-teal/20">
            Syndic
          </Badge>
        </div>
      </div>

        {/* Pending Requests Alert */}
        {stats.pendingAttachmentRequests > 0 && (
          <Card className="shadow-soft border-kopro-amber/30 bg-kopro-amber/5">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-xl bg-kopro-amber/20 flex items-center justify-center shrink-0">
                <Bell className="h-6 w-6 text-kopro-amber" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {stats.pendingAttachmentRequests} demande{stats.pendingAttachmentRequests > 1 ? 's' : ''} de rattachement
                </h3>
                <p className="text-sm text-muted-foreground">
                  Des bailleurs souhaitent rattacher des appartements à vos résidences
                </p>
              </div>
              <Button variant="default" size="sm" onClick={() => navigate("/syndic/apartments-requests")}>
                Voir les demandes
              </Button>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft cursor-pointer hover:shadow-medium transition-all" onClick={() => navigate("/syndic/residences")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Building2 className="h-5 w-5 text-kopro-purple" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">{stats.totalResidences}</p>
                <p className="text-xs text-muted-foreground">Résidence{stats.totalResidences > 1 ? 's' : ''}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft cursor-pointer hover:shadow-medium transition-all" onClick={() => navigate("/syndic/residents")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-kopro-teal" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">{stats.totalLots}</p>
                <p className="text-xs text-muted-foreground">Lot{stats.totalLots > 1 ? 's' : ''}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft cursor-pointer hover:shadow-medium transition-all" onClick={() => navigate("/syndic/tickets")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Ticket className="h-5 w-5 text-kopro-rose" />
                {stats.openTickets > 0 && (
                  <Badge variant="destructive" className="text-xs">{stats.openTickets}</Badge>
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">{stats.openTickets + stats.inProgressTickets}</p>
                <p className="text-xs text-muted-foreground">Incidents en cours</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft cursor-pointer hover:shadow-medium transition-all" onClick={() => navigate("/syndic/calls")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <CreditCard className="h-5 w-5 text-kopro-amber" />
                {stats.pendingCalls > 0 && (
                  <Badge variant="outline" className="text-xs text-kopro-amber border-kopro-amber/30">{stats.pendingCalls}</Badge>
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">{stats.pendingCalls}</p>
                <p className="text-xs text-muted-foreground">Appels en attente</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="group cursor-pointer shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => navigate("/syndic/residences/new")}
          >
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-kopro-purple/10 text-kopro-purple flex items-center justify-center mb-3">
                <Plus className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                Nouvelle résidence
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Créer une copropriété</p>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => navigate("/syndic/ag/new")}
          >
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-kopro-teal/10 text-kopro-teal flex items-center justify-center mb-3">
                <Vote className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                Convoquer une AG
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Assemblée générale</p>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => navigate("/syndic/calls")}
          >
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-kopro-amber/10 text-kopro-amber flex items-center justify-center mb-3">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                Appels de fonds
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Gestion des charges</p>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-0.5"
            onClick={() => navigate("/syndic/work-orders")}
          >
            <CardContent className="p-4">
              <div className="w-10 h-10 rounded-xl bg-kopro-rose/10 text-kopro-rose flex items-center justify-center mb-3">
                <Wrench className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                Ordres de service
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Maintenance</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Tickets */}
          <Card className="lg:col-span-2 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="font-display text-lg">Incidents parties communes</CardTitle>
                <CardDescription>Derniers signalements</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/syndic/tickets")}>
                Voir tout
                <ArrowUpRight className="h-4 w-4 ml-1" />
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
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/syndic/tickets/${ticket.id}`)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-kopro-rose/10 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-kopro-rose" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Badge variant="outline" className={
                      ticket.status === 'open' ? 'text-kopro-amber border-kopro-amber/30' :
                      ticket.status === 'in_progress' ? 'text-kopro-teal border-kopro-teal/30' :
                      'text-muted-foreground'
                    }>
                      {ticket.status === 'open' ? 'Ouvert' : 
                       ticket.status === 'in_progress' ? 'En cours' : 
                       ticket.status === 'resolved' ? 'Résolu' : 'Fermé'}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming AG */}
            {stats.upcomingAG && (
              <Card className="shadow-soft border-kopro-purple/30 bg-kopro-purple/5">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Vote className="h-5 w-5 text-kopro-purple" />
                    Prochaine AG
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h4 className="font-medium text-foreground">{stats.upcomingAG.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(stats.upcomingAG.scheduled_at).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <Button variant="outline" className="w-full mt-3" size="sm" onClick={() => navigate(`/syndic/ag/${stats.upcomingAG.id}`)}>
                    Voir les détails
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Maintenances */}
            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-display text-lg">Maintenance prévue</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/syndic/work-orders")}>
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.upcomingMaintenances.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Aucune maintenance prévue</p>
                ) : (
                  stats.upcomingMaintenances.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-kopro-teal/10 flex items-center justify-center">
                        <Wrench className="h-4 w-4 text-kopro-teal" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{m.equipment_name || m.equipment_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.next_maintenance).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
}
