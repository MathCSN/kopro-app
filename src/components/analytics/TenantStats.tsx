import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, Calendar, TrendingUp, TrendingDown, Clock, Home, Euro } from "lucide-react";
import { format, differenceInMonths, differenceInYears, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

interface TenantStatsProps {
  residenceId?: string;
  period?: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--secondary))",
  "hsl(var(--destructive))",
];

export function TenantStats({ residenceId, period }: TenantStatsProps) {
  const { data: tenantData, isLoading } = useQuery({
    queryKey: ["tenant-analytics", residenceId, period],
    queryFn: async () => {
      if (!residenceId) return null;

      // Get leases with tenant info
      const { data: leases, error: leasesError } = await supabase
        .from("leases")
        .select(`
          id,
          start_date,
          end_date,
          status,
          current_rent,
          charges_amount,
          tenant_id,
          lot:lots(lot_number, type),
          tenant:profiles(first_name, last_name, created_at)
        `)
        .eq("residence_id", residenceId)
        .eq("status", "active");

      if (leasesError) throw leasesError;

      // Get payments for analysis
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("amount, status, due_date, paid_at, user_id")
        .eq("residence_id", residenceId)
        .eq("type", "rent");

      if (paymentsError) throw paymentsError;

      // Calculate tenant stats
      const totalTenants = leases?.length || 0;
      
      // Calculate average tenure
      const tenures = leases?.map(l => {
        const startDate = new Date(l.start_date);
        return differenceInMonths(new Date(), startDate);
      }) || [];
      const avgTenureMonths = tenures.length > 0 
        ? tenures.reduce((a, b) => a + b, 0) / tenures.length 
        : 0;
      const avgTenureYears = avgTenureMonths / 12;

      // Tenure distribution
      const tenureDistribution = {
        "< 1 an": 0,
        "1-2 ans": 0,
        "2-5 ans": 0,
        "5-10 ans": 0,
        "> 10 ans": 0,
      };
      tenures.forEach(months => {
        const years = months / 12;
        if (years < 1) tenureDistribution["< 1 an"]++;
        else if (years < 2) tenureDistribution["1-2 ans"]++;
        else if (years < 5) tenureDistribution["2-5 ans"]++;
        else if (years < 10) tenureDistribution["5-10 ans"]++;
        else tenureDistribution["> 10 ans"]++;
      });
      const tenureData = Object.entries(tenureDistribution).map(([name, value]) => ({ name, value }));

      // Payment behavior analysis
      const paymentsByTenant: Record<string, { onTime: number; late: number; total: number }> = {};
      payments?.forEach(p => {
        if (!p.user_id) return;
        if (!paymentsByTenant[p.user_id]) {
          paymentsByTenant[p.user_id] = { onTime: 0, late: 0, total: 0 };
        }
        paymentsByTenant[p.user_id].total++;
        if (p.paid_at && p.due_date) {
          if (new Date(p.paid_at) <= new Date(p.due_date)) {
            paymentsByTenant[p.user_id].onTime++;
          } else {
            paymentsByTenant[p.user_id].late++;
          }
        }
      });

      const goodPayers = Object.values(paymentsByTenant).filter(
        p => p.total > 0 && (p.onTime / p.total) >= 0.9
      ).length;
      const goodPayerRate = totalTenants > 0 ? (goodPayers / totalTenants) * 100 : 0;

      // Average rent
      const avgRent = leases && leases.length > 0
        ? leases.reduce((sum, l) => sum + (l.current_rent || 0), 0) / leases.length
        : 0;
      const avgCharges = leases && leases.length > 0
        ? leases.reduce((sum, l) => sum + (l.charges_amount || 0), 0) / leases.length
        : 0;

      // Lease type distribution (by lot type)
      const lotTypeDistribution: Record<string, number> = {};
      leases?.forEach(l => {
        const type = (l.lot as any)?.type || "other";
        lotTypeDistribution[type] = (lotTypeDistribution[type] || 0) + 1;
      });
      const lotTypeData = Object.entries(lotTypeDistribution).map(([type, count]) => ({
        name: getLotTypeLabel(type),
        value: count,
      }));

      // Recent renewals / new tenants
      const sixMonthsAgo = subMonths(new Date(), 6);
      const newTenantsCount = leases?.filter(l => 
        new Date(l.start_date) >= sixMonthsAgo
      ).length || 0;

      // Top tenants by tenure
      const topTenants = leases
        ?.map(l => ({
          name: `${(l.tenant as any)?.first_name || ""} ${(l.tenant as any)?.last_name || ""}`.trim() || "N/A",
          lot: (l.lot as any)?.lot_number || "-",
          startDate: l.start_date,
          tenure: differenceInMonths(new Date(), new Date(l.start_date)),
          rent: l.current_rent || 0,
        }))
        .sort((a, b) => b.tenure - a.tenure)
        .slice(0, 5) || [];

      return {
        totalTenants,
        avgTenureYears,
        avgRent,
        avgCharges,
        goodPayerRate,
        newTenantsCount,
        tenureData,
        lotTypeData,
        topTenants,
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
    totalTenants = 0,
    avgTenureYears = 0,
    avgRent = 0,
    avgCharges = 0,
    goodPayerRate = 0,
    newTenantsCount = 0,
    tenureData = [],
    lotTypeData = [],
    topTenants = [],
  } = tenantData || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{totalTenants}</p>
            <p className="text-xs text-muted-foreground">Locataires actifs</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-secondary" />
              <Badge variant="outline" className={avgTenureYears >= 3 ? "text-success border-success/30" : "text-warning border-warning/30"}>
                {avgTenureYears >= 3 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {avgTenureYears >= 3 ? "Stable" : "Rotation"}
              </Badge>
            </div>
            <p className="text-2xl font-bold">{avgTenureYears.toFixed(1)} ans</p>
            <p className="text-xs text-muted-foreground">Ancienneté moyenne</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Euro className="h-5 w-5 text-success" />
            </div>
            <p className="text-2xl font-bold">{avgRent.toLocaleString()} €</p>
            <p className="text-xs text-muted-foreground">Loyer moyen (+ {avgCharges.toLocaleString()} € charges)</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <p className="text-2xl font-bold">{goodPayerRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Bons payeurs</p>
            <Progress value={goodPayerRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenure Distribution */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Répartition par ancienneté</CardTitle>
            <CardDescription>Durée d'occupation des locataires</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {tenureData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tenureData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Locataires" />
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

        {/* Lot Type Distribution */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Par type de lot</CardTitle>
            <CardDescription>Répartition des locataires</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {lotTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={lotTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {lotTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-soft border-success/30 bg-success/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center shrink-0">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Nouveaux locataires</h3>
              <p className="text-sm text-muted-foreground">
                {newTenantsCount} arrivée{newTenantsCount > 1 ? "s" : ""} ces 6 derniers mois
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Loyer total mensuel</h3>
              <p className="text-sm text-muted-foreground">
                {(avgRent * totalTenants).toLocaleString()} € (hors charges)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Tenants */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Locataires les plus anciens</CardTitle>
          <CardDescription>Top 5 par durée d'occupation</CardDescription>
        </CardHeader>
        <CardContent>
          {topTenants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Locataire</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Entrée</TableHead>
                  <TableHead>Ancienneté</TableHead>
                  <TableHead className="text-right">Loyer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topTenants.map((tenant, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>{tenant.lot}</TableCell>
                    <TableCell>{format(new Date(tenant.startDate), "MMM yyyy", { locale: fr })}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {(tenant.tenure / 12).toFixed(1)} ans
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{tenant.rent.toLocaleString()} €</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-muted-foreground">Aucun locataire</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getLotTypeLabel(type: string): string {
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
