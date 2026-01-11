import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CoproCallsProps { residenceId?: string; }

export function CoproCalls({ residenceId }: CoproCallsProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Appels de fonds</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">4 appels trimestriels programmés</p></CardContent>
    </Card>
  );
}
