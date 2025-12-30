import { useState } from "react";
import { Settings, Users, Building2, FileText, Home, Mail, Wrench, Landmark, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResidence } from "@/contexts/ResidenceContext";
import { SmtpConfigForm } from "@/components/settings/SmtpConfigForm";
import { LotsManagement } from "@/components/admin/lots/LotsManagement";
import { UsersManagement } from "@/components/admin/users/UsersManagement";
import { BuildingsManagement } from "@/components/admin/buildings/BuildingsManagement";
import { AISettingsTab } from "@/components/admin/AISettingsTab";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AdminContent() {
  const { selectedResidence } = useResidence();
  const [activeTab, setActiveTab] = useState("overview");

  const handleFeatureClick = (feature: string) => {
    toast.info(`La fonctionnalité "${feature}" sera bientôt disponible`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl lg:text-3xl font-bold">Administration</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="h-auto flex-wrap gap-1 p-1">
          <TabsTrigger value="overview" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Aperçu</span>
          </TabsTrigger>
          <TabsTrigger value="buildings" className="gap-2">
            <Landmark className="h-4 w-4" />
            <span className="hidden sm:inline">Bâtiments</span>
          </TabsTrigger>
          <TabsTrigger value="lots" className="gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Lots</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Utilisateurs</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">Assistant IA</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="smtp" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">SMTP</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Intégrations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-medium transition-shadow" 
              onClick={() => setActiveTab("buildings")}
            >
              <CardContent className="p-6 text-center">
                <Landmark className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Bâtiments</p>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover:shadow-medium transition-shadow" 
              onClick={() => setActiveTab("lots")}
            >
              <CardContent className="p-6 text-center">
                <Home className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Lots & Tantièmes</p>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover:shadow-medium transition-shadow" 
              onClick={() => setActiveTab("users")}
            >
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Utilisateurs</p>
              </CardContent>
            </Card>
            <Card 
              className="cursor-pointer hover:shadow-medium transition-shadow" 
              onClick={() => setActiveTab("templates")}
            >
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Templates</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="buildings">
          <BuildingsManagement />
        </TabsContent>

        <TabsContent value="lots">
          <LotsManagement />
        </TabsContent>

        <TabsContent value="users">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="ai">
          <AISettingsTab />
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Templates d'emails</CardTitle>
              <CardDescription>Personnalisez vos modèles d'emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => handleFeatureClick("Créer un template")}>
                  Créer un template
                </Button>
                <Button variant="outline" onClick={() => handleFeatureClick("Templates par défaut")}>
                  Templates par défaut
                </Button>
                <Button variant="outline" onClick={() => handleFeatureClick("Prévisualiser")}>
                  Prévisualiser
                </Button>
                <Button variant="outline" onClick={() => handleFeatureClick("Importer un template")}>
                  Importer un template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smtp">
          {selectedResidence ? (
            <SmtpConfigForm residenceId={selectedResidence.id} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Sélectionnez une résidence pour configurer le SMTP
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardContent className="py-12 text-center">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Intégrations à venir</h3>
              <p className="text-muted-foreground">
                Connectez vos outils préférés : comptabilité, banque, etc.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
