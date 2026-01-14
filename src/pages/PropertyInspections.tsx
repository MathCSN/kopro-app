import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  Plus,
  Download,
  Calendar,
  Camera,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Home,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useResidence } from "@/contexts/ResidenceContext";
import { InspectionsList } from "@/components/inspections/InspectionsList";
import { InspectionTemplates } from "@/components/inspections/InspectionTemplates";
import { NewInspectionDialog } from "@/components/inspections/NewInspectionDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { exportToCsv } from "@/lib/exportData";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function PropertyInspections() {
  const { user, profile, logout, isManager } = useAuth();
  const { selectedResidence, isAllResidences, residences } = useResidence();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("list");
  const [showNewInspectionDialog, setShowNewInspectionDialog] = useState(false);

  // Get residence IDs to filter by
  const residenceIds = isAllResidences 
    ? residences.map(r => r.id) 
    : selectedResidence?.id ? [selectedResidence.id] : [];

  // Fetch lots for the residence to determine if there are apartments
  const { data: lots, isLoading: lotsLoading } = useQuery({
    queryKey: ["lots-count", residenceIds, isAllResidences],
    queryFn: async () => {
      if (residenceIds.length === 0) return [];

      const { data, error } = await supabase
        .from("lots")
        .select("id, lot_number, residence_id, building:buildings(name)")
        .in("residence_id", residenceIds);

      if (error) throw error;
      return data || [];
    },
    enabled: residenceIds.length > 0,
  });

  // Fetch leases with end dates coming soon (for upcoming inspections)
  const { data: upcomingInspection } = useQuery({
    queryKey: ["upcoming-inspection", residenceIds, isAllResidences],
    queryFn: async () => {
      if (residenceIds.length === 0) return null;

      // Get leases with start_date in the future (entry inspections) or end_date coming soon (exit)
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const { data, error } = await supabase
        .from("leases")
        .select(`
          id,
          start_date,
          end_date,
          tenant:profiles!leases_tenant_id_fkey(first_name, last_name),
          lot:lots!leases_lot_id_fkey(lot_number, building:buildings(name))
        `)
        .in("residence_id", residenceIds)
        .or(`start_date.gte.${now.toISOString()},end_date.gte.${now.toISOString()},end_date.lte.${nextMonth.toISOString()}`)
        .order("start_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: residenceIds.length > 0 && (lots?.length || 0) > 0,
  });

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const handleExport = async () => {
    if (residenceIds.length === 0) return;

    // Export leases data as inspection records
    const { data } = await supabase
      .from("leases")
      .select(`
        start_date,
        end_date,
        status,
        tenant:profiles!leases_tenant_id_fkey(first_name, last_name),
        lot:lots!leases_lot_id_fkey(lot_number)
      `)
      .in("residence_id", residenceIds)
      .order("start_date", { ascending: false });

    if (data) {
      const exportData = data.map((lease: any) => ({
        lot: lease.lot?.lot_number || "",
        locataire: `${lease.tenant?.first_name || ""} ${lease.tenant?.last_name || ""}`.trim(),
        date_entree: lease.start_date,
        date_sortie: lease.end_date || "",
        statut: lease.status,
      }));
      const filename = isAllResidences ? "etats_des_lieux_toutes_residences" : `etats_des_lieux_${selectedResidence?.name}`;
      exportToCsv(exportData, filename);
    }
  };

  if (!user || !profile) {
    return null;
  }

  if (!isManager()) {
    navigate("/dashboard");
    return null;
  }

  const hasLots = (lots?.length || 0) > 0;

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
              <ClipboardCheck className="h-8 w-8 text-primary" />
              États des lieux
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestion des états des lieux d'entrée et de sortie
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button size="sm" onClick={() => setShowNewInspectionDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel état des lieux
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Calendar className="h-5 w-5 text-warning" />
              </div>
              <div className="mt-3">
                {lotsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">0</p>
                )}
                <p className="text-xs text-muted-foreground">Programmés ce mois</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground">En attente signature</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground">Complétés cette année</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground">Litiges en cours</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Inspection Alert - Only show if there are lots and an upcoming inspection */}
        {hasLots && upcomingInspection && (
          <Card className="shadow-soft border-primary/30 bg-primary/5">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Prochain état des lieux</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(upcomingInspection.start_date) > new Date() ? "Entrée" : "Sortie"} - 
                  {(upcomingInspection.lot as any)?.lot_number}
                  {(upcomingInspection.lot as any)?.building && ` (${(upcomingInspection.lot as any).building.name})`} - 
                  {(upcomingInspection.tenant as any)?.first_name} {(upcomingInspection.tenant as any)?.last_name} - 
                  {format(
                    new Date(upcomingInspection.start_date > new Date().toISOString() ? upcomingInspection.start_date : upcomingInspection.end_date || upcomingInspection.start_date),
                    "d MMMM yyyy",
                    { locale: fr }
                  )}
                </p>
              </div>
              <Button variant="outline" size="sm">
                Préparer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No apartments message */}
        {!hasLots && !lotsLoading && (
          <Card className="shadow-soft border-muted">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Home className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Aucun appartement dans cette résidence</h3>
              <p className="text-sm text-muted-foreground max-w-[400px]">
                Vous devez d'abord créer des lots/appartements avant de pouvoir programmer des états des lieux.
                Les états des lieux à venir s'afficheront ici une fois des baux créés.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">États des lieux</TabsTrigger>
            <TabsTrigger value="templates">Modèles</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <InspectionsList residenceIds={residenceIds} />
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <InspectionTemplates residenceIds={residenceIds} />
          </TabsContent>
        </Tabs>

        {/* New Inspection Dialog */}
        <NewInspectionDialog
          open={showNewInspectionDialog}
          onOpenChange={setShowNewInspectionDialog}
          residenceIds={residenceIds}
          lots={lots || []}
        />
      </div>
    </AppLayout>
  );
}
