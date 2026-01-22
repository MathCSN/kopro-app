import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Users,
  MapPin,
  Building2,
  Upload,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LandlordApartment {
  id: string;
  door: string;
  floor: number | null;
  type: string | null;
  surface: number | null;
  rent_target: number | null;
  charges_target: number | null;
  status: string;
  residence_id: string | null;
  is_approved_by_syndic: boolean;
  created_at: string;
  residence?: {
    name: string;
    address: string;
  };
  tenant_leases?: {
    id: string;
    tenant_id: string;
    status: string;
    tenant?: {
      first_name: string;
      last_name: string;
    };
  }[];
}

const statusLabels: Record<string, string> = {
  vacant: "Vacant",
  occupied: "Loué",
  maintenance: "En travaux",
};

const statusColors: Record<string, string> = {
  vacant: "bg-warning/10 text-warning border-warning/20",
  occupied: "bg-success/10 text-success border-success/20",
  maintenance: "bg-muted text-muted-foreground border-border",
};

export default function BailleurApartments() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const [apartments, setApartments] = useState<LandlordApartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchApartments();
    }
  }, [user]);

  const fetchApartments = async () => {
    try {
      const { data, error } = await supabase
        .from('landlord_apartments')
        .select(`
          *,
          residence:residences(name, address)
        `)
        .eq('landlord_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch active leases for each apartment
      const apartmentIds = data?.map(a => a.id) || [];
      let leasesByApartment: Record<string, any[]> = {};

      if (apartmentIds.length > 0) {
        const { data: leases } = await supabase
          .from('tenant_leases')
          .select(`
            id,
            apartment_id,
            tenant_id,
            status,
            tenant:profiles!tenant_leases_tenant_id_fkey(first_name, last_name)
          `)
          .in('apartment_id', apartmentIds)
          .eq('status', 'active');

        leases?.forEach(lease => {
          if (!leasesByApartment[lease.apartment_id]) {
            leasesByApartment[lease.apartment_id] = [];
          }
          leasesByApartment[lease.apartment_id].push(lease);
        });
      }

      const enrichedData = data?.map(apt => ({
        ...apt,
        tenant_leases: leasesByApartment[apt.id] || [],
      })) || [];

      setApartments(enrichedData);
    } catch (error) {
      console.error('Error fetching apartments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login");
  };

  const filteredApartments = apartments.filter(apt => {
    const matchesSearch = 
      apt.door.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.residence?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.residence?.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!user || !profile) return null;

  return (
    <AppLayout userRole={profile.role || 'manager'} onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              Mes appartements
            </h1>
            <p className="text-muted-foreground mt-1">
              {apartments.length} appartement{apartments.length > 1 ? 's' : ''} dans votre portefeuille
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Importer CSV
            </Button>
            <Button onClick={() => navigate("/bailleur/apartments/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par adresse, porte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="occupied">Loués</SelectItem>
              <SelectItem value="vacant">Vacants</SelectItem>
              <SelectItem value="maintenance">En travaux</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Apartments Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredApartments.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg text-foreground mb-2">
                {apartments.length === 0 ? "Aucun appartement" : "Aucun résultat"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {apartments.length === 0 
                  ? "Commencez par ajouter votre premier appartement"
                  : "Modifiez vos critères de recherche"
                }
              </p>
              {apartments.length === 0 && (
                <Button onClick={() => navigate("/bailleur/apartments/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un appartement
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApartments.map((apt) => (
              <Card 
                key={apt.id} 
                className="shadow-soft hover:shadow-medium transition-all cursor-pointer group"
                onClick={() => navigate(`/bailleur/apartments/${apt.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Home className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                          {apt.type || 'Appartement'} - {apt.door}
                        </CardTitle>
                        {apt.floor !== null && (
                          <p className="text-xs text-muted-foreground">
                            {apt.floor === 0 ? 'RDC' : `${apt.floor}e étage`}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/bailleur/apartments/${apt.id}/edit`); }}>
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/bailleur/tenants/new?apartment=${apt.id}`); }}>
                          Ajouter un locataire
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Location */}
                  {apt.residence ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{apt.residence.name}</span>
                      {apt.is_approved_by_syndic && (
                        <Badge variant="outline" className="text-xs">Rattaché</Badge>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>Non rattaché à une résidence</span>
                    </div>
                  )}

                  {/* Tenant Info */}
                  {apt.tenant_leases && apt.tenant_leases.length > 0 ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-kopro-teal" />
                      <span className="text-foreground">
                        {apt.tenant_leases[0].tenant?.first_name} {apt.tenant_leases[0].tenant?.last_name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Aucun locataire</span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Badge variant="outline" className={statusColors[apt.status]}>
                      {statusLabels[apt.status]}
                    </Badge>
                    {apt.rent_target && (
                      <span className="text-sm font-semibold text-foreground">
                        {apt.rent_target.toLocaleString()}€/mois
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
