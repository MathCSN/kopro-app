import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CoproBudgetsProps { residenceId?: string; }

export function CoproBudgets({ residenceId }: CoproBudgetsProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Budgets prévisionnels</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">Budget 2026: 125 000 €</p></CardContent>
    </Card>
  );
}
