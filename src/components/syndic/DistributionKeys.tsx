import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DistributionKeysProps { residenceId?: string; }

export function DistributionKeys({ residenceId }: DistributionKeysProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Clés de répartition</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">3 clés configurées: Générale, Ascenseur, Chauffage</p></CardContent>
    </Card>
  );
}
