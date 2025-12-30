import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Loader2, Search, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useResidence } from "@/contexts/ResidenceContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Vacancy {
  id: string;
  title: string;
  unit?: {
    door: string | null;
  };
}

interface Application {
  id: string;
  candidate_name: string;
  candidate_email: string | null;
  candidate_phone: string | null;
  status: string | null;
  vacancy_id: string;
  vacancy?: Vacancy;
  created_at: string;
  submitted_at: string | null;
}

// Inner component that uses useResidence - must be inside AppLayout/ResidenceProvider
function RentalApplicationsContent() {
  const { user, canAccessRental } = useAuth();
  const { selectedResidence } = useResidence();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (user && canAccessRental()) {
      fetchApplications();
    }
  }, [user, selectedResidence]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      // First get vacancies for the selected residence
      let vacancyQuery = supabase
        .from('vacancies')
        .select('id');
      
      if (selectedResidence) {
        vacancyQuery = vacancyQuery.eq('residence_id', selectedResidence.id);
      }

      const { data: vacancies } = await vacancyQuery;
      const vacancyIds = vacancies?.map(v => v.id) || [];

      if (vacancyIds.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      // Then get applications for those vacancies
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          vacancy:vacancies(id, title, unit:units(door))
        `)
        .in('vacancy_id', vacancyIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les candidatures.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
      app.candidate_email?.toLowerCase().includes(search.toLowerCase()) ||
      app.vacancy?.title?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const newCount = applications.filter(a => a.status === 'new').length;
  const reviewCount = applications.filter(a => a.status === 'under_review').length;
  const shortlistCount = applications.filter(a => a.status === 'shortlist').length;

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-kopro-teal">Nouvelle</Badge>;
      case 'under_review':
        return <Badge className="bg-kopro-amber">En cours</Badge>;
      case 'shortlist':
        return <Badge className="bg-kopro-purple">Présélection</Badge>;
      case 'accepted':
        return <Badge className="bg-success">Acceptée</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Refusée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/rental')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Candidatures</h1>
          <p className="text-muted-foreground">Gérez les candidatures de location</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card 
          className={`shadow-soft cursor-pointer transition-all ${statusFilter === 'new' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'new' ? 'all' : 'new')}
        >
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-kopro-teal">{newCount}</p>
            <p className="text-sm text-muted-foreground">Nouvelles</p>
          </CardContent>
        </Card>
        <Card 
          className={`shadow-soft cursor-pointer transition-all ${statusFilter === 'under_review' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'under_review' ? 'all' : 'under_review')}
        >
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-kopro-amber">{reviewCount}</p>
            <p className="text-sm text-muted-foreground">En cours</p>
          </CardContent>
        </Card>
        <Card 
          className={`shadow-soft cursor-pointer transition-all ${statusFilter === 'shortlist' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'shortlist' ? 'all' : 'shortlist')}
        >
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-kopro-purple">{shortlistCount}</p>
            <p className="text-sm text-muted-foreground">Présélection</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un candidat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Applications list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredApplications.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Aucune candidature</h3>
            <p className="text-muted-foreground">
              {search || statusFilter !== 'all' 
                ? "Aucune candidature ne correspond à vos critères." 
                : "Les candidatures apparaîtront ici une fois reçues."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredApplications.map(app => (
            <Card 
              key={app.id} 
              className="shadow-soft hover:shadow-medium cursor-pointer transition-shadow"
              onClick={() => navigate(`/rental/applications/${app.id}`)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-kopro-purple/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-kopro-purple" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{app.candidate_name}</span>
                    {getStatusBadge(app.status)}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {app.vacancy?.title} · Apt {app.vacancy?.unit?.door}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(app.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
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
export default function RentalApplications() {
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
      <RentalApplicationsContent />
    </AppLayout>
  );
}
