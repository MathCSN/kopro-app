import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WorkOrdersListProps { residenceId?: string; }

export function WorkOrdersList({ residenceId }: WorkOrdersListProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Liste des ordres de service</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">12 ordres en cours, 5 en attente</p></CardContent>
    </Card>
  );
}
