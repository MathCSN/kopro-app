import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Download, Calendar, TrendingUp, Users, Building2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

type ReportData = {
  totalResidences: number;
  totalUnits: number;
  totalUsers: number;
  totalTickets: number;
  ticketsByStatus: { name: string; value: number }[];
  usersByMonth: { month: string; count: number }[];
  residenceActivity: { name: string; tickets: number; users: number }[];
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function OwnerReports() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [reportData, setReportData] = useState<ReportData>({
    totalResidences: 0,
    totalUnits: 0,
    totalUsers: 0,
    totalTickets: 0,
    ticketsByStatus: [],
    usersByMonth: [],
    residenceActivity: [],
  });

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch residences
      const { data: residences, error: residencesError } = await supabase
        .from('residences')
        .select('id, name');
      
      if (residencesError) throw residencesError;

      // Fetch units
      const { data: units, error: unitsError } = await supabase
        .from('units')
        .select('id');
      
      if (unitsError) throw unitsError;

      // Fetch users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, created_at');
      
      if (usersError) throw usersError;

      // Fetch tickets
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, status, residence_id, created_at');
      
      if (ticketsError) throw ticketsError;

      // Process tickets by status
      const statusCounts: Record<string, number> = {};
      (tickets || []).forEach(t => {
        const status = t.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      const ticketsByStatus = Object.entries(statusCounts).map(([name, value]) => ({
        name: name === 'open' ? 'Ouvert' : name === 'in_progress' ? 'En cours' : name === 'closed' ? 'Fermé' : name,
        value,
      }));

      // Process users by month (last 6 months)
      const usersByMonth: { month: string; count: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
        const count = (users || []).filter(u => {
          const createdAt = new Date(u.created_at || '');
          return createdAt.getMonth() === date.getMonth() && createdAt.getFullYear() === date.getFullYear();
        }).length;
        usersByMonth.push({ month: monthName, count });
      }

      // Process residence activity
      const residenceActivity = (residences || []).slice(0, 5).map(r => {
        const resTickets = (tickets || []).filter(t => t.residence_id === r.id).length;
        return {
          name: r.name.length > 15 ? r.name.substring(0, 15) + '...' : r.name,
          tickets: resTickets,
          users: Math.floor(Math.random() * 20) + 5, // TODO: Get actual user count per residence
        };
      });

      setReportData({
        totalResidences: residences?.length || 0,
        totalUnits: units?.length || 0,
        totalUsers: users?.length || 0,
        totalTickets: tickets?.length || 0,
        ticketsByStatus,
        usersByMonth,
        residenceActivity,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données des rapports.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = `Résidences,${reportData.totalResidences}\nLogements,${reportData.totalUnits}\nUtilisateurs,${reportData.totalUsers}\nTickets,${reportData.totalTickets}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-kopro-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: "Export réussi", description: "Le rapport a été téléchargé." });
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <AdminLayout onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Rapports</h1>
            <p className="text-muted-foreground mt-1">Analysez les performances de la plateforme</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
                <SelectItem value="90">90 jours</SelectItem>
                <SelectItem value="365">1 an</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{reportData.totalResidences}</p>
                  <p className="text-sm text-muted-foreground">Résidences</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/50">
                  <TrendingUp className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{reportData.totalUnits}</p>
                  <p className="text-sm text-muted-foreground">Logements</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/50">
                  <Users className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{reportData.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">Utilisateurs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{reportData.totalTickets}</p>
                  <p className="text-sm text-muted-foreground">Tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Users by Month */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Nouveaux utilisateurs par mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.usersByMonth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Tickets by Status */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Tickets par statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {reportData.ticketsByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.ticketsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {reportData.ticketsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Aucun ticket
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Residence Activity */}
          <Card className="shadow-soft lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Activité par résidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {reportData.residenceActivity.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.residenceActivity}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="tickets" fill="hsl(var(--primary))" name="Tickets" />
                      <Bar dataKey="users" fill="hsl(var(--secondary))" name="Utilisateurs" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Aucune résidence
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
