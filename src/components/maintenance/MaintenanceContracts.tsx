import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface MaintenanceContractsProps { residenceIds?: string[]; }

export function MaintenanceContracts({ residenceIds }: MaintenanceContractsProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Contrats de maintenance</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">Aucun contrat actif</p></CardContent>
    </Card>
  );
}