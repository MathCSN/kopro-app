import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MaintenanceContractsProps { residenceId?: string; }

export function MaintenanceContracts({ residenceId }: MaintenanceContractsProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Contrats de maintenance</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">5 contrats actifs</p></CardContent>
    </Card>
  );
}
