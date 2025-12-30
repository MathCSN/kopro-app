import { useNavigate } from "react-router-dom";
import { Settings, Users, Building2, FileText, Home, Mail, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResidence } from "@/contexts/ResidenceContext";
import { SmtpConfigForm } from "@/components/settings/SmtpConfigForm";

export function AdminContent() {
  const { selectedResidence } = useResidence();
  const navigate = useNavigate();

  const quickLinks = [
    { title: "Résidence", icon: Building2, href: "/admin/residence" },
    { title: "Lots & Tantièmes", icon: Home, href: "/admin/lots" },
    { title: "Utilisateurs", icon: Users, href: "/admin/users" },
    { title: "Templates", icon: FileText, href: "/admin/templates" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-2xl lg:text-3xl font-bold">Administration</h1>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <Settings className="h-4 w-4 mr-2" />
            Aperçu
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
            {quickLinks.map(item => (
              <Card 
                key={item.title} 
                className="cursor-pointer hover:shadow-medium transition-shadow" 
                onClick={() => navigate(item.href)}
              >
                <CardContent className="p-6 text-center">
                  <item.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">{item.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
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
