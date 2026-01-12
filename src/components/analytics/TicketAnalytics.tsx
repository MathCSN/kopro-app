import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { Ticket, Clock, CheckCircle2, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { format, subMonths, differenceInHours, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

interface TicketAnalyticsProps {
  residenceId?: string;
  period?: string;
}

const PRIORITY_COLORS = {
  low: "hsl(var(--muted-foreground))",
  medium: "hsl(var(--warning))",
  high: "hsl(var(--destructive))",
  urgent: "hsl(142, 76%, 36%)", // dark red
};

const STATUS_COLORS = {
  open: "hsl(var(--primary))",
  in_progress: "hsl(var(--warning))",
  resolved: "hsl(var(--success))",
  closed: "hsl(var(--muted-foreground))",
};

export function TicketAnalytics({ residenceId, period }: TicketAnalyticsProps) {
  const monthsBack = period === "1m" ? 1 : period === "3m" ? 3 : period === "6m" ? 6 : 12;

  const { data: ticketData, isLoading } = useQuery({
    queryKey: ["ticket-analytics", residenceId, period],
    queryFn: async () => {
      if (!residenceId) return null;

      const startDate = subMonths(new Date(), monthsBack);

      const { data: tickets, error } = await supabase
        .from("tickets")
        .select("id, title, category, priority, status, created_at, updated_at")
        .eq("residence_id", residenceId)
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      // Calculate stats
      const totalTickets = tickets?.length || 0;
      const openTickets = tickets?.filter((t: any) => t.status === "open" || t.status === "in_progress").length || 0;
      const resolvedTickets = tickets?.filter((t: any) => t.status === "resolved" || t.status === "closed").length || 0;
      const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0;

      // Average resolution time (using updated_at as proxy for resolved tickets)
      const resolvedWithTime = tickets?.filter((t: any) => t.status === "resolved" || t.status === "closed") || [];
      const avgResolutionHours = resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((sum: number, t: any) => {
            const hours = differenceInHours(new Date(t.updated_at), new Date(t.created_at));
            return sum + hours;
          }, 0) / resolvedWithTime.length
        : 0;
      const avgResolutionDays = avgResolutionHours / 24;

      // By category
      const byCategory: Record<string, number> = {};
      tickets?.forEach((t: any) => {
        const cat = t.category || "other";
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      });
      const categoryData = Object.entries(byCategory)
        .map(([name, value]) => ({ name: getCategoryLabel(name), value }))
        .sort((a, b) => b.value - a.value);

      // By priority
      const byPriority: Record<string, number> = {};
      tickets?.forEach((t: any) => {
        const priority = t.priority || "medium";
        byPriority[priority] = (byPriority[priority] || 0) + 1;
      });
      const priorityData = Object.entries(byPriority).map(([priority, count]) => ({
        priority: getPriorityLabel(priority),
        count,
        color: PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.medium,
      }));

      // By status
      const byStatus: Record<string, number> = {};
      tickets?.forEach((t: any) => {
        const status = t.status || "open";
        byStatus[status] = (byStatus[status] || 0) + 1;
      });
      const statusData = Object.entries(byStatus).map(([status, count]) => ({
        name: getStatusLabel(status),
        value: count,
        color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.open,
      }));

      // Monthly trend
      const monthlyData: Record<string, { created: number; resolved: number }> = {};
      tickets?.forEach((t: any) => {
        const month = format(new Date(t.created_at), "MMM", { locale: fr });
        if (!monthlyData[month]) {
          monthlyData[month] = { created: 0, resolved: 0 };
        }
        monthlyData[month].created++;
        if (t.status === "resolved" || t.status === "closed") {
          const resolvedMonth = format(new Date(t.updated_at), "MMM", { locale: fr });
          if (!monthlyData[resolvedMonth]) {
            monthlyData[resolvedMonth] = { created: 0, resolved: 0 };
          }
          monthlyData[resolvedMonth].resolved++;
        }
      });
      const trendData = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        ...data,
      }));

      return {
        totalTickets,
        openTickets,
        resolvedTickets,
        resolutionRate,
        avgResolutionDays,
        categoryData,
        priorityData,
        statusData,
        trendData,
      };
    },
    enabled: !!residenceId,
  });

  if (!residenceId) {
    return (
      <Card className="shadow-soft">
        <CardContent className="p-8 text-center text-muted-foreground">
          Veuillez sélectionner une résidence
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const {
    totalTickets = 0,
    openTickets = 0,
    resolvedTickets = 0,
    resolutionRate = 0,
    avgResolutionDays = 0,
    categoryData = [],
    priorityData = [],
    statusData = [],
    trendData = [],
  } = ticketData || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Ticket className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{totalTickets}</p>
            <p className="text-xs text-muted-foreground">Tickets total</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <p className="text-2xl font-bold">{openTickets}</p>
            <p className="text-xs text-muted-foreground">En cours</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-secondary" />
              <Badge variant="outline" className={avgResolutionDays <= 2 ? "text-success border-success/30" : avgResolutionDays <= 5 ? "text-warning border-warning/30" : "text-destructive border-destructive/30"}>
                {avgResolutionDays <= 2 ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                {avgResolutionDays <= 2 ? "Rapide" : avgResolutionDays <= 5 ? "Moyen" : "Lent"}
              </Badge>
            </div>
            <p className="text-2xl font-bold">{avgResolutionDays.toFixed(1)} j</p>
            <p className="text-xs text-muted-foreground">Temps résolution moyen</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <p className="text-2xl font-bold">{resolutionRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Taux de résolution</p>
            <Progress value={resolutionRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Évolution des tickets</CardTitle>
          <CardDescription>Créés vs résolus par mois</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="created" stroke="hsl(var(--primary))" strokeWidth={2} name="Créés" />
                  <Line type="monotone" dataKey="resolved" stroke="hsl(var(--success))" strokeWidth={2} name="Résolus" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Aucune donnée pour cette période
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Category */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Par catégorie</CardTitle>
            <CardDescription>Répartition des incidents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune donnée
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* By Status */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Par statut</CardTitle>
            <CardDescription>État actuel des tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune donnée
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Distribution */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Par priorité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {priorityData.map((item) => (
              <div 
                key={item.priority} 
                className="p-4 rounded-lg border"
                style={{ borderColor: item.color }}
              >
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-sm text-muted-foreground">{item.priority}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    plumbing: "Plomberie",
    electrical: "Électricité",
    heating: "Chauffage",
    elevator: "Ascenseur",
    cleaning: "Nettoyage",
    security: "Sécurité",
    noise: "Nuisances",
    parking: "Parking",
    other: "Autres",
  };
  return labels[category] || category;
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: "Basse",
    medium: "Moyenne",
    high: "Haute",
    urgent: "Urgente",
  };
  return labels[priority] || priority;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: "Ouvert",
    in_progress: "En cours",
    resolved: "Résolu",
    closed: "Fermé",
  };
  return labels[status] || status;
}
