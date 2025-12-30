import { useState } from "react";
import { Settings, Users, Building2, FileText, Home, Mail, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResidence } from "@/contexts/ResidenceContext";
import { SmtpConfigForm } from "@/components/settings/SmtpConfigForm";
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
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">
            <Settings className="h-4 w-4 mr-2" />
            Aperçu
          </TabsTrigger>
          <TabsTrigger value="residence">
            <Building2 className="h-4 w-4 mr-2" />
            Résidence
          </TabsTrigger>
          <TabsTrigger value="lots">
            <Home className="h-4 w-4 mr-2" />
            Lots & Tantièmes
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="smtp">
            <Mail className="h-4 w-4 mr-2" />
            Emails (SMTP)
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Wrench className="h-4 w-4 mr-2" />
            Intégrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-medium transition-shadow" 
              onClick={() => setActiveTab("residence")}
            >
              <CardContent className="p-6 text-center">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Résidence</p>
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

        <TabsContent value="residence">
          <Card>
            <CardHeader>
              <CardTitle>Gestion de la résidence</CardTitle>
              <CardDescription>
                {selectedResidence ? selectedResidence.name : "Sélectionnez une résidence"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => handleFeatureClick("Modifier les informations")}>
                  Modifier les informations
                </Button>
                <Button variant="outline" onClick={() => handleFeatureClick("Gérer les bâtiments")}>
                  Gérer les bâtiments
                </Button>
                <Button variant="outline" onClick={() => handleFeatureClick("Paramètres de la résidence")}>
                  Paramètres de la résidence
                </Button>
                <Button variant="outline" onClick={() => handleFeatureClick("Exporter les données")}>
                  Exporter les données
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lots">
          <Card>
            <CardHeader>
              <CardTitle>Lots & Tantièmes</CardTitle>
              <CardDescription>Gérez les lots et leurs tantièmes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => handleFeatureClick("Ajouter un lot")}>
                  Ajouter un lot
                </Button>
                <Button variant="outline" onClick={() => handleFeatureClick("Importer depuis Excel")}>
                  Importer depuis Excel
                </Button>
                <Button variant="outline" onClick={() => handleFeatureClick("Gérer les tantièmes")}>
                  Gérer les tantièmes
                </Button>
                <Button variant="outline" onClick={() => handleFeatureClick("Exporter la liste")}>
                  Exporter la liste
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs</CardTitle>
              <CardDescription>Gérez les utilisateurs de la résidence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => handleFeatureClick("Ajouter un utilisateur")}>
                  Ajouter un utilisateur
                </Button>
                <Button variant="outline" onClick={() => handleFeatureClick("Inviter par email")}>
                  Inviter par email
                </Button>
                <Button variant="outline" onClick={() => handleFeatureClick("Gérer les rôles")}>
                  Gérer les rôles
                </Button>
                <Button variant="outline" onClick={() => handleFeatureClick("Exporter la liste")}>
                  Exporter la liste
                </Button>
              </div>
            </CardContent>
          </Card>
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
