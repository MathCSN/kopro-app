import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Euro,
  Building2,
  Ticket,
  Calendar,
  Download,
  Filter,
  PieChart,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useResidence } from "@/contexts/ResidenceContext";
import { FinancialCharts } from "@/components/analytics/FinancialCharts";
import { OccupancyStats } from "@/components/analytics/OccupancyStats";
import { TicketAnalytics } from "@/components/analytics/TicketAnalytics";
import { TenantStats } from "@/components/analytics/TenantStats";

export default function Analytics() {
  const { user, profile, logout, isManager } = useAuth();
  const { selectedResidence } = useResidence();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("financial");
  const [period, setPeriod] = useState("12m");

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
              <BarChart3 className="h-8 w-8 text-primary" />
              Tableaux de bord & Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Analyse des performances de {selectedResidence?.name || "la résidence"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 mois</SelectItem>
                <SelectItem value="3m">3 mois</SelectItem>
                <SelectItem value="6m">6 mois</SelectItem>
                <SelectItem value="12m">12 mois</SelectItem>
                <SelectItem value="all">Tout</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* KPI Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Euro className="h-5 w-5 text-success" />
                <Badge variant="outline" className="text-success border-success/30">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8%
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">245 800 €</p>
                <p className="text-xs text-muted-foreground">Revenus annuels</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Building2 className="h-5 w-5 text-primary" />
                <Badge variant="outline" className="text-primary border-primary/30">98%</Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">47/48</p>
                <p className="text-xs text-muted-foreground">Taux d'occupation</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Ticket className="h-5 w-5 text-warning" />
                <Badge variant="outline" className="text-success border-success/30">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -15%
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">2.3 j</p>
                <p className="text-xs text-muted-foreground">Temps résolution moyen</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">4.2 ans</p>
                <p className="text-xs text-muted-foreground">Ancienneté moyenne</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="financial">Finances</TabsTrigger>
            <TabsTrigger value="occupancy">Occupation</TabsTrigger>
            <TabsTrigger value="tickets">Incidents</TabsTrigger>
            <TabsTrigger value="tenants">Locataires</TabsTrigger>
          </TabsList>

          <TabsContent value="financial" className="mt-6">
            <FinancialCharts residenceId={selectedResidence?.id} period={period} />
          </TabsContent>

          <TabsContent value="occupancy" className="mt-6">
            <OccupancyStats residenceId={selectedResidence?.id} period={period} />
          </TabsContent>

          <TabsContent value="tickets" className="mt-6">
            <TicketAnalytics residenceId={selectedResidence?.id} period={period} />
          </TabsContent>

          <TabsContent value="tenants" className="mt-6">
            <TenantStats residenceId={selectedResidence?.id} period={period} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
