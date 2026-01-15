import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Timer,
  Search,
  ChevronRight,
  Ticket,
  Building2,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AgencyResidenceFilter } from "@/components/admin/AgencyResidenceFilter";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface TicketWithResidence {
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
  residence_id: string | null;
  residence?: {
    name: string;
    agency_id: string | null;
  } | null;
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

export default function AdminTickets() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgency, setSelectedAgency] = useState<string>("all");
  const [selectedResidence, setSelectedResidence] = useState<string>("all");

  // Fetch all tickets with residence info
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          residence:residences(name, agency_id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as TicketWithResidence[];
    },
  });

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const filterTickets = (status: string) => {
    let filtered = tickets;
    
    // Filter by agency
    if (selectedAgency !== "all") {
      filtered = filtered.filter((t) => t.residence?.agency_id === selectedAgency);
    }
    
    // Filter by status
    if (status !== "all") {
      filtered = filtered.filter((t) => t.status === status);
    }
    
    // Filter by residence
    if (selectedResidence !== "all") {
      filtered = filtered.filter((t) => t.residence_id === selectedResidence);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.residence?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getStatusCounts = () => {
    let filtered = tickets;
    
    if (selectedAgency !== "all") {
      filtered = filtered.filter(t => t.residence?.agency_id === selectedAgency);
    }
    
    if (selectedResidence !== "all") {
      filtered = filtered.filter(t => t.residence_id === selectedResidence);
    }
    
    return {
      all: filtered.length,
      open: filtered.filter((t) => t.status === "open").length,
      in_progress: filtered.filter((t) => t.status === "in_progress").length,
      waiting: filtered.filter((t) => t.status === "waiting").length,
      resolved: filtered.filter((t) => t.status === "resolved").length,
      closed: filtered.filter((t) => t.status === "closed").length,
    };
  };

  const counts = getStatusCounts();

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              Tous les Tickets
            </h1>
            <p className="text-muted-foreground mt-1">
              Vue globale des incidents de toutes les résidences
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            <Ticket className="h-3 w-3 mr-1" />
            {tickets.length} tickets au total
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: "Total", count: counts.all, status: "all", icon: Ticket, color: "text-primary" },
            { label: "Ouverts", count: counts.open, status: "open" },
            { label: "En cours", count: counts.in_progress, status: "in_progress" },
            { label: "En attente", count: counts.waiting, status: "waiting" },
            { label: "Résolus", count: counts.resolved, status: "resolved" },
            { label: "Fermés", count: counts.closed, status: "closed" },
          ].map((stat) => {
            const config = stat.status === "all" 
              ? { icon: Ticket, color: "text-primary" }
              : statusConfig[stat.status];
            const Icon = config?.icon || Ticket;
            return (
              <Card
                key={stat.status}
                className={`shadow-soft cursor-pointer hover:shadow-medium transition-shadow ${
                  activeTab === stat.status ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setActiveTab(stat.status)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-4 w-4 ${stat.color || config?.color?.split(" ")[1] || "text-muted-foreground"}`} />
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4">
          <AgencyResidenceFilter
            selectedAgency={selectedAgency}
            selectedResidence={selectedResidence}
            onAgencyChange={setSelectedAgency}
            onResidenceChange={setSelectedResidence}
          />
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par titre, n° ticket ou résidence..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tickets Table */}
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {activeTab === "all" ? "Tous les tickets" : statusConfig[activeTab]?.label || "Tickets"}
              <Badge variant="secondary" className="ml-2">
                {filterTickets(activeTab).length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : filterTickets(activeTab).length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun ticket trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Titre</TableHead>
                      <TableHead>Résidence</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Priorité</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Créé le</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterTickets(activeTab).map((ticket) => {
                      const status = statusConfig[ticket.status || "open"] || statusConfig.open;
                      const priority = priorityConfig[ticket.priority || "medium"] || priorityConfig.medium;
                      return (
                        <TableRow
                          key={ticket.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                        >
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {ticket.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{ticket.title}</span>
                              {ticket.priority === "urgent" && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  Urgent
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{ticket.residence?.name || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={status.color}>
                              <status.icon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={priority.color}>{priority.label}</span>
                          </TableCell>
                          <TableCell>
                            {ticket.category && (
                              <Badge variant="secondary" className="text-xs">
                                {ticket.category}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(ticket.created_at)}
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
