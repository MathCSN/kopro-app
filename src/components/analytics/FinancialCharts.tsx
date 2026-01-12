import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { Euro, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

interface FinancialChartsProps {
  residenceId?: string;
  period?: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--secondary))",
  "hsl(var(--destructive))",
  "hsl(var(--accent))",
];

export function FinancialCharts({ residenceId, period }: FinancialChartsProps) {
  const monthsBack = period === "1m" ? 1 : period === "3m" ? 3 : period === "6m" ? 6 : 12;

  const { data: financialData, isLoading } = useQuery({
    queryKey: ["financial-analytics", residenceId, period],
    queryFn: async () => {
      if (!residenceId) return null;

      const startDate = startOfMonth(subMonths(new Date(), monthsBack));

      // Get accounting lines for revenue/expense
      const { data: lines, error: linesError } = await supabase
        .from("accounting_lines")
        .select(`
          date,
          debit,
          credit,
          label,
          account:accounting_accounts(type, name)
        `)
        .eq("residence_id", residenceId)
        .gte("date", startDate.toISOString());

      if (linesError) throw linesError;

      // Get payments for rent analysis
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("amount, type, status, due_date, paid_at")
        .eq("residence_id", residenceId)
        .gte("due_date", startDate.toISOString());

      if (paymentsError) throw paymentsError;

      // Process monthly data
      const monthlyData: Record<string, { revenus: number; depenses: number }> = {};
      const categoryData: Record<string, number> = {};

      lines?.forEach((line: any) => {
        const month = format(new Date(line.date), "MMM yy", { locale: fr });
        if (!monthlyData[month]) {
          monthlyData[month] = { revenus: 0, depenses: 0 };
        }
        
        const accountType = line.account?.type || "";
        if (accountType === "revenue" || line.credit > 0) {
          monthlyData[month].revenus += line.credit || 0;
        }
        if (accountType === "expense" || line.debit > 0) {
          monthlyData[month].depenses += line.debit || 0;
          const category = line.account?.name || "Autres";
          categoryData[category] = (categoryData[category] || 0) + (line.debit || 0);
        }
      });

      // Add payment data
      payments?.forEach((payment: any) => {
        const month = format(new Date(payment.due_date), "MMM yy", { locale: fr });
        if (!monthlyData[month]) {
          monthlyData[month] = { revenus: 0, depenses: 0 };
        }
        if (payment.status === "paid") {
          monthlyData[month].revenus += payment.amount || 0;
        }
      });

      const chartData = Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      const categoryChartData = Object.entries(categoryData)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      // Calculate totals
      const totalRevenus = Object.values(monthlyData).reduce((sum, m) => sum + m.revenus, 0);
      const totalDepenses = Object.values(monthlyData).reduce((sum, m) => sum + m.depenses, 0);
      const balance = totalRevenus - totalDepenses;

      // Payment collection rate
      const totalDue = payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
      const totalPaid = payments?.filter((p: any) => p.status === "paid").reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
      const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

      return {
        chartData,
        categoryChartData,
        totalRevenus,
        totalDepenses,
        balance,
        collectionRate,
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

  const { chartData = [], categoryChartData = [], totalRevenus = 0, totalDepenses = 0, balance = 0, collectionRate = 0 } = financialData || {};

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Euro className="h-5 w-5 text-success" />
              <Badge variant="outline" className="text-success border-success/30">
                <TrendingUp className="h-3 w-3 mr-1" />
                Revenus
              </Badge>
            </div>
            <p className="text-2xl font-bold">{totalRevenus.toLocaleString()} €</p>
            <p className="text-xs text-muted-foreground">Total encaissé</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Euro className="h-5 w-5 text-destructive" />
              <Badge variant="outline" className="text-destructive border-destructive/30">
                <TrendingDown className="h-3 w-3 mr-1" />
                Dépenses
              </Badge>
            </div>
            <p className="text-2xl font-bold">{totalDepenses.toLocaleString()} €</p>
            <p className="text-xs text-muted-foreground">Total décaissé</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
            <p className={`text-2xl font-bold ${balance >= 0 ? "text-success" : "text-destructive"}`}>
              {balance >= 0 ? "+" : ""}{balance.toLocaleString()} €
            </p>
            <p className="text-xs text-muted-foreground">Solde net</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{collectionRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Taux de recouvrement</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Évolution financière</CardTitle>
          <CardDescription>Revenus et dépenses mensuels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-muted-foreground" />
                  <YAxis tickFormatter={(v) => `${v/1000}k€`} className="text-muted-foreground" />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} €`]}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenus" 
                    stroke="hsl(var(--success))" 
                    fill="hsl(var(--success) / 0.3)" 
                    name="Revenus" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="depenses" 
                    stroke="hsl(var(--destructive))" 
                    fill="hsl(var(--destructive) / 0.3)" 
                    name="Dépenses"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Aucune donnée pour cette période
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Répartition des dépenses</CardTitle>
            <CardDescription>Par catégorie comptable</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()} €`]}
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

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Top catégories</CardTitle>
            <CardDescription>Principales sources de dépenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tickFormatter={(v) => `${v/1000}k€`} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()} €`]}
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
      </div>
    </div>
  );
}
