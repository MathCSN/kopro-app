import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Building2, 
  Search, 
  Plus, 
  Users, 
  Home,
  ChevronRight,
  Filter
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgencyFormDialog } from "@/components/admin/clients/AgencyFormDialog";

interface Agency {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: string | null;
  logo_url: string | null;
  owner_id: string | null;
  created_at: string;
  owner?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
  residences_count: number;
  lots_count: number;
}

export default function AdminClients() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: agencies = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-agencies"],
    queryFn: async () => {
      // Get agencies with owner info
      const { data: agenciesData, error: agenciesError } = await supabase
        .from("agencies")
        .select(`
          *,
          owner:profiles!agencies_owner_id_fkey(
            first_name,
            last_name,
            avatar_url,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (agenciesError) throw agenciesError;

      // Get residences count per agency
      const { data: residencesData } = await supabase
        .from("residences")
        .select("id, agency_id");

      // Get lots count per residence
      const { data: lotsData } = await supabase
        .from("lots")
        .select("id, residence_id");

      // Build count maps
      const residencesByAgency = new Map<string, string[]>();
      residencesData?.forEach(r => {
        if (r.agency_id) {
          const list = residencesByAgency.get(r.agency_id) || [];
          list.push(r.id);
          residencesByAgency.set(r.agency_id, list);
        }
      });

      const lotsCountByResidence = new Map<string, number>();
      lotsData?.forEach(l => {
        lotsCountByResidence.set(l.residence_id, (lotsCountByResidence.get(l.residence_id) || 0) + 1);
      });

      return agenciesData.map(agency => {
        const residenceIds = residencesByAgency.get(agency.id) || [];
        const lotsCount = residenceIds.reduce((sum, rId) => sum + (lotsCountByResidence.get(rId) || 0), 0);
        return {
          ...agency,
          residences_count: residenceIds.length,
          lots_count: lotsCount,
        } as Agency;
      });
    },
  });

  const filteredAgencies = agencies.filter(agency => {
    const matchesSearch = 
      agency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.owner?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.owner?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || agency.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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

  const getOwnerInitials = (owner: Agency["owner"]) => {
    if (!owner) return "?";
    const first = owner.first_name?.[0] || "";
    const last = owner.last_name?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground">
              Gérez les agences, gestionnaires et leurs résidences
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/global-users")}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un membre
            </Button>
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle agence
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une agence, gestionnaire, ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="trial">Essai</SelectItem>
              <SelectItem value="suspended">Suspendu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Agences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agencies.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Résidences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {agencies.reduce((sum, a) => sum + a.residences_count, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lots gérés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {agencies.reduce((sum, a) => sum + a.lots_count, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agencies List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Chargement...
          </div>
        ) : filteredAgencies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune agence trouvée</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Aucun résultat pour ces critères de recherche"
                  : "Commencez par créer votre première agence"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une agence
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAgencies.map((agency) => (
              <Card 
                key={agency.id} 
                className="hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/clients/${agency.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Agency Logo */}
                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      {agency.logo_url ? (
                        <img 
                          src={agency.logo_url} 
                          alt={agency.name} 
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                      ) : (
                        <Building2 className="h-7 w-7 text-primary" />
                      )}
                    </div>

                    {/* Agency Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">{agency.name}</h3>
                        {getStatusBadge(agency.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {agency.city && <span>{agency.city}</span>}
                        {agency.email && <span>{agency.email}</span>}
                      </div>
                    </div>

                    {/* Owner */}
                    <div className="hidden md:flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={agency.owner?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getOwnerInitials(agency.owner)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <p className="font-medium">
                          {agency.owner?.first_name} {agency.owner?.last_name}
                        </p>
                        <p className="text-muted-foreground text-xs">Gestionnaire</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Home className="h-4 w-4" />
                          <span className="font-semibold text-foreground">{agency.residences_count}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Résidences</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span className="font-semibold text-foreground">{agency.lots_count}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Lots</p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AgencyFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          refetch();
          setIsFormOpen(false);
        }}
      />
    </AdminLayout>
  );
}
