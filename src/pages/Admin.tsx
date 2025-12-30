import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Settings, Users, Building2, FileText, Home, Mail, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SmtpConfigForm } from "@/components/settings/SmtpConfigForm";
import { AdminContent } from "@/components/admin/AdminContent";

export default function Admin() {
  const { user, profile, logout, isManager } = useAuth();
  const navigate = useNavigate();

  if (!user || !isManager()) {
    navigate("/dashboard");
    return null;
  }

  return (
    <AppLayout userRole={profile?.role || "resident"} onLogout={logout}>
      <AdminContent />
    </AppLayout>
  );
}
