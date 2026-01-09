import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  CreditCard, 
  Settings,
  Edit,
  Home,
  MapPin,
  Phone,
  Mail
} from "lucide-react";
import { AgencyFormDialog } from "@/components/admin/clients/AgencyFormDialog";
import { AgencyResidencesTab } from "@/components/admin/clients/AgencyResidencesTab";
import { AgencyTeamTab } from "@/components/admin/clients/AgencyTeamTab";
import { AgencySubscriptionTab } from "@/components/admin/clients/AgencySubscriptionTab";

export default function AdminClientDetail() {
  const { agencyId } = useParams<{ agencyId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("residences");
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: agency, isLoading, refetch } = useQuery({
    queryKey: ["admin-agency", agencyId],
    queryFn: async () => {
      if (!agencyId) throw new Error("No agency ID");
      
      const { data, error } = await supabase
        .from("agencies")
        .select(`
          *,
          owner:profiles!agencies_owner_id_fkey(
            id,
            first_name,
            last_name,
            avatar_url,
            email,
            phone
          )
        `)
        .eq("id", agencyId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!agencyId,
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-agency-stats", agencyId],
    queryFn: async () => {
      if (!agencyId) return null;
      
      // Get residences for this agency
      const { data: residences } = await supabase
        .from("residences")
        .select("id")
        .eq("agency_id", agencyId);

      const residenceIds = residences?.map(r => r.id) || [];

      // Get lots count
      let lotsCount = 0;
      if (residenceIds.length > 0) {
        const { count } = await supabase
          .from("lots")
          .select("*", { count: "exact", head: true })
          .in("residence_id", residenceIds);
        lotsCount = count || 0;
      }

      // Get team members count
      const { count: teamCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agencyId);

      return {
        residences: residenceIds.length,
        lots: lotsCount,
        team: teamCount || 0,
      };
    },
    enabled: !!agencyId,
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Actif</Badge>;
      case "trial":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Essai</Badge>;
      case "suspended":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Suspendu</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!agency) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Agence introuvable</p>
          <Button variant="outline" onClick={() => navigate("/admin/clients")}>
            Retour aux clients
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/admin/clients")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux clients
        </Button>

        {/* Agency Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Logo & Main Info */}
              <div className="flex items-start gap-4 flex-1">
                <div className="h-20 w-20 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  {agency.logo_url ? (
                    <img 
                      src={agency.logo_url} 
                      alt={agency.name} 
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                  ) : (
                    <Building2 className="h-10 w-10 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold truncate">{agency.name}</h1>
                    {getStatusBadge(agency.status)}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    {agency.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{agency.email}</span>
                      </div>
                    )}
                    {agency.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{agency.phone}</span>
                      </div>
                    )}
                    {(agency.address || agency.city) && (
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {[agency.address, agency.postal_code, agency.city].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              {agency.owner && (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={agency.owner.avatar_url || undefined} />
                    <AvatarFallback>
                      {(agency.owner.first_name?.[0] || "") + (agency.owner.last_name?.[0] || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {agency.owner.first_name} {agency.owner.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">Gestionnaire principal</p>
                    {agency.owner.email && (
                      <p className="text-xs text-muted-foreground">{agency.owner.email}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Edit Button */}
              <Button variant="outline" onClick={() => setIsEditOpen(true)} className="gap-2">
                <Edit className="h-4 w-4" />
                Modifier
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Home className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{stats?.residences || 0}</span>
                </div>
                <p className="text-sm text-muted-foreground">Résidences</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{stats?.lots || 0}</span>
                </div>
                <p className="text-sm text-muted-foreground">Lots</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{stats?.team || 0}</span>
                </div>
                <p className="text-sm text-muted-foreground">Équipe</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="residences" className="gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Résidences</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Équipe</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Abonnement</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="residences" className="mt-6">
            <AgencyResidencesTab agencyId={agencyId!} />
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <AgencyTeamTab agencyId={agencyId!} ownerId={agency.owner_id} />
          </TabsContent>

          <TabsContent value="subscription" className="mt-6">
            <AgencySubscriptionTab agencyId={agencyId!} ownerId={agency.owner_id} />
          </TabsContent>
        </Tabs>
      </div>

      <AgencyFormDialog 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen}
        agency={agency}
        onSuccess={() => {
          refetch();
          setIsEditOpen(false);
        }}
      />
    </AdminLayout>
  );
}
