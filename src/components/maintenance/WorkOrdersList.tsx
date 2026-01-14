import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkOrderFilters } from "./WorkOrdersFilterSheet";

export interface WorkOrdersListProps { 
  residenceIds?: string[]; 
  filters?: WorkOrderFilters;
}

export function WorkOrdersList({ residenceIds, filters }: WorkOrdersListProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Liste des ordres de service</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">Aucun ordre de service pour le moment</p></CardContent>
    </Card>
  );
}