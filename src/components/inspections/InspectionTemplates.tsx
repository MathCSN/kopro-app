import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InspectionTemplatesProps { residenceId?: string; }

export function InspectionTemplates({ residenceId }: InspectionTemplatesProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Modèles d'état des lieux</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">2 modèles configurés</p></CardContent>
    </Card>
  );
}
