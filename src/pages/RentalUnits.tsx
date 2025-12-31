import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Plus, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useResidence } from "@/contexts/ResidenceContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BulkCreateUnitsDialog } from "@/components/admin/units/BulkCreateUnitsDialog";

interface Unit {
  id: string;
  door: string | null;
  floor: number | null;
  type: string | null;
  surface: number | null;
  rooms: number | null;
  rent_target: number | null;
  charges_target: number | null;
  status: string | null;
  residence_id: string;
  building: string | null;
  entrance: string | null;
}

// Inner component that uses useResidence - must be inside AppLayout/ResidenceProvider
function RentalUnitsContent() {
  const { user, canAccessRental } = useAuth();
  const { selectedResidence } = useResidence();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user && canAccessRental()) {
      fetchUnits();
    }
  }, [user, selectedResidence]);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('units')
        .select('*')
        .order('door', { ascending: true });

      if (selectedResidence) {
        query = query.eq('residence_id', selectedResidence.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les logements.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUnits = units.filter(u => 
    u.door?.toLowerCase().includes(search.toLowerCase()) ||
    u.type?.toLowerCase().includes(search.toLowerCase()) ||
    u.building?.toLowerCase().includes(search.toLowerCase())
  );

  const vacantCount = units.filter(u => u.status === 'vacant').length;
  const occupiedCount = units.filter(u => u.status === 'occupied').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Biens immobiliers</h1>
          <p className="text-muted-foreground">Gérez votre parc immobilier</p>
        </div>
        <div className="flex gap-2">
          <BulkCreateUnitsDialog onCreated={fetchUnits} />
          <Button onClick={() => navigate('/rental/units/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau bien
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{units.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-success">{occupiedCount}</p>
            <p className="text-sm text-muted-foreground">Occupés</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-kopro-amber">{vacantCount}</p>
            <p className="text-sm text-muted-foreground">Vacants</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un logement..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Units list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredUnits.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="p-8 text-center">
            <Home className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Aucun logement</h3>
            <p className="text-muted-foreground mb-4">
              {search ? "Aucun logement ne correspond à votre recherche." : "Commencez par créer votre premier logement."}
            </p>
            {!search && (
              <Button onClick={() => navigate('/rental/units/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un logement
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredUnits.map(unit => (
            <Card key={unit.id} className="shadow-soft hover:shadow-medium cursor-pointer transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  unit.status === 'vacant' ? 'bg-kopro-amber/10' : 'bg-success/10'
                }`}>
                  <Home className={`h-6 w-6 ${
                    unit.status === 'vacant' ? 'text-kopro-amber' : 'text-success'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">Apt {unit.door}</span>
                    {unit.type && <Badge variant="secondary">{unit.type}</Badge>}
                    <Badge variant={unit.status === 'vacant' ? 'destructive' : 'secondary'}>
                      {unit.status === 'vacant' ? 'Vacant' : 'Occupé'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {unit.building && `${unit.building} · `}
                    {unit.floor !== null && `Étage ${unit.floor} · `}
                    {unit.surface}m² · {unit.rooms} pièces
                    {unit.rent_target && ` · ${unit.rent_target}€/mois`}
                  </p>
                </div>
                {unit.status === 'vacant' && (
                  <Button size="sm" variant="outline" onClick={(e) => {
                    e.stopPropagation();
                    navigate('/rental/vacancies/new');
                  }}>
                    Créer annonce
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Wrapper component that provides ResidenceProvider via AppLayout
export default function RentalUnits() {
  const { user, profile, logout, canAccessRental } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (!user || !profile || !canAccessRental()) {
    return null;
  }

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <RentalUnitsContent />
    </AppLayout>
  );
}
