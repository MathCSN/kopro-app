import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface AccountingOverviewProps {
  residenceId?: string;
}

const monthlyData = [
  { month: "Jan", recettes: 42000, depenses: 28000 },
  { month: "Fév", recettes: 45000, depenses: 31000 },
  { month: "Mar", recettes: 43500, depenses: 29500 },
  { month: "Avr", recettes: 46000, depenses: 32000 },
  { month: "Mai", recettes: 44000, depenses: 30000 },
  { month: "Juin", recettes: 47000, depenses: 33000 },
  { month: "Juil", recettes: 45500, depenses: 31500 },
  { month: "Août", recettes: 44000, depenses: 29000 },
  { month: "Sep", recettes: 46500, depenses: 32500 },
  { month: "Oct", recettes: 48000, depenses: 34000 },
  { month: "Nov", recettes: 45000, depenses: 31000 },
  { month: "Déc", recettes: 45280, depenses: 32150 },
];

const expenseBreakdown = [
  { name: "Entretien", value: 35, color: "hsl(var(--primary))" },
  { name: "Assurances", value: 20, color: "hsl(var(--secondary))" },
  { name: "Énergie", value: 25, color: "hsl(var(--warning))" },
  { name: "Personnel", value: 15, color: "hsl(var(--success))" },
  { name: "Autres", value: 5, color: "hsl(var(--muted-foreground))" },
];

const recentTransactions = [
  { id: 1, label: "Appel de fonds Q4", amount: 15000, type: "credit", date: "05/01/2026" },
  { id: 2, label: "Facture électricité", amount: -2450, type: "debit", date: "03/01/2026" },
  { id: 3, label: "Contrat maintenance ascenseur", amount: -850, type: "debit", date: "02/01/2026" },
  { id: 4, label: "Régularisation charges M. Martin", amount: 320, type: "credit", date: "01/01/2026" },
  { id: 5, label: "Assurance multirisque", amount: -3200, type: "debit", date: "28/12/2025" },
];

const unpaidItems = [
  { id: 1, lot: "Apt 5A", owner: "M. Dubois", amount: 1250, dueDate: "15/12/2025", days: 27 },
  { id: 2, lot: "Apt 12C", owner: "Mme Lefebvre", amount: 890, dueDate: "01/01/2026", days: 10 },
  { id: 3, lot: "Apt 3B", owner: "SCI Immovest", amount: 2100, dueDate: "20/12/2025", days: 22 },
];

export function AccountingOverview({ residenceId }: AccountingOverviewProps) {
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
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Répartition des dépenses</CardTitle>
            <CardDescription>Par catégorie</CardDescription>
          </CardHeader>
          <CardContent>
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {expenseBreakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
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
              {unpaidItems.length} en retard
            </Badge>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
