import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Bug, 
  Lightbulb, 
  MessageSquare, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Filter,
  Search,
  ExternalLink,
  Monitor,
  Smartphone
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface BugReport {
  id: string;
  user_id: string;
  type: 'bug' | 'suggestion';
  description: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  current_url: string | null;
  screen_name: string | null;
  user_agent: string | null;
  device_model: string | null;
  os_version: string | null;
  app_version: string | null;
  account_type: string | null;
  screenshot_url: string | null;
  video_url: string | null;
  attachments: string[];
  admin_notes: string | null;
  created_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

const STATUS_CONFIG = {
  new: { label: "Nouveau", color: "bg-blue-500", icon: AlertCircle },
  in_progress: { label: "En cours", color: "bg-amber-500", icon: Clock },
  resolved: { label: "Résolu", color: "bg-green-500", icon: CheckCircle2 },
  closed: { label: "Fermé", color: "bg-gray-500", icon: CheckCircle2 },
};

export default function AdminBugReports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["bug-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bug_reports")
        .select(`
          *,
          profiles!bug_reports_user_id_fkey (first_name, last_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as BugReport[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status?: string; notes?: string }) => {
      const updateData: Record<string, unknown> = {};
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.admin_notes = notes;
      if (status === 'resolved') updateData.resolved_at = new Date().toISOString();

      const { error } = await supabase
        .from("bug_reports")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bug-reports"] });
      toast({ title: "Ticket mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le ticket", variant: "destructive" });
    },
  });

  const filteredReports = reports.filter((report) => {
    const matchesSearch = 
      report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${report.profiles?.first_name} ${report.profiles?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesType = typeFilter === "all" || report.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleContactUser = (userId: string) => {
    navigate(`/admin/chat?user_id=${userId}`);
  };

  const handleViewDetails = (report: BugReport) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || "");
  };

  const handleSaveNotes = () => {
    if (selectedReport) {
      updateMutation.mutate({ id: selectedReport.id, notes: adminNotes });
    }
  };

  const handleStatusChange = (reportId: string, newStatus: string) => {
    updateMutation.mutate({ id: reportId, status: newStatus });
  };

  const stats = {
    total: reports.length,
    new: reports.filter(r => r.status === 'new').length,
    inProgress: reports.filter(r => r.status === 'in_progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Tickets Support</h1>
          <p className="text-muted-foreground">Gérez les signalements de bugs et suggestions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-card border">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-500">{stats.new}</div>
            <div className="text-sm text-muted-foreground">Nouveaux</div>
          </div>
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="text-2xl font-bold text-amber-500">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground">En cours</div>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
            <div className="text-sm text-muted-foreground">Résolus</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="new">Nouveaux</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="resolved">Résolus</SelectItem>
              <SelectItem value="closed">Fermés</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="bug">Bugs</SelectItem>
              <SelectItem value="suggestion">Suggestions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Appareil</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun signalement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => {
                  const StatusIcon = STATUS_CONFIG[report.status]?.icon || AlertCircle;
                  const isMobile = report.device_model?.toLowerCase().includes('iphone') || 
                                   report.device_model?.toLowerCase().includes('android') ||
                                   report.device_model?.toLowerCase().includes('ipad');
                  
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(report.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {report.profiles?.first_name} {report.profiles?.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {report.profiles?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.type === 'bug' ? 'destructive' : 'default'}>
                          {report.type === 'bug' ? (
                            <><Bug className="h-3 w-3 mr-1" /> Bug</>
                          ) : (
                            <><Lightbulb className="h-3 w-3 mr-1" /> Suggestion</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate">{report.description}</p>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={report.status} 
                          onValueChange={(value) => handleStatusChange(report.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <Badge className={`${STATUS_CONFIG[report.status]?.color} text-white`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {STATUS_CONFIG[report.status]?.label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Nouveau</SelectItem>
                            <SelectItem value="in_progress">En cours</SelectItem>
                            <SelectItem value="resolved">Résolu</SelectItem>
                            <SelectItem value="closed">Fermé</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {isMobile ? (
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(report)}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleContactUser(report.user_id)}
                            title="Contacter l'utilisateur"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Detail Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedReport?.type === 'bug' ? (
                  <Bug className="h-5 w-5 text-red-500" />
                ) : (
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                )}
                Détails du signalement
              </DialogTitle>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-6">
                {/* User info */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {selectedReport.profiles?.first_name} {selectedReport.profiles?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedReport.profiles?.email}</p>
                  </div>
                  <Button onClick={() => handleContactUser(selectedReport.user_id)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contacter
                  </Button>
                </div>

                {/* Description */}
                <div>
                  <Label>Description</Label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">{selectedReport.description}</p>
                </div>

                {/* Screenshot */}
                {selectedReport.screenshot_url && (
                  <div>
                    <Label>Capture d'écran</Label>
                    <img 
                      src={selectedReport.screenshot_url} 
                      alt="Screenshot" 
                      className="mt-1 rounded-lg border max-h-96 object-contain"
                    />
                  </div>
                )}

                {/* Attachments */}
                {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                  <div>
                    <Label>Fichiers joints</Label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedReport.attachments.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 p-2 bg-muted rounded-lg hover:bg-muted/80"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Fichier {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technical info */}
                <div>
                  <Label>Informations techniques</Label>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-muted rounded">
                      <span className="text-muted-foreground">Page :</span>{" "}
                      {selectedReport.current_url || "N/A"}
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <span className="text-muted-foreground">Appareil :</span>{" "}
                      {selectedReport.device_model || "N/A"}
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <span className="text-muted-foreground">OS :</span>{" "}
                      {selectedReport.os_version || "N/A"}
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <span className="text-muted-foreground">Type compte :</span>{" "}
                      {selectedReport.account_type || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Admin notes */}
                <div>
                  <Label htmlFor="admin-notes">Notes internes</Label>
                  <Textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Ajouter des notes sur ce ticket..."
                    rows={3}
                    className="mt-1"
                  />
                  <Button 
                    onClick={handleSaveNotes} 
                    className="mt-2"
                    disabled={updateMutation.isPending}
                  >
                    Enregistrer les notes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
