import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import { Vote, Plus, Calendar, FileText, Users, CheckCircle2, Clock, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AGEvent {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  location: string | null;
  status: string | null;
  agenda: any;
  minutes_url: string | null;
}

function AGDetail({ id }: { id: string }) {
  const { user, profile, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const [ag, setAG] = useState<AGEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAGDetail();
  }, [id]);

  const fetchAGDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('general_assemblies')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setAG(data);
    } catch (error) {
      console.error('Error fetching AG:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (loading) {
    return (
      <AppLayout userRole={profile?.role || 'resident'} onLogout={handleLogout}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  if (!ag) {
    return (
      <AppLayout userRole={profile?.role || 'resident'} onLogout={handleLogout}>
        <div className="text-center py-12">
          <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">AG non trouvée</p>
          <Button variant="link" onClick={() => navigate('/ag')}>
            Retour aux assemblées
          </Button>
        </div>
      </AppLayout>
    );
  }

  const scheduledDate = new Date(ag.scheduled_at);

  return (
    <AppLayout userRole={profile?.role || 'resident'} onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate('/ag')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux assemblées
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">{ag.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {scheduledDate.toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })} à {scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {ag.location && <span>{ag.location}</span>}
            </div>
          </div>
          <Badge variant={ag.status === 'voting' || ag.status === 'scheduled' ? 'default' : 'secondary'} className="text-sm">
            {ag.status === 'voting' ? 'Votes ouverts' : ag.status === 'scheduled' ? 'Programmée' : 'Clôturée'}
          </Badge>
        </div>

        {ag.description && (
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-muted-foreground">{ag.description}</p>
            </CardContent>
          </Card>
        )}

        {ag.agenda && Array.isArray(ag.agenda) && ag.agenda.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold">Ordre du jour ({ag.agenda.length} points)</h2>
            
            {ag.agenda.map((item: any, index: number) => (
              <Card key={index} className="shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.title || item}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      )}
                    </div>
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

export default function AG() {
  const { user, profile, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [assemblies, setAssemblies] = useState<AGEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !id) {
      fetchAssemblies();
    }
  }, [user, id]);

  const fetchAssemblies = async () => {
    try {
      const { data, error } = await supabase
        .from('general_assemblies')
        .select('*')
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      setAssemblies(data || []);
    } catch (error) {
      console.error('Error fetching assemblies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (!user || !profile) {
    navigate("/auth");
    return null;
  }

  if (id) {
    return <AGDetail id={id} />;
  }

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Assemblées Générales</h1>
            <p className="text-muted-foreground mt-1">Votes et résolutions de copropriété</p>
          </div>
          {isManager() && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer une AG
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        ) : assemblies.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-8 text-center">
              <Vote className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune assemblée générale programmée</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assemblies.map((ag) => {
              const scheduledDate = new Date(ag.scheduled_at);
              const isUpcoming = scheduledDate > new Date();
              return (
                <Card 
                  key={ag.id} 
                  className="shadow-soft hover:shadow-medium transition-all cursor-pointer"
                  onClick={() => navigate(`/ag/${ag.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isUpcoming ? 'bg-kopro-purple/10' : 'bg-muted'
                      }`}>
                        <Vote className={`h-6 w-6 ${
                          isUpcoming ? 'text-kopro-purple' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{ag.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {scheduledDate.toLocaleDateString('fr-FR', { 
                                day: 'numeric', 
                                month: 'long', 
                                year: 'numeric' 
                              })} à {scheduledDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <Badge variant={isUpcoming ? 'default' : 'secondary'}>
                            {isUpcoming ? 'À venir' : 'Passée'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                          {ag.agenda && Array.isArray(ag.agenda) && (
                            <span className="text-sm text-muted-foreground">
                              <FileText className="h-3 w-3 inline mr-1" />
                              {ag.agenda.length} points à l'ordre du jour
                            </span>
                          )}
                          {ag.location && (
                            <span className="text-sm text-muted-foreground">
                              📍 {ag.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
