import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  Vote,
  Receipt,
  FileText,
  Plus,
  Download,
  Calculator,
  PiggyBank,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useResidence } from "@/contexts/ResidenceContext";
import { CoproBudgets } from "@/components/syndic/CoproBudgets";
import { CoproCalls } from "@/components/syndic/CoproCalls";
import { DistributionKeys } from "@/components/syndic/DistributionKeys";
import { WorksFund } from "@/components/syndic/WorksFund";
import { LotTantiemes } from "@/components/syndic/LotTantiemes";

export default function Syndic() {
  const { user, profile, logout, isManager } = useAuth();
  const { selectedResidence } = useResidence();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

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
              <Building2 className="h-8 w-8 text-primary" />
              Syndic & Copropriété
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestion de la copropriété {selectedResidence?.name || ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter données
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel appel de fonds
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">48</p>
                <p className="text-xs text-muted-foreground">Copropriétaires</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Calculator className="h-5 w-5 text-secondary" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">10 000</p>
                <p className="text-xs text-muted-foreground">Tantièmes totaux</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Receipt className="h-5 w-5 text-success" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">125 000 €</p>
                <p className="text-xs text-muted-foreground">Budget annuel</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <PiggyBank className="h-5 w-5 text-warning" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">45 000 €</p>
                <p className="text-xs text-muted-foreground">Fonds travaux</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert for pending calls */}
        <Card className="shadow-soft border-warning/30 bg-warning/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Appels de fonds en cours</h3>
              <p className="text-sm text-muted-foreground">
                3 appels de fonds Q1 2026 en attente de paiement - 12 450 € à collecter
              </p>
            </div>
            <Button variant="outline" size="sm">
              Voir les appels
            </Button>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="calls">Appels de fonds</TabsTrigger>
            <TabsTrigger value="keys">Clés de répartition</TabsTrigger>
            <TabsTrigger value="fund">Fonds travaux</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <LotTantiemes residenceId={selectedResidence?.id} />
          </TabsContent>

          <TabsContent value="budgets" className="mt-6">
            <CoproBudgets residenceId={selectedResidence?.id} />
          </TabsContent>

          <TabsContent value="calls" className="mt-6">
            <CoproCalls residenceId={selectedResidence?.id} />
          </TabsContent>

          <TabsContent value="keys" className="mt-6">
            <DistributionKeys residenceId={selectedResidence?.id} />
          </TabsContent>

          <TabsContent value="fund" className="mt-6">
            <WorksFund residenceId={selectedResidence?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
