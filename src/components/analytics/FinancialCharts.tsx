import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface FinancialChartsProps {
  residenceId?: string;
  period?: string;
}

const data = [
  { month: "Jan", revenus: 42000, depenses: 28000 },
  { month: "Fév", revenus: 45000, depenses: 31000 },
  { month: "Mar", revenus: 43500, depenses: 29500 },
  { month: "Avr", revenus: 46000, depenses: 32000 },
  { month: "Mai", revenus: 44000, depenses: 30000 },
  { month: "Juin", revenus: 47000, depenses: 33000 },
];

export function FinancialCharts({ residenceId, period }: FinancialChartsProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Évolution financière</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `${v/1000}k€`} />
              <Tooltip formatter={(value: number) => [`${value.toLocaleString()} €`]} />
              <Area type="monotone" dataKey="revenus" stroke="hsl(var(--success))" fill="hsl(var(--success) / 0.3)" name="Revenus" />
              <Area type="monotone" dataKey="depenses" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.3)" name="Dépenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
