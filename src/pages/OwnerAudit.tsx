import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Search, Download, Filter, Loader2, User, Building2, FileText, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AuditLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  residence_id: string | null;
  created_at: string | null;
  metadata: any;
  user_email?: string;
  residence_name?: string;
};

export default function OwnerAudit() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch user emails for the logs
      const userIds = [...new Set((data || []).filter(l => l.user_id).map(l => l.user_id))];
      let usersMap: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds as string[]);
        
        if (profiles) {
          usersMap = Object.fromEntries(profiles.map(p => [p.id, p.email || 'Inconnu']));
        }
      }

      // Fetch residence names
      const residenceIds = [...new Set((data || []).filter(l => l.residence_id).map(l => l.residence_id))];
      let residencesMap: Record<string, string> = {};
      
      if (residenceIds.length > 0) {
        const { data: residences } = await supabase
          .from('residences')
          .select('id, name')
          .in('id', residenceIds as string[]);
        
        if (residences) {
          residencesMap = Object.fromEntries(residences.map(r => [r.id, r.name]));
        }
      }

      const logsWithDetails: AuditLog[] = (data || []).map(log => ({
        ...log,
        user_email: log.user_id ? usersMap[log.user_id] : undefined,
        residence_name: log.residence_id ? residencesMap[log.residence_id] : undefined,
      }));

      setLogs(logsWithDetails);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les logs d'audit.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (!user) return null;

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.user_email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "outline" | "destructive" => {
    if (action.includes('create') || action.includes('insert')) return 'default';
    if (action.includes('update') || action.includes('edit')) return 'secondary';
    if (action.includes('delete') || action.includes('remove')) return 'destructive';
    return 'outline';
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'user':
      case 'profile':
        return <User className="h-4 w-4" />;
      case 'residence':
        return <Building2 className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Journal d'audit</h1>
            <p className="text-muted-foreground mt-1">Suivez toutes les actions sur la plateforme</p>
          </div>
          <Button variant="outline" onClick={() => {
            toast({
              title: "Export",
              description: "Fonctionnalité d'export à venir.",
            });
          }}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{logs.length}</p>
              <p className="text-sm text-muted-foreground">Événements total</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">
                {logs.filter(l => {
                  const date = new Date(l.created_at || '');
                  const today = new Date();
                  return date.toDateString() === today.toDateString();
                }).length}
              </p>
              <p className="text-sm text-muted-foreground">Aujourd'hui</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">
                {[...new Set(logs.map(l => l.user_id).filter(Boolean))].length}
              </p>
              <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">
                {[...new Set(logs.map(l => l.entity_type))].length}
              </p>
              <p className="text-sm text-muted-foreground">Types d'entités</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher dans les logs..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Logs list or empty state */}
        {filteredLogs.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                {logs.length === 0 ? "Aucun événement" : "Aucun résultat"}
              </h3>
              <p className="text-muted-foreground">
                {logs.length === 0 
                  ? "Les événements d'audit apparaîtront ici au fur et à mesure de l'activité sur la plateforme."
                  : "Aucun événement ne correspond à votre recherche."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-soft">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entité</TableHead>
                  <TableHead>Résidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {log.created_at 
                        ? new Date(log.created_at).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {log.user_email || <span className="text-muted-foreground">Système</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEntityIcon(log.entity_type)}
                        <span>{log.entity_type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.residence_name || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}