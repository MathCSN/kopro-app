import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InspectionsListProps { residenceId?: string; }

export function InspectionsList({ residenceId }: InspectionsListProps) {
  return (
    <Card className="shadow-soft">
      <CardHeader><CardTitle>États des lieux</CardTitle></CardHeader>
      <CardContent><p className="text-muted-foreground">3 programmés ce mois</p></CardContent>
    </Card>
  );
}
