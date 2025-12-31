import { useState, useRef } from "react";
import { Settings, Users, FileText, Mail, Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResidence } from "@/contexts/ResidenceContext";
import { SmtpConfigForm } from "@/components/settings/SmtpConfigForm";
import { UsersManagement } from "@/components/admin/users/UsersManagement";
import { AISettingsTab } from "@/components/admin/AISettingsTab";
import { EmailTemplatesManagement } from "@/components/admin/EmailTemplatesManagement";
import { PropertyManagement } from "@/components/admin/PropertyManagement";
import { ApartmentRequestsManagement } from "@/components/admin/ApartmentRequestsManagement";
import { toast } from "sonner";

export function AdminContent() {
  const { selectedResidence } = useResidence();
  const [activeTab, setActiveTab] = useState("overview");
  const contentRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Don't scroll - keep current position
  };

  const handleFeatureClick = (feature: string) => {
    toast.info(`La fonctionnalité "${feature}" sera bientôt disponible`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl lg:text-3xl font-bold">Administration</h1>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="h-auto flex-wrap gap-1 p-1">
          <TabsTrigger value="overview" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Aperçu</span>
          </TabsTrigger>
          <TabsTrigger value="patrimoine" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Patrimoine</span>
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
            <span className="hidden sm:inline">Emails</span>
          </TabsTrigger>
          <TabsTrigger value="smtp" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">SMTP</span>
          </TabsTrigger>
        </TabsList>

        <div ref={contentRef}>
          <TabsContent value="overview" className="space-y-6 mt-0" tabIndex={-1}>
            <ApartmentRequestsManagement />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-medium transition-shadow" 
                onClick={() => handleTabChange("patrimoine")}
              >
                <CardContent className="p-6 text-center">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Patrimoine</p>
                  <p className="text-xs text-muted-foreground">Résidences, bâtiments, lots</p>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-medium transition-shadow" 
                onClick={() => handleTabChange("users")}
              >
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Utilisateurs</p>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-medium transition-shadow" 
                onClick={() => handleTabChange("ai")}
              >
                <CardContent className="p-6 text-center">
                  <Bot className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Assistant IA</p>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-medium transition-shadow" 
                onClick={() => handleTabChange("templates")}
              >
                <CardContent className="p-6 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Templates</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patrimoine" className="mt-0" tabIndex={-1}>
            <PropertyManagement />
          </TabsContent>

          <TabsContent value="users" className="mt-0" tabIndex={-1}>
            <UsersManagement />
          </TabsContent>

          <TabsContent value="ai" className="mt-0" tabIndex={-1}>
            <AISettingsTab />
          </TabsContent>

          <TabsContent value="templates" className="mt-0" tabIndex={-1}>
            <EmailTemplatesManagement />
          </TabsContent>

          <TabsContent value="smtp" className="mt-0" tabIndex={-1}>
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
        </div>
      </Tabs>
    </div>
  );
}
