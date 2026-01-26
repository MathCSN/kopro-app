import { useNavigate } from "react-router-dom";
import {
  Ticket,
  Plus,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Timer,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TicketItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string | null;
  priority: string | null;
  created_at: string;
  updated_at: string;
  assignee_id: string | null;
  created_by: string | null;
  location: string | null;
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  open: { label: "Ouvert", icon: AlertCircle, color: "bg-kopro-amber/10 text-kopro-amber border-kopro-amber/20" },
  in_progress: { label: "En cours", icon: Timer, color: "bg-kopro-teal/10 text-kopro-teal border-kopro-teal/20" },
  waiting: { label: "En attente", icon: Clock, color: "bg-kopro-purple/10 text-kopro-purple border-kopro-purple/20" },
  resolved: { label: "Résolu", icon: CheckCircle2, color: "bg-success/10 text-success border-success/20" },
  closed: { label: "Fermé", icon: XCircle, color: "bg-muted text-muted-foreground border-border" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Faible", color: "text-muted-foreground" },
  medium: { label: "Normal", color: "text-foreground" },
  urgent: { label: "Urgent", color: "text-destructive" },
};

function TicketsContent() {
  const { user, profile, isManager } = useAuth();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = (status: string) => {
    let filtered = tickets;
    if (status !== "all") {
      filtered = tickets.filter(t => t.status === status);
    }
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const getStatusCounts = () => {
    return {
      open: tickets.filter(t => t.status === 'open').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      waiting: tickets.filter(t => t.status === 'waiting').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length,
    };
  };

  if (!user || !profile) return null;

  const counts = getStatusCounts();

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Incidents</h1>
          <p className="text-muted-foreground mt-1">Signalements et suivi des interventions</p>
        </div>
        <Button onClick={() => navigate("/tickets/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau signalement
        </Button>
      </div>

      {/* Stats Cards (Manager view) */}
      {isManager() && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Ouverts", count: counts.open, status: "open" },
            { label: "En cours", count: counts.in_progress, status: "in_progress" },
            { label: "En attente", count: counts.waiting, status: "waiting" },
            { label: "Résolus", count: counts.resolved, status: "resolved" },
            { label: "Fermés", count: counts.closed, status: "closed" },
          ].map((stat) => {
            const config = statusConfig[stat.status];
            return (
              <Card key={stat.status} className="shadow-soft cursor-pointer hover:shadow-medium transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <config.icon className={`h-4 w-4 ${config.color.split(" ")[1]}`} />
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par titre ou n° ticket..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="plomberie">Plomberie</SelectItem>
            <SelectItem value="electricite">Électricité</SelectItem>
            <SelectItem value="parties_communes">Parties communes</SelectItem>
            <SelectItem value="structure">Structure</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="open">Ouverts</TabsTrigger>
          <TabsTrigger value="in_progress">En cours</TabsTrigger>
          <TabsTrigger value="waiting">En attente</TabsTrigger>
          <TabsTrigger value="resolved">Résolus</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filterTickets(activeTab).map((ticket) => {
                const status = statusConfig[ticket.status || 'open'] || statusConfig.open;
                const priority = priorityConfig[ticket.priority || 'medium'] || priorityConfig.medium;
                return (
                  <Card 
                    key={ticket.id} 
                    className="shadow-soft hover:shadow-medium transition-all cursor-pointer group"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Status Icon */}
                        <div className={`w-10 h-10 rounded-xl ${status.color.split(" ")[0]} flex items-center justify-center shrink-0`}>
                          <status.icon className={`h-5 w-5 ${status.color.split(" ")[1]}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-muted-foreground">{ticket.id.slice(0, 8)}</span>
                                {ticket.priority === "urgent" && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Urgent</Badge>
                                )}
                              </div>
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {ticket.title}
                              </h3>
                              {ticket.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                  {ticket.description}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                          </div>

                          {/* Meta */}
                          <div className="flex items-center gap-4 mt-3 flex-wrap">
                            <Badge variant="outline" className={status.color}>
                              {status.label}
                            </Badge>
                            {ticket.category && (
                              <Badge variant="secondary" className="text-xs">{ticket.category}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              Mis à jour {formatDate(ticket.updated_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filterTickets(activeTab).length === 0 && (
                <Card className="shadow-soft">
                  <CardContent className="p-8 text-center">
                    <Ticket className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun incident trouvé</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function Tickets() {
  return (
    <ConditionalLayout>
      <TicketsContent />
    </ConditionalLayout>
  );
}
