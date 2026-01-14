import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  Plus,
  Filter,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Euro,
  Building2,
  User,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useResidence } from "@/contexts/ResidenceContext";
import { WorkOrdersList } from "@/components/maintenance/WorkOrdersList";
import { SupplierQuotes } from "@/components/maintenance/SupplierQuotes";
import { MaintenanceCalendar } from "@/components/maintenance/MaintenanceCalendar";
import { MaintenanceContracts } from "@/components/maintenance/MaintenanceContracts";
import { NewWorkOrderDialog } from "@/components/maintenance/NewWorkOrderDialog";
import { WorkOrdersFilterSheet, WorkOrderFilters } from "@/components/maintenance/WorkOrdersFilterSheet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

function WorkOrdersContent() {
  const { selectedResidence, isAllResidences, residences } = useResidence();
  const [activeTab, setActiveTab] = useState("orders");
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filters, setFilters] = useState<WorkOrderFilters>({
    status: "all",
    priority: "all",
    category: "all",
    dateFrom: "",
    dateTo: "",
  });

  // Get residence IDs to filter by
  const residenceIds = isAllResidences 
    ? residences.map(r => r.id) 
    : selectedResidence?.id ? [selectedResidence.id] : [];

  // Fetch real stats from tickets (work orders are based on tickets with category 'maintenance')
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["work-orders-stats", residenceIds, isAllResidences],
    queryFn: async () => {
      if (residenceIds.length === 0) return { pending: 0, inProgress: 0, completed: 0, monthExpenses: 0 };

      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Get tickets (work orders)
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("id, status, created_at")
        .in("residence_id", residenceIds);

      if (ticketsError) throw ticketsError;

      const pending = tickets?.filter((t) => t.status === "open" || t.status === "pending").length || 0;
      const inProgress = tickets?.filter((t) => t.status === "in_progress").length || 0;
      const completed = tickets?.filter((t) => {
        if (t.status !== "closed" && t.status !== "resolved") return false;
        const closedDate = new Date(t.created_at);
        return closedDate >= monthStart && closedDate <= monthEnd;
      }).length || 0;

      // Get maintenance logs for expenses
      const { data: maintenanceLogs, error: maintenanceError } = await supabase
        .from("maintenance_logs")
        .select("contract_amount")
        .in("residence_id", residenceIds)
        .gte("last_maintenance", monthStart.toISOString())
        .lte("last_maintenance", monthEnd.toISOString());

      const monthExpenses = maintenanceLogs?.reduce((sum, log) => sum + (log.contract_amount || 0), 0) || 0;

      return { pending, inProgress, completed, monthExpenses };
    },
    enabled: residenceIds.length > 0,
  });

  // Fetch next scheduled maintenance
  const { data: nextMaintenance } = useQuery({
    queryKey: ["next-maintenance", residenceIds, isAllResidences],
    queryFn: async () => {
      if (residenceIds.length === 0) return null;

      const { data, error } = await supabase
        .from("maintenance_logs")
        .select("equipment_name, equipment_type, next_maintenance, building:buildings(name)")
        .in("residence_id", residenceIds)
        .gte("next_maintenance", new Date().toISOString())
        .order("next_maintenance", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: residenceIds.length > 0,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
            <Wrench className="h-8 w-8 text-primary" />
            Ordres de service & Maintenance
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestion des interventions et contrats de maintenance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilterSheet(true)}>
            <Filter className="h-4 w-4 mr-2" />
            Filtrer
          </Button>
          <Button size="sm" onClick={() => setShowNewOrderDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel ordre de service
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Clock className="h-5 w-5 text-warning" />
              {(stats?.pending || 0) > 0 && (
                <Badge variant="outline" className="text-warning border-warning/30">Urgent</Badge>
              )}
            </div>
            <div className="mt-3">
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stats?.pending || 0}</p>
              )}
              <p className="text-xs text-muted-foreground">En attente</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-3">
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stats?.inProgress || 0}</p>
              )}
              <p className="text-xs text-muted-foreground">En cours</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div className="mt-3">
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stats?.completed || 0}</p>
              )}
              <p className="text-xs text-muted-foreground">Terminés ce mois</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Euro className="h-5 w-5 text-secondary" />
            </div>
            <div className="mt-3">
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold text-foreground">
                  {(stats?.monthExpenses || 0).toLocaleString()} €
                </p>
              )}
              <p className="text-xs text-muted-foreground">Dépenses du mois</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Maintenance Alert */}
      {nextMaintenance && (
        <Card className="shadow-soft border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Prochaine maintenance programmée</h3>
              <p className="text-sm text-muted-foreground">
                {nextMaintenance.equipment_name || nextMaintenance.equipment_type}
                {nextMaintenance.building && ` - ${(nextMaintenance.building as any).name}`}
                {nextMaintenance.next_maintenance && ` - ${format(new Date(nextMaintenance.next_maintenance), "d MMMM yyyy", { locale: fr })}`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("calendar")}>
              Voir le planning
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="orders">Ordres de service</TabsTrigger>
          <TabsTrigger value="quotes">Devis prestataires</TabsTrigger>
          <TabsTrigger value="calendar">Planning</TabsTrigger>
          <TabsTrigger value="contracts">Contrats</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6">
          <WorkOrdersList residenceIds={residenceIds} filters={filters} />
        </TabsContent>

        <TabsContent value="quotes" className="mt-6">
          <SupplierQuotes residenceIds={residenceIds} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <MaintenanceCalendar residenceIds={residenceIds} />
        </TabsContent>

        <TabsContent value="contracts" className="mt-6">
          <MaintenanceContracts residenceIds={residenceIds} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NewWorkOrderDialog
        open={showNewOrderDialog}
        onOpenChange={setShowNewOrderDialog}
        residenceId={selectedResidence?.id}
      />

      <WorkOrdersFilterSheet
        open={showFilterSheet}
        onOpenChange={setShowFilterSheet}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}

export default function WorkOrders() {
  const { user, profile, logout, isManager } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (!user || !profile) {
    return null;
  }

  if (!isManager()) {
    navigate("/dashboard");
    return null;
  }

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <WorkOrdersContent />
    </AppLayout>
  );
}
