import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface InspectionTemplatesProps { residenceIds?: string[]; }

export function InspectionTemplates({ residenceIds }: InspectionTemplatesProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>Modèles d'état des lieux</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">Aucun modèle configuré</p></CardContent>
    </Card>
  );
}