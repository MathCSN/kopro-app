import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Settings, Users, Building2, FileText, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Admin() {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();

  if (!user || !isManager()) {
    navigate("/dashboard");
    return null;
  }

  return (
    <AppLayout userRole={user.role} onLogout={logout}>
      <div className="space-y-6 animate-fade-in">
        <h1 className="font-display text-2xl lg:text-3xl font-bold">Administration</h1>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Résidence", icon: Building2, href: "/admin/residence" },
            { title: "Lots & Tantièmes", icon: Home, href: "/admin/lots" },
            { title: "Utilisateurs", icon: Users, href: "/admin/users" },
            { title: "Templates", icon: FileText, href: "/admin/templates" },
          ].map(item => (
            <Card key={item.title} className="cursor-pointer hover:shadow-medium" onClick={() => navigate(item.href)}>
              <CardContent className="p-6 text-center">
                <item.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">{item.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
