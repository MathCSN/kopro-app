import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, Loader2, Search, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useResidence } from "@/contexts/ResidenceContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Unit {
  id: string;
  door: string | null;
  surface: number | null;
  rooms: number | null;
}

interface Vacancy {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  visibility: string | null;
  unit_id: string;
  unit?: Unit;
  applications_count?: number;
  created_at: string;
}

// Inner component that uses useResidence - must be inside AppLayout/ResidenceProvider
function RentalVacanciesContent() {
  const { user, canAccessRental } = useAuth();
  const { selectedResidence } = useResidence();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user && canAccessRental()) {
      fetchVacancies();
    }
  }, [user, selectedResidence]);

  const fetchVacancies = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('vacancies')
        .select(`
          *,
          unit:units(id, door, surface, rooms)
        `)
        .order('created_at', { ascending: false });

      if (selectedResidence) {
        query = query.eq('residence_id', selectedResidence.id);
      }

      const { data: vacanciesData, error } = await query;

      if (error) throw error;

      // Get application counts
      const { data: appCounts } = await supabase
        .from('applications')
        .select('vacancy_id');

      const countMap = new Map<string, number>();
      appCounts?.forEach(app => {
        countMap.set(app.vacancy_id, (countMap.get(app.vacancy_id) || 0) + 1);
      });

      const vacanciesWithCounts = (vacanciesData || []).map(v => ({
        ...v,
        applications_count: countMap.get(v.id) || 0,
      }));

      setVacancies(vacanciesWithCounts);
    } catch (error) {
      console.error('Error fetching vacancies:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les annonces.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVacancies = vacancies.filter(v => 
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    v.unit?.door?.toLowerCase().includes(search.toLowerCase())
  );

  const openCount = vacancies.filter(v => v.status === 'open').length;
  const draftCount = vacancies.filter(v => v.status === 'draft').length;
  const closedCount = vacancies.filter(v => v.status === 'closed').length;

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-success">Active</Badge>;
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'closed':
        return <Badge variant="destructive">Fermée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Annonces de location</h1>
          <p className="text-muted-foreground">Gérez vos offres de location</p>
        </div>
        <Button onClick={() => navigate('/rental/vacancies/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle annonce
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-success">{openCount}</p>
            <p className="text-sm text-muted-foreground">Actives</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-muted-foreground">{draftCount}</p>
            <p className="text-sm text-muted-foreground">Brouillons</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{closedCount}</p>
            <p className="text-sm text-muted-foreground">Fermées</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une annonce..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Vacancies list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredVacancies.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Aucune annonce</h3>
            <p className="text-muted-foreground mb-4">
              {search ? "Aucune annonce ne correspond à votre recherche." : "Créez votre première annonce de location."}
            </p>
            {!search && (
              <Button onClick={() => navigate('/rental/vacancies/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une annonce
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredVacancies.map(vacancy => (
            <Card 
              key={vacancy.id} 
              className="shadow-soft hover:shadow-medium cursor-pointer transition-shadow"
              onClick={() => navigate(`/rental/vacancies/${vacancy.id}`)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-kopro-teal/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-kopro-teal" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{vacancy.title}</span>
                    {getStatusBadge(vacancy.status)}
                    {vacancy.visibility === 'public_link' && (
                      <Badge variant="outline">Public</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Apt {vacancy.unit?.door} · {vacancy.applications_count || 0} candidature{(vacancy.applications_count || 0) > 1 ? 's' : ''}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Wrapper component that provides ResidenceProvider via AppLayout
export default function RentalVacancies() {
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
      <RentalVacanciesContent />
    </AppLayout>
  );
}
