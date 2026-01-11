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
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useResidence } from "@/contexts/ResidenceContext";
import { InspectionsList } from "@/components/inspections/InspectionsList";
import { InspectionTemplates } from "@/components/inspections/InspectionTemplates";

export default function PropertyInspections() {
  const { user, profile, logout, isManager } = useAuth();
  const { selectedResidence } = useResidence();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("list");

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
              <ClipboardCheck className="h-8 w-8 text-primary" />
              États des lieux
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestion des états des lieux d'entrée et de sortie
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button size="sm">
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
                <p className="text-2xl font-bold text-foreground">3</p>
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
                <p className="text-2xl font-bold text-foreground">2</p>
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
                <p className="text-2xl font-bold text-foreground">24</p>
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
                <p className="text-2xl font-bold text-foreground">1</p>
                <p className="text-xs text-muted-foreground">Litiges en cours</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Inspection Alert */}
        <Card className="shadow-soft border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Prochain état des lieux</h3>
              <p className="text-sm text-muted-foreground">
                Entrée - Appartement 12B - M. Dupont - 18 janvier 2026 à 10h00
              </p>
            </div>
            <Button variant="outline" size="sm">
              Préparer
            </Button>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">États des lieux</TabsTrigger>
            <TabsTrigger value="templates">Modèles</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <InspectionsList residenceId={selectedResidence?.id} />
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <InspectionTemplates residenceId={selectedResidence?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
