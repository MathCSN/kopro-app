import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, Search, Building2, UserPlus, Share2, QrCode } from "lucide-react";
import { useResidence } from "@/contexts/ResidenceContext";
import { supabase } from "@/integrations/supabase/client";
import { TenantCard } from "@/components/tenants/TenantCard";
import { TenantDetails } from "@/components/tenants/TenantDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { ResidenceQRDialog } from "@/components/residence/ResidenceQRDialog";
import { ResidenceShareDialog } from "@/components/residence/ResidenceShareDialog";
import { InviteUserDialog } from "@/components/admin/users/InviteUserDialog";


interface Tenant {
  id: string;
  user_id: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  lot: {
    id: string;
    lot_number: string;
    door: string | null;
    floor: number | null;
    surface: number | null;
    rooms: number | null;
    join_code: string | null;
  } | null;
  type: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  documents_count?: number;
}

function TenantsContent() {
  const { selectedResidence, isAllResidences, residences } = useResidence();
  const [search, setSearch] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  useEffect(() => {
    if (selectedResidence || isAllResidences) {
      fetchTenants();
    }
  }, [selectedResidence, isAllResidences]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("occupancies")
        .select(`
          id,
          user_id,
          type,
          is_active,
          start_date,
          end_date,
          lot:lots (
            id,
            lot_number,
            door,
            floor,
            surface,
            rooms,
            join_code,
            residence_id
          )
        `)
        .eq("is_active", true);

      const { data: occupancies, error } = await query;
      if (error) throw error;

      // Filter by residence
      let filteredOccupancies = occupancies || [];
      if (!isAllResidences && selectedResidence) {
        filteredOccupancies = filteredOccupancies.filter(
          (o: any) => o.lot?.residence_id === selectedResidence.id
        );
      } else if (isAllResidences) {
        const residenceIds = residences.map(r => r.id);
        filteredOccupancies = filteredOccupancies.filter(
          (o: any) => o.lot?.residence_id && residenceIds.includes(o.lot.residence_id)
        );
      }

      // Fetch profiles for all users
      const userIds = [...new Set(filteredOccupancies.map((o: any) => o.user_id))];
      
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds);
        profiles = profilesData || [];
      }

      // Fetch document counts
      const residenceId = selectedResidence?.id;
      let documentCounts: Record<string, number> = {};
      if (residenceId && userIds.length > 0) {
        const { data: docs } = await supabase
          .from("tenant_documents")
          .select("user_id")
          .eq("residence_id", residenceId)
          .in("user_id", userIds);
        
        (docs || []).forEach((d: any) => {
          documentCounts[d.user_id] = (documentCounts[d.user_id] || 0) + 1;
        });
      }

      // Combine data
      const tenantsData: Tenant[] = filteredOccupancies.map((o: any) => ({
        id: o.id,
        user_id: o.user_id,
        type: o.type,
        is_active: o.is_active,
        start_date: o.start_date,
        end_date: o.end_date,
        lot: o.lot,
        profile: profiles.find((p: any) => p.id === o.user_id) || null,
        documents_count: documentCounts[o.user_id] || 0,
      }));

      setTenants(tenantsData);
    } catch (error) {
      console.error("Error fetching tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const fullName = `${t.profile?.first_name || ""} ${t.profile?.last_name || ""}`.toLowerCase();
    const email = (t.profile?.email || "").toLowerCase();
    const lot = (t.lot?.lot_number || "").toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower) || lot.includes(searchLower);
  });

  const handleSelectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setDetailsOpen(true);
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Locataires</h1>
            <p className="text-muted-foreground">
              {isAllResidences
                ? "Tous les locataires de vos résidences"
                : selectedResidence
                ? `Locataires de ${selectedResidence.name}`
                : "Sélectionnez une résidence"}
            </p>
          </div>
          <div className="flex gap-2">
            {selectedResidence && (
              <>
                <Button variant="outline" className="gap-2" onClick={() => setQrDialogOpen(true)}>
                  <QrCode className="h-4 w-4" />
                  QR Code
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => setShareDialogOpen(true)}>
                  <Share2 className="h-4 w-4" />
                  Partager
                </Button>
              </>
            )}
            <Button 
              className="gap-2" 
              disabled={!selectedResidence}
              onClick={() => setInviteDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              Ajouter un locataire
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un locataire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Content */}
        {!selectedResidence && !isAllResidences ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sélectionnez une résidence
              </h3>
              <p className="text-muted-foreground max-w-sm">
                Utilisez le sélecteur de résidence en haut du menu pour choisir la résidence.
              </p>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTenants.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {search ? "Aucun résultat" : "Aucun locataire"}
              </h3>
              <p className="text-muted-foreground max-w-sm mb-4">
                {search 
                  ? "Aucun locataire ne correspond à votre recherche."
                  : "Les locataires apparaîtront ici lorsqu'ils rejoindront la résidence."}
              </p>
              {!search && selectedResidence && (
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setInviteDialogOpen(true)}
                >
                  <UserPlus className="h-4 w-4" />
                  Ajouter un locataire
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTenants.map((tenant) => (
              <TenantCard
                key={tenant.id}
                tenant={tenant}
                onSelect={handleSelectTenant}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tenant Details Sheet */}
      <TenantDetails
        tenant={selectedTenant}
        residenceId={selectedResidence?.id || ""}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onUpdate={fetchTenants}
      />

      {/* QR Code Dialog */}
      {selectedResidence && (
        <ResidenceQRDialog
          residenceId={selectedResidence.id}
          residenceName={selectedResidence.name}
          open={qrDialogOpen}
          onOpenChange={setQrDialogOpen}
        />
      )}

      {/* Share Dialog */}
      {selectedResidence && (
        <ResidenceShareDialog
          residenceId={selectedResidence.id}
          residenceName={selectedResidence.name}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
        />
      )}

      {/* Invite Dialog */}
      {selectedResidence && (
        <InviteUserDialog
          residenceId={selectedResidence.id}
          residenceName={selectedResidence.name}
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
        />
      )}
    </>
  );
}

export default function Tenants() {
  return <TenantsContent />;
}
