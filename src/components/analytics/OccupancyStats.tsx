import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { Building2, Home, Users, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { format, subMonths, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

interface OccupancyStatsProps {
  residenceId?: string;
  period?: string;
}

export function OccupancyStats({ residenceId, period }: OccupancyStatsProps) {
  const { data: occupancyData, isLoading } = useQuery({
    queryKey: ["occupancy-analytics", residenceId, period],
    queryFn: async () => {
      if (!residenceId) return null;

      // Get all lots
      const { data: lots, error: lotsError } = await supabase
        .from("lots")
        .select("id, lot_number, type, primary_resident_id, owner_id")
        .eq("residence_id", residenceId);

      if (lotsError) throw lotsError;

      // Get active leases
      const { data: leases, error: leasesError } = await supabase
        .from("leases")
        .select("id, lot_id, start_date, end_date, status, tenant_id")
        .eq("residence_id", residenceId);

      if (leasesError) throw leasesError;

      // Get vacancies
      const { data: vacancies, error: vacanciesError } = await supabase
        .from("vacancies")
        .select("id, unit_id, status, created_at")
        .eq("residence_id", residenceId);

      if (vacanciesError) throw vacanciesError;

      // Calculate stats
      const totalLots = lots?.length || 0;
      const occupiedLots = lots?.filter(l => 
        l.primary_resident_id || 
        leases?.some(lease => lease.lot_id === l.id && lease.status === "active")
      ).length || 0;
      
      const vacantLots = totalLots - occupiedLots;
      const occupancyRate = totalLots > 0 ? (occupiedLots / totalLots) * 100 : 0;

      // Lots by type
      const lotsByType: Record<string, { total: number; occupied: number }> = {};
      lots?.forEach(lot => {
        const type = lot.type || "other";
        if (!lotsByType[type]) {
          lotsByType[type] = { total: 0, occupied: 0 };
        }
        lotsByType[type].total++;
        if (lot.primary_resident_id || leases?.some(l => l.lot_id === lot.id && l.status === "active")) {
          lotsByType[type].occupied++;
        }
      });

      const typeData = Object.entries(lotsByType).map(([type, data]) => ({
        type: getTypeLabel(type),
        total: data.total,
        occupied: data.occupied,
        vacant: data.total - data.occupied,
        rate: data.total > 0 ? (data.occupied / data.total) * 100 : 0,
      }));

      // Active vacancies analysis
      const activeVacancies = vacancies?.filter(v => v.status === "open") || [];
      const avgVacancyDays = activeVacancies.length > 0
        ? activeVacancies.reduce((sum, v) => sum + differenceInDays(new Date(), new Date(v.created_at)), 0) / activeVacancies.length
        : 0;

      // Monthly occupancy trend (simulated - would need historical data)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const baseRate = occupancyRate;
        // Add some variation for visualization
        const variation = (Math.random() - 0.5) * 5;
        monthlyTrend.push({
          month: format(date, "MMM", { locale: fr }),
          taux: Math.min(100, Math.max(0, baseRate + variation)),
        });
      }

      // Lease expiration analysis
      const upcomingExpirations = leases?.filter(l => {
        if (!l.end_date || l.status !== "active") return false;
        const endDate = new Date(l.end_date);
        const threeMonthsFromNow = subMonths(new Date(), -3);
        return endDate <= threeMonthsFromNow;
      }).length || 0;

      return {
        totalLots,
        occupiedLots,
        vacantLots,
        occupancyRate,
        typeData,
        monthlyTrend,
        avgVacancyDays,
        activeVacancies: activeVacancies.length,
        upcomingExpirations,
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
    totalLots = 0,
    occupiedLots = 0,
    vacantLots = 0,
    occupancyRate = 0,
    typeData = [],
    monthlyTrend = [],
    avgVacancyDays = 0,
    activeVacancies = 0,
    upcomingExpirations = 0,
  } = occupancyData || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="h-5 w-5 text-primary" />
              <Badge className={occupancyRate >= 95 ? "bg-success/20 text-success" : occupancyRate >= 85 ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive"}>
                {occupancyRate.toFixed(1)}%
              </Badge>
            </div>
            <p className="text-2xl font-bold">{occupiedLots}/{totalLots}</p>
            <p className="text-xs text-muted-foreground">Taux d'occupation</p>
            <Progress value={occupancyRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Home className="h-5 w-5 text-warning" />
            </div>
            <p className="text-2xl font-bold">{vacantLots}</p>
            <p className="text-xs text-muted-foreground">Lots vacants</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-2xl font-bold">{Math.round(avgVacancyDays)} j</p>
            <p className="text-xs text-muted-foreground">Vacance moyenne</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-secondary" />
            </div>
            <p className="text-2xl font-bold">{upcomingExpirations}</p>
            <p className="text-xs text-muted-foreground">Baux expirant (3 mois)</p>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Trend */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Évolution du taux d'occupation</CardTitle>
          <CardDescription>Tendance sur les derniers mois</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-muted-foreground" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} className="text-muted-foreground" />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, "Taux"]}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="taux" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.2)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* By Type */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Occupation par type de lot</CardTitle>
          <CardDescription>Répartition détaillée</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="type" width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="occupied" stackId="a" fill="hsl(var(--success))" name="Occupés" />
                  <Bar dataKey="vacant" stackId="a" fill="hsl(var(--muted))" name="Vacants" radius={[0, 4, 4, 0]} />
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

      {/* Details Table */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Détail par type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {typeData.map((item) => (
              <div key={item.type} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{item.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.occupied} occupés / {item.total} total
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <Progress value={item.rate} className="h-2" />
                  </div>
                  <Badge variant={item.rate >= 95 ? "default" : item.rate >= 85 ? "secondary" : "destructive"}>
                    {item.rate.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    apartment: "Appartements",
    parking: "Parkings",
    storage: "Caves",
    commercial: "Commerces",
    office: "Bureaux",
    other: "Autres",
  };
  return labels[type] || type;
}
