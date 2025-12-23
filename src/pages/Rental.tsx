import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Home, Plus, Building2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Unit {
  id: string;
  door: string | null;
  floor: number | null;
  type: string | null;
  surface: number | null;
  rooms: number | null;
  rent_target: number | null;
  status: string | null;
}

interface Vacancy {
  id: string;
  title: string;
  status: string | null;
  unit_id: string;
  unit?: Unit;
  applications_count?: number;
}

interface Application {
  id: string;
  candidate_name: string;
  candidate_email: string | null;
  status: string | null;
  vacancy_id: string;
  created_at: string;
}

export default function Rental() {
  const { user, profile, logout, canAccessRental } = useAuth();
  const navigate = useNavigate();
  const [units, setUnits] = useState<Unit[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && canAccessRental()) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch units
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .order('door', { ascending: true });

      if (unitsError) throw unitsError;
      setUnits(unitsData || []);

      // Fetch vacancies with unit info
      const { data: vacanciesData, error: vacanciesError } = await supabase
        .from('vacancies')
        .select(`
          *,
          unit:units(*)
        `)
        .order('created_at', { ascending: false });

      if (vacanciesError) throw vacanciesError;

      // Get application counts for each vacancy
      const { data: appCounts, error: appError } = await supabase
        .from('applications')
        .select('vacancy_id');

      if (!appError && appCounts) {
        const countMap = new Map<string, number>();
        appCounts.forEach(app => {
          countMap.set(app.vacancy_id, (countMap.get(app.vacancy_id) || 0) + 1);
        });

        const vacanciesWithCounts = (vacanciesData || []).map(v => ({
          ...v,
          applications_count: countMap.get(v.id) || 0,
        }));
        setVacancies(vacanciesWithCounts);
      } else {
        setVacancies(vacanciesData || []);
      }

      // Fetch applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (applicationsError) throw applicationsError;
      setApplications(applicationsData || []);

    } catch (error) {
      console.error('Error fetching rental data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (!user || !profile || !canAccessRental()) {
    return null;
  }

  const vacantUnits = units.filter(u => u.status === 'vacant');
  const openVacancies = vacancies.filter(v => v.status === 'open');
  const totalApplications = applications.length;

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Location & Candidatures</h1>
            <p className="text-muted-foreground">Gestion des logements et dossiers locataires</p>
          </div>
          <Button onClick={() => navigate('/rental/vacancies/new')}>
            <Plus className="h-4 w-4 mr-2" />Créer une vacance
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{units.length}</p>
              <p className="text-sm text-muted-foreground">Logements</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-kopro-amber">{vacantUnits.length}</p>
              <p className="text-sm text-muted-foreground">Vacants</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-kopro-teal">{openVacancies.length}</p>
              <p className="text-sm text-muted-foreground">Vacances ouvertes</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-kopro-purple">{totalApplications}</p>
              <p className="text-sm text-muted-foreground">Candidatures</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="units">
          <TabsList>
            <TabsTrigger value="units">Logements</TabsTrigger>
            <TabsTrigger value="vacancies">Vacances</TabsTrigger>
            <TabsTrigger value="applications">Candidatures</TabsTrigger>
          </TabsList>

          <TabsContent value="units" className="mt-4 space-y-3">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Chargement...</p>
            ) : units.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="p-8 text-center">
                  <Home className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun logement</p>
                </CardContent>
              </Card>
            ) : (
              units.map(unit => (
                <Card key={unit.id} className="shadow-soft hover:shadow-medium cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${unit.status === 'vacant' ? 'bg-kopro-amber/10' : 'bg-success/10'}`}>
                      <Home className={`h-6 w-6 ${unit.status === 'vacant' ? 'text-kopro-amber' : 'text-success'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Apt {unit.door}</span>
                        {unit.type && <Badge variant="secondary">{unit.type}</Badge>}
                        <Badge variant={unit.status === 'vacant' ? 'destructive' : 'secondary'}>
                          {unit.status === 'vacant' ? 'Vacant' : 'Occupé'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {unit.surface}m² · {unit.rooms} pièces {unit.rent_target ? `· ${unit.rent_target}€/mois` : ''}
                      </p>
                    </div>
                    {unit.status === 'vacant' && (
                      <Button size="sm">Créer vacance <ArrowRight className="h-4 w-4 ml-1" /></Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="vacancies" className="mt-4 space-y-3">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Chargement...</p>
            ) : vacancies.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="p-8 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune vacance</p>
                </CardContent>
              </Card>
            ) : (
              vacancies.map(v => (
                <Card key={v.id} className="shadow-soft hover:shadow-medium cursor-pointer" onClick={() => navigate(`/rental/vacancies/${v.id}`)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-kopro-teal/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-kopro-teal" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{v.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Apt {v.unit?.door} · {v.applications_count || 0} candidature(s)
                      </p>
                    </div>
                    <Badge>{v.status === 'open' ? 'Ouverte' : v.status === 'draft' ? 'Brouillon' : 'Fermée'}</Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="applications" className="mt-4">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Chargement...</p>
            ) : applications.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucune candidature</p>
            ) : (
              <div className="space-y-3">
                {applications.map(app => (
                  <Card key={app.id} className="shadow-soft">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex-1">
                        <p className="font-semibold">{app.candidate_name}</p>
                        <p className="text-sm text-muted-foreground">{app.candidate_email}</p>
                      </div>
                      <Badge variant={app.status === 'accepted' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {app.status === 'new' ? 'Nouvelle' : 
                         app.status === 'under_review' ? 'En cours' :
                         app.status === 'shortlist' ? 'Présélection' :
                         app.status === 'accepted' ? 'Acceptée' : 'Refusée'}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
