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
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useResidence } from "@/contexts/ResidenceContext";
import { WorkOrdersList } from "@/components/maintenance/WorkOrdersList";
import { SupplierQuotes } from "@/components/maintenance/SupplierQuotes";
import { MaintenanceCalendar } from "@/components/maintenance/MaintenanceCalendar";
import { MaintenanceContracts } from "@/components/maintenance/MaintenanceContracts";

export default function WorkOrders() {
  const { user, profile, logout, isManager } = useAuth();
  const { selectedResidence } = useResidence();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders");

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
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
            <Button size="sm">
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
                <Badge variant="outline" className="text-warning border-warning/30">Urgent</Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">5</p>
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
                <p className="text-2xl font-bold text-foreground">12</p>
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
                <p className="text-2xl font-bold text-foreground">48</p>
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
                <p className="text-2xl font-bold text-foreground">8 450 €</p>
                <p className="text-xs text-muted-foreground">Dépenses du mois</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Maintenance Alert */}
        <Card className="shadow-soft border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Prochaine maintenance programmée</h3>
              <p className="text-sm text-muted-foreground">
                Entretien ascenseur - Bâtiment A - 15 janvier 2026 à 9h00
              </p>
            </div>
            <Button variant="outline" size="sm">
              Voir le planning
            </Button>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="orders">Ordres de service</TabsTrigger>
            <TabsTrigger value="quotes">Devis prestataires</TabsTrigger>
            <TabsTrigger value="calendar">Planning</TabsTrigger>
            <TabsTrigger value="contracts">Contrats</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <WorkOrdersList residenceId={selectedResidence?.id} />
          </TabsContent>

          <TabsContent value="quotes" className="mt-6">
            <SupplierQuotes residenceId={selectedResidence?.id} />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <MaintenanceCalendar residenceId={selectedResidence?.id} />
          </TabsContent>

          <TabsContent value="contracts" className="mt-6">
            <MaintenanceContracts residenceId={selectedResidence?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
