import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  ArrowLeft,
  LogIn,
  Wrench,
  Filter,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AppLayout } from "@/components/layout/AppLayout";
import { SyndicPaywall } from "@/components/syndic/SyndicPaywall";
import { useSyndicSubscription } from "@/hooks/useSyndicSubscription";

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  residence_id: string;
  residence?: { name: string; address: string };
  created_by_profile?: { first_name: string; last_name: string };
}

interface SyndicResidence {
  residence_id: string;
  residence: { id: string; name: string; address: string };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Nouveau", color: "bg-blue-500", icon: <AlertCircle className="h-4 w-4" /> },
  in_progress: { label: "En cours", color: "bg-yellow-500", icon: <Clock className="h-4 w-4" /> },
  resolved: { label: "Résolu", color: "bg-green-500", icon: <CheckCircle2 className="h-4 w-4" /> },
  closed: { label: "Fermé", color: "bg-gray-500", icon: <CheckCircle2 className="h-4 w-4" /> },
};

function SyndicPortalContent() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  
  const [selectedResidence, setSelectedResidence] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("open");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [showPaywall, setShowPaywall] = useState(true);

  // Show toast messages for payment results
  useEffect(() => {
    if (success === "true") {
      toast.success("Paiement réussi ! Accès complet activé.");
      // Remove query params
      navigate("/syndic-portal", { replace: true });
    } else if (canceled === "true") {
      toast.info("Paiement annulé");
      navigate("/syndic-portal", { replace: true });
    }
  }, [success, canceled, navigate]);

  // Validate magic link token
  const { data: tokenData, isLoading: tokenLoading } = useQuery({
    queryKey: ["syndic-token", token],
    queryFn: async () => {
      if (!token) return null;
      const { data, error } = await supabase
        .from("syndic_invitations")
        .select("*, residence:residences(id, name, address)")
        .eq("token", token)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!token && !user,
  });

  // Get syndic's assigned residences (for logged-in users)
  const { data: syndicResidences } = useQuery({
    queryKey: ["syndic-residences", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("syndic_assignments")
        .select("residence_id, residence:residences(id, name, address)")
        .eq("syndic_user_id", user.id)
        .eq("status", "active");
      
      if (error) throw error;
      return data as SyndicResidence[];
    },
    enabled: !!user,
  });

  // Combine residences from both sources
  const availableResidences = user 
    ? syndicResidences?.map(sr => sr.residence) || []
    : tokenData?.residence ? [tokenData.residence] : [];

  // Get first residence for subscription check
  const firstResidenceId = selectedResidence !== "all" 
    ? selectedResidence 
    : availableResidences[0]?.id;
  
  const firstResidenceName = availableResidences.find(r => r.id === firstResidenceId)?.name || "";

  // Check subscription status
  const { isActive: hasActiveSubscription, isTrial, trialDaysRemaining, isLoading: subscriptionLoading } = 
    useSyndicSubscription(user?.id, firstResidenceId);

  // Get tickets for common areas
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["syndic-tickets", availableResidences.map(r => r.id), activeTab],
    queryFn: async () => {
      if (availableResidences.length === 0) return [];
      
      const residenceIds = selectedResidence === "all" 
        ? availableResidences.map(r => r.id)
        : [selectedResidence];

      let query = supabase
        .from("tickets")
        .select(`
          *,
          residence:residences(name, address),
          created_by_profile:profiles!tickets_created_by_fkey(first_name, last_name)
        `)
        .eq("ticket_type", "common")
        .in("residence_id", residenceIds)
        .order("created_at", { ascending: false });

      if (activeTab !== "all") {
        query = query.eq("status", activeTab);
      }

      const { data, error } = await query;
      if (error) throw error;
      // Transform the data to match Ticket interface
      return (data || []).map((item: any) => ({
        ...item,
        created_by_profile: Array.isArray(item.created_by_profile) 
          ? item.created_by_profile[0] 
          : item.created_by_profile,
      })) as Ticket[];
    },
    enabled: availableResidences.length > 0,
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status, comment }: { ticketId: string; status: string; comment: string }) => {
      const { error } = await supabase
        .from("tickets")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", ticketId);

      if (error) throw error;

      // Add comment if provided
      if (comment) {
        await supabase.from("ticket_comments").insert({
          ticket_id: ticketId,
          user_id: user?.id,
          content: `Statut mis à jour: ${statusConfig[status]?.label || status}\n\n${comment}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["syndic-tickets"] });
      toast.success("Statut mis à jour");
      setUpdateDialogOpen(false);
      setSelectedTicket(null);
      setStatusComment("");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });

  const handleUpdateStatus = () => {
    if (!selectedTicket || !newStatus) return;
    updateStatusMutation.mutate({
      ticketId: selectedTicket.id,
      status: newStatus,
      comment: statusComment,
    });
  };

  const openUpdateDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    setUpdateDialogOpen(true);
  };

  // Show login prompt for magic link users
  if (!user && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Building2 className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle>Portail Syndic</CardTitle>
            <CardDescription>
              Connectez-vous pour accéder à votre tableau de bord
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => navigate("/auth")}>
              <LogIn className="h-4 w-4 mr-2" />
              Se connecter
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show magic link access
  if (!user && tokenData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="font-semibold">Portail Syndic</h1>
                <p className="text-sm text-muted-foreground">{tokenData.residence?.name}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
              <LogIn className="h-4 w-4 mr-2" />
              Créer un compte
            </Button>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6">
          <TicketsList 
            tickets={tickets || []} 
            loading={ticketsLoading}
            onUpdateStatus={openUpdateDialog}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>
    );
  }

  // Full dashboard for logged-in syndics
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Show paywall if no active subscription
  if (user && !subscriptionLoading && !hasActiveSubscription && showPaywall && firstResidenceId) {
    return (
      <AppLayout userRole="syndic" onLogout={handleLogout}>
        <SyndicPaywall
          residenceId={firstResidenceId}
          residenceName={firstResidenceName}
          userId={user.id}
          onContinueFree={() => setShowPaywall(false)}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole="syndic" onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Trial banner */}
        {isTrial && trialDaysRemaining > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <span className="text-sm">
                <span className="font-medium">Période d'essai</span> - {trialDaysRemaining} jour{trialDaysRemaining > 1 ? 's' : ''} restant{trialDaysRemaining > 1 ? 's' : ''}
              </span>
            </div>
            <Button size="sm" variant="outline" className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10">
              S'abonner
            </Button>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Portail Syndic
            </h1>
            <p className="text-muted-foreground">
              Gérez les incidents des parties communes
            </p>
          </div>
          
          {availableResidences.length > 1 && (
            <Select value={selectedResidence} onValueChange={setSelectedResidence}>
              <SelectTrigger className="w-[250px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par résidence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les résidences</SelectItem>
                {availableResidences.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {tickets?.filter(t => t.status === "open").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Nouveaux</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {tickets?.filter(t => t.status === "in_progress").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">En cours</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {tickets?.filter(t => t.status === "resolved").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Résolus</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{availableResidences.length}</p>
                  <p className="text-sm text-muted-foreground">Résidences</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <TicketsList 
          tickets={tickets || []} 
          loading={ticketsLoading}
          onUpdateStatus={openUpdateDialog}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Update Status Dialog */}
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mettre à jour le statut</DialogTitle>
              <DialogDescription>
                {selectedTicket?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Nouveau statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Nouveau</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Ajouter un commentaire (optionnel)..."
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateStatus} disabled={updateStatusMutation.isPending}>
                {updateStatusMutation.isPending ? "Mise à jour..." : "Confirmer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

interface TicketsListProps {
  tickets: Ticket[];
  loading: boolean;
  onUpdateStatus: (ticket: Ticket) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

function TicketsList({ tickets, loading, onUpdateStatus, activeTab, onTabChange }: TicketsListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList>
        <TabsTrigger value="open">Nouveaux</TabsTrigger>
        <TabsTrigger value="in_progress">En cours</TabsTrigger>
        <TabsTrigger value="resolved">Résolus</TabsTrigger>
        <TabsTrigger value="all">Tous</TabsTrigger>
      </TabsList>

      <TabsContent value={activeTab} className="mt-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun incident à afficher</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={statusConfig[ticket.status]?.color}>
                          {statusConfig[ticket.status]?.icon}
                          <span className="ml-1">{statusConfig[ticket.status]?.label}</span>
                        </Badge>
                        {ticket.residence && (
                          <Badge variant="outline">{ticket.residence.name}</Badge>
                        )}
                      </div>
                      <h3 className="font-medium truncate">{ticket.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          {format(new Date(ticket.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                        </span>
                        {ticket.created_by_profile && (
                          <span>
                            Par {ticket.created_by_profile.first_name} {ticket.created_by_profile.last_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onUpdateStatus(ticket)}>
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Répondre
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

export default function SyndicPortal() {
  return <SyndicPortalContent />;
}
