import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Users, Plus, QrCode, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Visitor {
  id: string;
  visitor_name: string;
  purpose: string | null;
  expected_at: string | null;
  arrived_at: string | null;
  left_at: string | null;
  status: string | null;
  access_code: string | null;
}

export default function Visitors() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchVisitors();
    }
  }, [user]);

  const fetchVisitors = async () => {
    try {
      const { data, error } = await supabase
        .from('visitors')
        .select('*')
        .order('expected_at', { ascending: false });

      if (error) throw error;
      setVisitors(data || []);
    } catch (error) {
      console.error('Error fetching visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

    const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) return `Aujourd'hui ${time}`;
    if (isTomorrow) return `Demain ${time}`;
    if (isYesterday) return `Hier ${time}`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ` ${time}`;
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-success/10';
      case 'expected': return 'bg-kopro-amber/10';
      default: return 'bg-muted';
    }
  };

  const getStatusIconColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'text-success';
      case 'expected': return 'text-kopro-amber';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'expected': return 'En attente';
      case 'arrived': return 'Arrivé';
      case 'left': return 'Parti';
      default: return 'Utilisé';
    }
  };

  if (!user || !profile) {
    navigate("/auth");
    return null;
  }

  const myVisitors = visitors.filter(v => v.status !== 'left');
  const visitorsWithLogs = visitors.filter(v => v.arrived_at || v.left_at);

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Visiteurs & Accès</h1>
            <p className="text-muted-foreground mt-1">Gérez les invitations et codes d'accès</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle invitation
          </Button>
        </div>

        <Tabs defaultValue="invitations">
          <TabsList>
            <TabsTrigger value="invitations">Mes invitations</TabsTrigger>
            <TabsTrigger value="logs">Journal d'accès</TabsTrigger>
          </TabsList>

          <TabsContent value="invitations" className="mt-4 space-y-4">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Chargement...</p>
            ) : myVisitors.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune invitation en cours</p>
                </CardContent>
              </Card>
            ) : (
              myVisitors.map((inv) => (
                <Card key={inv.id} className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(inv.status)}`}>
                        <Users className={`h-6 w-6 ${getStatusIconColor(inv.status)}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{inv.visitor_name}</h3>
                        <p className="text-sm text-muted-foreground">{inv.purpose || 'Visite'}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(inv.expected_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={inv.status === 'active' ? 'default' : 'secondary'}>
                          {getStatusLabel(inv.status)}
                        </Badge>
                        {inv.access_code && (
                          <div className="flex items-center gap-2 mt-2">
                            <QrCode className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-sm">{inv.access_code}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Journal d'accès récent</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-4">Chargement...</p>
                ) : visitorsWithLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Aucun accès enregistré</p>
                ) : (
                  <div className="space-y-3">
                    {visitorsWithLogs.map((log) => (
                      <div key={log.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          log.arrived_at && !log.left_at ? 'bg-success/10' : 'bg-muted'
                        }`}>
                          {log.arrived_at && !log.left_at ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{log.visitor_name}</p>
                          <p className="text-xs text-muted-foreground">{log.purpose || 'Visite'}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{log.arrived_at && !log.left_at ? 'Entrée' : 'Sortie'}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(log.left_at || log.arrived_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
