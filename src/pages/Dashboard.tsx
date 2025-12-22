import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Newspaper,
  Ticket,
  Calendar,
  Package,
  Vote,
  CreditCard,
  FileText,
  Bell,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppLayout } from "@/components/layout/AppLayout";

interface DemoUser {
  email: string;
  role: string;
  name: string;
  badge: string;
}

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
    title: "Réserver un espace",
    description: "Salle, parking visiteur...",
    icon: Calendar,
    href: "/reservations",
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

// Sample announcements
const announcements = [
  {
    id: 1,
    title: "Travaux de ravalement - Planning actualisé",
    category: "Travaux",
    date: "Aujourd'hui",
    author: "Syndic Gestion Plus",
    isOfficial: true,
  },
  {
    id: 2,
    title: "Nouveau règlement intérieur disponible",
    category: "Documents",
    date: "Hier",
    author: "Conseil Syndical",
    isOfficial: true,
  },
  {
    id: 3,
    title: "Rappel: Assemblée Générale le 15 janvier",
    category: "AG",
    date: "Il y a 2 jours",
    author: "Syndic Gestion Plus",
    isOfficial: true,
  },
];

// Sample tickets
const myTickets = [
  {
    id: "T-2024-042",
    title: "Fuite robinet cuisine",
    status: "in_progress",
    statusLabel: "En cours",
    date: "Il y a 3 jours",
    priority: "normal",
  },
  {
    id: "T-2024-038",
    title: "Interphone ne fonctionne plus",
    status: "waiting",
    statusLabel: "En attente",
    date: "Il y a 1 semaine",
    priority: "urgent",
  },
];

// Sample reservations
const upcomingReservations = [
  {
    id: 1,
    resource: "Salle de réception",
    date: "Samedi 18 janvier",
    time: "14h00 - 20h00",
    status: "confirmed",
  },
];

// Sample pending votes
const pendingVotes = [
  {
    id: 1,
    title: "Approbation des comptes 2023",
    deadline: "10 janvier 2025",
    type: "AG Ordinaire",
  },
];

const statusColors: Record<string, string> = {
  open: "bg-kopro-amber/10 text-kopro-amber border-kopro-amber/20",
  in_progress: "bg-kopro-teal/10 text-kopro-teal border-kopro-teal/20",
  waiting: "bg-kopro-purple/10 text-kopro-purple border-kopro-purple/20",
  resolved: "bg-success/10 text-success border-success/20",
  closed: "bg-muted text-muted-foreground border-border",
};

export default function Dashboard() {
  const [user, setUser] = useState<DemoUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("kopro_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/auth");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("kopro_user");
    navigate("/auth");
  };

  if (!user) {
    return null;
  }

  const isManager = user.role === "manager" || user.role === "admin";

  return (
    <AppLayout userRole={user.role} onLogout={handleLogout}>
      <div className="space-y-6 lg:space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              Bonjour, {user.name.split(" ")[0]} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Voici un résumé de votre copropriété
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
                3
              </span>
            </Button>
            <Badge variant="secondary" className="hidden sm:flex">
              {user.badge}
            </Badge>
          </div>
        </div>

        {/* Manager KPI Summary */}
        {isManager && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Incidents ouverts", value: "12", change: "-3", icon: Ticket, color: "text-kopro-rose" },
              { label: "Taux recouvrement", value: "94%", change: "+2%", icon: TrendingUp, color: "text-success" },
              { label: "Réservations mois", value: "28", change: "+5", icon: Calendar, color: "text-kopro-teal" },
              { label: "Satisfaction", value: "4.6/5", change: "+0.2", icon: CheckCircle2, color: "text-kopro-amber" },
            ].map((stat, i) => (
              <Card key={i} className="shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    <span className="text-xs text-success font-medium">{stat.change}</span>
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
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Newspaper className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {announcement.isOfficial && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Officiel</Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{announcement.category}</Badge>
                    </div>
                    <h4 className="font-medium text-sm text-foreground truncate">{announcement.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {announcement.author} · {announcement.date}
                    </p>
                  </div>
                </div>
              ))}
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
                {myTickets.map((ticket) => (
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
                      <p className="text-xs text-muted-foreground">{ticket.id}</p>
                    </div>
                    <Badge className={statusColors[ticket.status]} variant="outline">
                      {ticket.statusLabel}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full" size="sm" onClick={() => navigate("/tickets/new")}>
                  <Ticket className="h-4 w-4 mr-2" />
                  Nouveau signalement
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Reservations */}
            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-display text-lg">Réservations</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/reservations")}>
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {upcomingReservations.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingReservations.map((res) => (
                      <div key={res.id} className="p-3 rounded-lg bg-kopro-teal/5 border border-kopro-teal/20">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm text-foreground">{res.resource}</p>
                          <Badge variant="secondary" className="text-[10px]">Confirmé</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{res.date}</p>
                        <p className="text-xs text-muted-foreground">{res.time}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune réservation à venir</p>
                )}
              </CardContent>
            </Card>

            {/* Pending Votes */}
            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-display text-lg">Votes en cours</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate("/votes")}>
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {pendingVotes.length > 0 ? (
                  <div className="space-y-3">
                    {pendingVotes.map((vote) => (
                      <div key={vote.id} className="p-3 rounded-lg bg-kopro-purple/5 border border-kopro-purple/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Vote className="h-4 w-4 text-kopro-purple" />
                          <Badge variant="secondary" className="text-[10px]">{vote.type}</Badge>
                        </div>
                        <p className="font-medium text-sm text-foreground">{vote.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">Limite: {vote.deadline}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun vote en attente</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Outstanding Payments Alert */}
        <Card className="shadow-soft border-warning/30 bg-warning/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
              <CreditCard className="h-6 w-6 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Appel de fonds du 4ème trimestre</h3>
              <p className="text-sm text-muted-foreground">Montant: 450,00 € · Échéance: 31 janvier 2025</p>
            </div>
            <Button variant="accent" size="sm" onClick={() => navigate("/payments")}>
              Payer maintenant
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}