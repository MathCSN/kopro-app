import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  Search,
  MoreVertical,
  Users,
  MapPin,
  Home,
  QrCode,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Residence {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  join_code?: string | null;
  created_at: string;
  lots_count: number;
  residents_count: number;
  buildings_count: number;
}

export default function SyndicResidences() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const [residences, setResidences] = useState<Residence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      fetchResidences();
    }
  }, [user]);

  const fetchResidences = async () => {
    try {
      // Get agency ID for this user
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('agency_id')
        .eq('user_id', user!.id)
        .eq('role', 'manager')
        .limit(1);

      const agencyId = userRoles?.[0]?.agency_id;
      if (!agencyId) {
        setResidences([]);
        setLoading(false);
        return;
      }

      // Fetch residences for this agency
      const { data: residencesData, error } = await supabase
        .from('residences')
        .select('*')
        .eq('agency_id', agencyId)
        .order('name');

      if (error) throw error;

      // Get counts for each residence
      const enrichedResidences = await Promise.all(
        (residencesData || []).map(async (res) => {
          // Count lots
          const { count: lotsCount } = await supabase
            .from('lots')
            .select('id', { count: 'exact' })
            .eq('residence_id', res.id);

          // Count buildings
          const { count: buildingsCount } = await supabase
            .from('buildings')
            .select('id', { count: 'exact' })
            .eq('residence_id', res.id);

          // Count residents
          const { count: residentsCount } = await supabase
            .from('user_roles')
            .select('id', { count: 'exact' })
            .eq('residence_id', res.id)
            .eq('role', 'resident');

          return {
            ...res,
            lots_count: lotsCount || 0,
            buildings_count: buildingsCount || 0,
            residents_count: residentsCount || 0,
          };
        })
      );

      setResidences(enrichedResidences);
    } catch (error) {
      console.error('Error fetching residences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth/login");
  };

  const filteredResidences = residences.filter(res =>
    res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user || !profile) return null;

return (
    <div className="p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              Mes résidences
            </h1>
            <p className="text-muted-foreground mt-1">
              {residences.length} résidence{residences.length > 1 ? 's' : ''} sous gestion
            </p>
          </div>

          <Button onClick={() => navigate("/syndic/residences/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle résidence
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une résidence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Residences Grid */}
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
        ) : filteredResidences.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg text-foreground mb-2">
                {residences.length === 0 ? "Aucune résidence" : "Aucun résultat"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {residences.length === 0 
                  ? "Créez votre première résidence pour commencer"
                  : "Modifiez vos critères de recherche"
                }
              </p>
              {residences.length === 0 && (
                <Button onClick={() => navigate("/syndic/residences/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une résidence
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResidences.map((res) => (
              <Card 
                key={res.id} 
                className="shadow-soft hover:shadow-medium transition-all cursor-pointer group"
                onClick={() => navigate(`/syndic/residences/${res.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-kopro-purple/10 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-kopro-purple" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                          {res.name}
                        </CardTitle>
                        {res.join_code && (
                          <Badge variant="outline" className="text-xs mt-1">
                            Code: {res.join_code}
                          </Badge>
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
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/syndic/residences/${res.id}`); }}>
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/syndic/residences/${res.id}/buildings`); }}>
                          Gérer bâtiments
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                          <QrCode className="h-4 w-4 mr-2" />
                          QR Code
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Address */}
                  {res.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {res.address}{res.city ? `, ${res.city}` : ''}
                      </span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">{res.buildings_count}</p>
                      <p className="text-xs text-muted-foreground">Bât.</p>
                    </div>
                    <div className="text-center border-x">
                      <p className="text-lg font-semibold text-foreground">{res.lots_count}</p>
                      <p className="text-xs text-muted-foreground">Lots</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">{res.residents_count}</p>
                      <p className="text-xs text-muted-foreground">Résid.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
  );
}
