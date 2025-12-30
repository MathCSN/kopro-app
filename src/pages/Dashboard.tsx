import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Newspaper,
  Ticket,
  Vote,
  CreditCard,
  FileText,
  ArrowUpRight,
  AlertCircle,
  Clock,
  TrendingUp,
  Building2,
  Users,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/notifications/NotificationBell";

// Quick action cards data
const quickActions = [
  {
    title: "Signaler un incident",
    description: "Fuite, bruit, dégradation...",
    icon: Ticket,
    href: "/tickets/new",
    color: "bg-kopro-rose/10 text-kopro-rose",
  },
  {
    title: "Messagerie",
    description: "Contacter la gestion",
    icon: MessageCircle,
    href: "/chat",
    color: "bg-kopro-teal/10 text-kopro-teal",
  },
  {
    title: "Consulter mes charges",
    description: "Appels de fonds en cours",
    icon: CreditCard,
    href: "/payments",
    color: "bg-kopro-purple/10 text-kopro-purple",
  },
  {
    title: "Documents officiels",
    description: "PV, règlement, contrats",
    icon: FileText,
    href: "/documents",
    color: "bg-kopro-amber/10 text-kopro-amber",
  },
];

const statusColors: Record<string, string> = {
  open: "bg-kopro-amber/10 text-kopro-amber border-kopro-amber/20",
  in_progress: "bg-kopro-teal/10 text-kopro-teal border-kopro-teal/20",
  waiting: "bg-kopro-purple/10 text-kopro-purple border-kopro-purple/20",
  resolved: "bg-success/10 text-success border-success/20",
  closed: "bg-muted text-muted-foreground border-border",
};

// Role badge mapping
const roleBadges: Record<string, string> = {
  resident: "Résident",
  cs: "Conseil Syndical",
  manager: "Gestionnaire",
  admin: "Admin",
  owner: "Fondateur / Owner",
};

export default function Dashboard() {
  const { user, profile, logout, isManager, canAccessRental } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    openTickets: 0,
    inProgressTickets: 0,
    myTickets: [] as any[],
    pendingPayments: 0,
    openVacancies: 0,
    pendingApplications: 0,
    announcements: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch tickets
      const { data: tickets } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      const myTickets = (tickets || []).filter(t => t.created_by === user?.id).slice(0, 2);
      const openTickets = (tickets || []).filter(t => t.status === 'open').length;
      const inProgressTickets = (tickets || []).filter(t => t.status === 'in_progress').length;


      // Fetch pending payments
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('user_id', user!.id)
        .eq('status', 'pending');

      const pendingPayments = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);

      // Fetch vacancies & applications (for managers)
      let openVacancies = 0;
      let pendingApplications = 0;
      if (canAccessRental()) {
        const { data: vacancies } = await supabase
          .from('vacancies')
          .select('id')
          .eq('status', 'open');
        openVacancies = (vacancies || []).length;

        const { data: applications } = await supabase
          .from('applications')
          .select('id')
          .eq('status', 'new');
        pendingApplications = (applications || []).length;
      }

      // Fetch announcements
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      setStats({
        openTickets,
        inProgressTickets,
        myTickets,
        pendingPayments,
        openVacancies,
        pendingApplications,
        announcements: posts || [],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (!user || !profile) {
    return null;
  }

  const displayName = profile.first_name || profile.email?.split("@")[0] || "Utilisateur";
  const badge = roleBadges[profile.role] || "Utilisateur";

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <div className="space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              Bonjour, {displayName} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Voici un résumé de votre copropriété
            </p>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <Badge variant="secondary" className="hidden sm:flex">
              {badge}
            </Badge>
          </div>
        </div>

        {/* Manager KPI Summary */}
        {isManager() && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
              { label: "Incidents ouverts", value: String(stats.openTickets), change: "", icon: Ticket, color: "text-kopro-rose" },
              { label: "En cours", value: String(stats.inProgressTickets), change: "", icon: TrendingUp, color: "text-kopro-teal" },
              { label: "Candidatures", value: String(stats.pendingApplications), change: "", icon: Users, color: "text-kopro-purple" },
              { label: "Paiements en attente", value: `${stats.pendingPayments}€`, change: "", icon: CreditCard, color: "text-kopro-amber" },
            ].map((stat, i) => (
              <Card key={i} className="shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Rental Module Quick Access - Manager/Owner only */}
        {canAccessRental() && (
          <Card className="shadow-soft border-kopro-teal/30 bg-kopro-teal/5">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-xl bg-kopro-teal/20 flex items-center justify-center shrink-0">
                <Building2 className="h-6 w-6 text-kopro-teal" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Module Location</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.openVacancies} vacance(s) ouverte(s) · {stats.pendingApplications} candidature(s) en attente
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/rental")}>
                <Users className="h-4 w-4 mr-2" />
                Gérer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Getting Started - Manager only */}
        {isManager() && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="font-display text-lg">Démarrer avec Kopro</CardTitle>
              <CardDescription>Configurez votre espace de gestion en quelques étapes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                onClick={() => navigate("/tenants")}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Gérer vos locataires</p>
                  <p className="text-sm text-muted-foreground">Ajoutez et suivez vos locataires</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div 
                className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                onClick={() => navigate("/rental")}
              >
                <div className="w-10 h-10 rounded-lg bg-kopro-teal/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-kopro-teal" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Module location</p>
                  <p className="text-sm text-muted-foreground">Gérez vos biens et candidatures</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div 
                className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                onClick={() => navigate("/tickets")}
              >
                <div className="w-10 h-10 rounded-lg bg-kopro-rose/10 flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-kopro-rose" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Suivre les incidents</p>
                  <p className="text-sm text-muted-foreground">Consultez et traitez les signalements</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="group cursor-pointer shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-0.5"
              onClick={() => navigate(action.href)}
            >
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center mb-3`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Announcements */}
          <Card className="lg:col-span-2 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="font-display text-lg">Dernières annonces</CardTitle>
                <CardDescription>Communications officielles de la résidence</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/newsfeed")}>
                Voir tout
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-center text-muted-foreground py-4">Chargement...</p>
              ) : stats.announcements.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Aucune annonce récente</p>
              ) : (
                stats.announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Newspaper className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {announcement.type === 'announcement' && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Officiel</Badge>
                        )}
                      </div>
                      <h4 className="font-medium text-sm text-foreground truncate">
                        {announcement.title || announcement.content?.slice(0, 50)}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(announcement.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* My Tickets */}
            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-display text-lg">Mes incidents</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/tickets")}>
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <p className="text-center text-muted-foreground py-4">Chargement...</p>
                ) : stats.myTickets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Aucun incident</p>
                ) : (
                  stats.myTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        {ticket.priority === "urgent" ? (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground">{ticket.id.slice(0, 8)}</p>
                      </div>
                      <Badge className={statusColors[ticket.status || 'open']} variant="outline">
                        {ticket.status === 'open' ? 'Ouvert' : 
                         ticket.status === 'in_progress' ? 'En cours' : 
                         ticket.status === 'waiting' ? 'En attente' : 
                         ticket.status === 'resolved' ? 'Résolu' : 'Fermé'}
                      </Badge>
                    </div>
                  ))
                )}
                <Button variant="outline" className="w-full" size="sm" onClick={() => navigate("/tickets/new")}>
                  <Ticket className="h-4 w-4 mr-2" />
                  Nouveau signalement
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Outstanding Payments Alert */}
        {stats.pendingPayments > 0 && (
          <Card className="shadow-soft border-warning/30 bg-warning/5">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
                <CreditCard className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Paiements en attente</h3>
                <p className="text-sm text-muted-foreground">Montant: {stats.pendingPayments} €</p>
              </div>
              <Button variant="accent" size="sm" onClick={() => navigate("/payments")}>
                Payer maintenant
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
