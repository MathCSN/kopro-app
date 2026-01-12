import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowUpRight, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";

interface AccountingOverviewProps {
  residenceId?: string;
}

const expenseColors = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--muted-foreground))",
];

export function AccountingOverview({ residenceId }: AccountingOverviewProps) {
  // Fetch monthly cash flow data
  const { data: monthlyData, isLoading: isLoadingMonthly } = useQuery({
    queryKey: ["accounting-monthly", residenceId],
    queryFn: async () => {
      if (!residenceId) return [];
      
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        
        const { data: lines } = await supabase
          .from("accounting_lines")
          .select("debit, credit")
          .eq("residence_id", residenceId)
          .gte("date", start.toISOString().split('T')[0])
          .lte("date", end.toISOString().split('T')[0]);
        
        const recettes = lines?.reduce((sum, l) => sum + (l.credit || 0), 0) || 0;
        const depenses = lines?.reduce((sum, l) => sum + (l.debit || 0), 0) || 0;
        
        months.push({
          month: format(date, "MMM", { locale: fr }),
          recettes,
          depenses,
        });
      }
      
      return months;
    },
    enabled: !!residenceId,
  });

  // Fetch expense breakdown by account type
  const { data: expenseBreakdown, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["accounting-expenses", residenceId],
    queryFn: async () => {
      if (!residenceId) return [];
      
      const { data: lines } = await supabase
        .from("accounting_lines")
        .select(`
          debit,
          account:accounting_accounts!accounting_lines_account_id_fkey(name, type)
        `)
        .eq("residence_id", residenceId)
        .gt("debit", 0);
      
      // Group by account type
      const grouped: Record<string, number> = {};
      lines?.forEach(line => {
        const accountName = (line.account as any)?.name || "Autres";
        grouped[accountName] = (grouped[accountName] || 0) + (line.debit || 0);
      });
      
      const total = Object.values(grouped).reduce((a, b) => a + b, 0);
      
      return Object.entries(grouped)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value], index) => ({
          name,
          value: total > 0 ? Math.round((value / total) * 100) : 0,
          amount: value,
          color: expenseColors[index % expenseColors.length],
        }));
    },
    enabled: !!residenceId,
  });

  // Fetch recent transactions
  const { data: recentTransactions, isLoading: isLoadingRecent } = useQuery({
    queryKey: ["accounting-recent", residenceId],
    queryFn: async () => {
      if (!residenceId) return [];
      
      const { data } = await supabase
        .from("accounting_lines")
        .select("id, date, label, debit, credit")
        .eq("residence_id", residenceId)
        .order("date", { ascending: false })
        .limit(5);
      
      return data?.map(tx => ({
        id: tx.id,
        label: tx.label || "Transaction",
        amount: tx.credit ? tx.credit : -(tx.debit || 0),
        type: tx.credit ? "credit" : "debit",
        date: format(new Date(tx.date), "dd/MM/yyyy"),
      })) || [];
    },
    enabled: !!residenceId,
  });

  // Fetch unpaid items from copro_call_items
  const { data: unpaidItems, isLoading: isLoadingUnpaid } = useQuery({
    queryKey: ["accounting-unpaid", residenceId],
    queryFn: async () => {
      if (!residenceId) return [];
      
      const { data } = await supabase
        .from("copro_call_items")
        .select(`
          id,
          amount,
          paid_amount,
          lot:lots!copro_call_items_lot_id_fkey(lot_number),
          owner:profiles!copro_call_items_owner_id_fkey(first_name, last_name),
          call:copro_calls!copro_call_items_call_id_fkey(due_date)
        `)
        .eq("status", "pending")
        .limit(5);
      
      return data?.map(item => {
        const dueDate = new Date((item.call as any)?.due_date || new Date());
        const days = Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: item.id,
          lot: `Apt ${(item.lot as any)?.lot_number || "?"}`,
          owner: `${(item.owner as any)?.first_name || ""} ${(item.owner as any)?.last_name || ""}`.trim() || "Inconnu",
          amount: (item.amount || 0) - (item.paid_amount || 0),
          dueDate: format(dueDate, "dd/MM/yyyy"),
          days: Math.max(0, days),
        };
      }) || [];
    },
    enabled: !!residenceId,
  });

  // Show placeholder if no residence selected
  if (!residenceId) {
    return (
      <Card className="shadow-soft">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Sélectionnez une résidence pour voir les données comptables.</p>
        </CardContent>
      </Card>
    );
  }

  const isLoading = isLoadingMonthly || isLoadingExpenses || isLoadingRecent || isLoadingUnpaid;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] lg:col-span-2" />
          <Skeleton className="h-[400px]" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  const hasData = (monthlyData?.length || 0) > 0 || (recentTransactions?.length || 0) > 0;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cash Flow Chart */}
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Évolution des flux financiers</CardTitle>
            <CardDescription>Recettes et dépenses mensuelles</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData && monthlyData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${v/1000}k€`} />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()} €`]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="recettes" 
                      stackId="1"
                      stroke="hsl(var(--success))" 
                      fill="hsl(var(--success) / 0.3)" 
                      name="Recettes"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="depenses" 
                      stackId="2"
                      stroke="hsl(var(--destructive))" 
                      fill="hsl(var(--destructive) / 0.3)" 
                      name="Dépenses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée pour cette période
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Répartition des dépenses</CardTitle>
            <CardDescription>Par catégorie</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseBreakdown && expenseBreakdown.length > 0 ? (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value}%`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {expenseBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune dépense enregistrée
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Dernières opérations</CardTitle>
              <CardDescription>Mouvements récents</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              Voir tout <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions && recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        tx.type === 'credit' ? 'bg-success/10' : 'bg-destructive/10'
                      }`}>
                        {tx.type === 'credit' ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tx.label}</p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${
                      tx.amount > 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} €
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Aucune opération récente
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unpaid Items */}
        <Card className="shadow-soft border-warning/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div>
                <CardTitle className="text-lg">Impayés</CardTitle>
                <CardDescription>Paiements en retard</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-warning border-warning/30">
              {unpaidItems?.length || 0} en retard
            </Badge>
          </CardHeader>
          <CardContent>
            {unpaidItems && unpaidItems.length > 0 ? (
              <div className="space-y-3">
                {unpaidItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <div>
                      <p className="font-medium text-sm">{item.lot} - {item.owner}</p>
                      <p className="text-xs text-muted-foreground">
                        Échéance: {item.dueDate} • {item.days} jours de retard
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-warning">{item.amount.toLocaleString()} €</span>
                      <Button variant="ghost" size="sm" className="ml-2">
                        Relancer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Aucun impayé
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}