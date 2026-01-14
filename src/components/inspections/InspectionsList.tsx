import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface InspectionsListProps { residenceIds?: string[]; }

export function InspectionsList({ residenceIds }: InspectionsListProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>États des lieux</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">Aucun état des lieux programmé</p></CardContent>
    </Card>
  );
}