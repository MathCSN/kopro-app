import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkOrderFilters } from "./WorkOrdersFilterSheet";

interface WorkOrdersListProps { 
  residenceId?: string; 
  filters?: WorkOrderFilters;
}

export function WorkOrdersList({ residenceId, filters }: WorkOrdersListProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Liste des ordres de service</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">Aucun ordre de service pour le moment</p></CardContent>
    </Card>
  );
}
