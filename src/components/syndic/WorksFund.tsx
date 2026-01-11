import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WorksFundProps { residenceId?: string; }

export function WorksFund({ residenceId }: WorksFundProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Fonds travaux</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">Solde actuel: 45 000 €</p></CardContent>
    </Card>
  );
}
